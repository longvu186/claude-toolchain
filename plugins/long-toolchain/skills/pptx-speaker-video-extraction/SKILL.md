---
name: pptx-speaker-video-extraction
description: "Reconstruct reliable speaker-to-video mappings and bios from an organizer-supplied .pptx deck when its embedded hyperlinks are stale/tangled (copy-pasted from a prior year). Use for conference/event speaker onboarding: extracting names, talk titles, photos, and correct video links from a slide deck. Trigger phrases: pptx speaker extraction, speaker deck, extract hyperlinks from pptx, reconcile speaker videos, YouTube oEmbed verification, video description scraping."
---

# PPTX Speaker/Video Extraction

Event organizers often hand over a `.pptx` with speaker names, talk titles, and headshots, where the
embedded hyperlinks are unreliable — commonly because the deck was cloned from a prior year and several
run-level hyperlinks still point at last year's videos. Naively trusting "the link on this slide" produces
wrong speaker→video mappings. This is the reliable reconstruction sequence.

## 1. Parse hyperlinks at the run level, not the paragraph level

Unzip the pptx (`unzip deck.pptx -d extracted/`) and parse `ppt/slides/slideN.xml` plus its
`ppt/slides/_rels/slideN.xml.rels` with a plain XML parser (fast-xml-parser, lxml, etc.).

- Walk each `a:r` (run) inside a paragraph, not the paragraph as a whole. Look for `a:rPr > a:hlinkClick`
  with an `r:id` attribute, then resolve that `r:id` against the `.rels` file's `Relationship
Id="rIdN" Target="..."` to get the actual URL.
- **Do not** look up hyperlinks at the paragraph level — a paragraph can contain multiple runs with
  different (and stale, overlapping) `hlinkClick` targets left over from a copy-pasted prior-year slide.
  Paragraph-level lookups will pick up the wrong one silently.

## 2. Cross-verify every extracted video ID against its own metadata

Raw `r:id` hyperlinks can still be wrong even after correct run-level parsing (the deck author may have
pasted the wrong slide's link wholesale). For each extracted YouTube video ID, fetch its own title via
oEmbed — no auth needed:

```
https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json
```

Match the returned `title` against the known agenda/talk-title list (from the CFP program, the event's
schedule page, etc.). A mismatch means the pptx hyperlink for that speaker is wrong — trust the title
match, not the raw link. This is what disambiguates speakers whose raw hyperlinks got tangled.

## 3. Get speaker bios from the video description, not web search

When the pptx doesn't include speaker job titles/roles, do not fabricate them or guess loosely from a
general web/LinkedIn search — treat the official event-published YouTube video description as the
authoritative source (it's usually written and reviewed by the organizer).

- `WebFetch`'s own page summarizer truncates YouTube descriptions before the full text is visible —
  it is not sufficient on its own.
- Fetch the raw page instead: `curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" <video_url>`, then
  regex out the embedded JSON field `"shortDescription":"..."` from the HTML response. This returns the
  full, untruncated description text to parse for role/title/bio lines.

## 4. Resize photos before shipping

PPTX-embedded media files (`ppt/media/imageN.*`) are usually far larger than needed for web (commonly
3–4k px wide, 1–3.6 MB each). Resize before committing to the repo:

```
ffmpeg -i imageN.jpeg -vf scale=1600:-1 -q:v 4 output.jpeg
```

~1600px wide at quality 4 is a good default for a speaker headshot card; adjust width down further for
small grid thumbnails.

## Verification checklist

- [ ] Every speaker's video ID's oEmbed title matches its known agenda talk title (not just "a link was found").
- [ ] Bios are sourced from the video's own description text, not search-engine guesses.
- [ ] Photos are resized before committing (check file size, not just that a resize command ran).
- [ ] If any speaker's talk title has no exact video-title match, flag it for human confirmation rather
      than guessing the closest one.
