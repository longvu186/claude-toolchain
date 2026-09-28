# Social video: specs, safe zones, captions, Vietnamese type (Sept 2026)

Evidence: `research/programmatic-video/03-product-demo-and-social.md` §3–5 and §9–10b. Aggregator figures drift, so
re-check official pages before a big campaign.

## Universal vertical master (satisfies TikTok, Reels, Shorts and FB API limits for ≤ 3 min)

```bash
ffmpeg -i master.mov -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow \
  -crf 18 -maxrate 16M -bufsize 32M -r 30 -g 15 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 256k -ar 48000 -ac 2 -movflags +faststart out_1080x1920.mp4
```

Use 30 fps CFR by default, and 60 for fast UI scrolling (Instagram may play at 30 anyway).

## Platform table

| Platform | Frame | Length | Hard limits worth knowing |
|---|---|---|---|
| TikTok | 1080×1920 | Ads 15–30 s ideal. **API ≤ 10 min** | API: 23–60 fps, ≤ 4 GB. No sidecar captions, so burn them in. **Business accounts may only use Commercial Music Library sounds** |
| Instagram Reels | 1080×1920 | Keep ≤ 3 min (longer isn't recommended to non-followers) | **API: ≤ 300 MB, ≤ 25 Mbps, moov first, closed GOP, 3 s–15 min, AAC ≤ 48 kHz.** Grid crops the cover to **3:4** |
| Facebook Reels | 1080×1920 | 15–60 s performs best | All uploads become Reels. SRT upload supported |
| YouTube Shorts | 1080×1920 or 1:1 | **≤ 3 min** | Audio-library songs usable ≤ 90 s. SRT/VTT |
| YouTube long-form | 1920×1080 / 4K | — | H.264 High, closed GOP = fps/2, 2 B-frames, 8 Mbps (30p) / 12 Mbps (60p), AAC 48 kHz 384k, BT.709. Chapters need `00:00` first, ≥ 3 entries, each ≥ 10 s |
| LinkedIn | 16:9, 1:1, 4:5, 9:16 | Ads 3 s–30 min | Ads ≤ 500 MB, 30 fps. Feeds skew sound-off, so **burn captions in AND upload the SRT** (the sidecar is for accessibility and search) |
| X | 16:9 or 9:16 | Free accounts ≤ 2:20 | ≤ 512 MB (third-party figure) |

## Safe zones at 1080×1920

| Source | Top | Bottom | Left | Right |
|---|---|---|---|---|
| Meta Reels + Stories (unified March 2026) | 14% ≈ 270 | 35% ≈ 672 (40% with disclaimers) | 6% ≈ 65 | 6% ≈ 65 |
| YouTube (Google vertical figures) | 288 | 672 | 48 | 192 |
| TikTok | Varies with caption length. Use the Ads Manager templates. Conservative: 120–240 | 378–653 | 60–80 | 108–140 |
| **Cross-post box (use this)** | **288** | **672** | **80** | **192** |

The usable box is **x 80–888, y 288–1248** (808×960).
- Burned captions go at **y ≈ 1000–1240**, centred at x ≈ 484, or frame-centred with max width 696 px.
- Nothing important goes on the right rail.
- Generate a safe-zone overlay PNG and review stills with it composited on top (`qa-and-delivery.md`).

## What performs (evidence graded in the research file)

- **Hook in 0–2 s.** TikTok (official) says to introduce the proposition within 3 s and place the hook within 6 s,
  with most recall value in the first 2–2.5 s. Show the outcome first. No intro card, no logo sting.
- **Design for sound on *and* sound off.** TikTok users are 88–93% sound-on. Meta reports captions add ~12% view time.
  "85% watch muted" is a 2016 publisher self-report, so don't cite it as a fact.
- **Text density.** TikTok caps on-screen text at 5–10 words/s. Keep ≤ ~5 words per beat. Product UI needs ≥ 1.5 s per
  shot to be readable.
- **Cut frequency** ("cut every 1.5–3 s") is anecdotal. A 2026 study of 10k brand TikToks found most structural
  variables had no effect, so A/B test the hook, not the folklore.
- **Looping.** A last frame that flows into the first inflates watch percentage.
- **Brand system in the template:** type, colour, easing, caption style, logo slot, end card, SFX kit. Custom or
  original audio beats recognisable tracks for brand recall (platform-reported).

## Caption styles

- **"Hormozi" style:** 2–3 words, heavy caps, thick outline, active word in yellow or green, micro pop.
- **Calmer B2B variant:** sentence case, brand font, highlight pill.
- Remotion reference components: word-highlight, moving-pill, popping-words.
- **Legibility at 1080×1920:**
  - Word-pop styles: 64–96 px cap height, weight 700–900, 6–10 px dark outline or a 70–85% pill.
  - Sentence captions: 48–60 px.
  - ≤ 2 lines, never over the UI element being demonstrated.
- **Outlines.** `-webkit-text-stroke` on **variable fonts** draws the internal contours (a known Montserrat bug). Use
  a static instance, a multi-layer text-shadow, or `paint-order: stroke fill` on SVG text.
- **Remotion paging:**
  ```ts
  createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 800})
  ```
  Every token after the first **must include its leading space**. Render with `white-space: pre`.

## Vietnamese: font coverage is a correctness issue

Verified against the Google Fonts CSS API on 2026-09-28:

| Has the `vietnamese` subset (safe) | **No** Vietnamese (falls back glyph by glyph, "ransom note") |
|---|---|
| **Be Vietnam Pro** (designed for Vietnamese), Montserrat, Inter, Anton, Oswald, Lexend, Barlow Condensed, Roboto, Noto Sans, Nunito, League Spartan, Plus Jakarta Sans, Big Shoulders Display | **Poppins, Bebas Neue, Archivo Black** (popular caption and display defaults) |

For any font not in this table, check `https://fonts.googleapis.com/css2?family=<Name>` for a `/* vietnamese */`
block before using it.

Rendering rules:
1. **NFC-normalise** all text (`s.normalize('NFC')`) before rendering, splitting, TTS and timestamp matching. macOS
   filenames, some IMEs and ASR output arrive decomposed (NFD).
2. **Stacked diacritics need headroom** (ấ ầ ẩ ẫ ậ ế ệ ố ộ, and in caps Ấ Ể Ộ):
   - Line-height ≥ 1.25 in mixed case, 1.3–1.4 in all caps.
   - Extra top padding on pills, **no `overflow:hidden`** on caption lines.
   - Mask and clip rects follow the measured ascent (`actualBoundingBoxAscent`), not the font size.
3. **Prefer sentence case.** All-caps Vietnamese loses legibility unless the font designs its capital accents (Be
   Vietnam Pro does).
4. **Proof at render size:** "người", "Trường", "được", "Ưu đãi" (horn letters ư/ơ collide in weak fonts).
5. **Vietnamese is space-separated by syllable.** ASR and Whisper "words" are syllables, so group 2–4 syllables per
   caption page, keeping compounds like "Việt Nam" and "phần mềm" together.
6. **Self-hosted fonts.** Ship the `vietnamese` unicode-range slice. For headless renders, install the files locally
   and await them.
7. **ffmpeg drawtext** needs a HarfBuzz build. libass needs a font that actually contains the glyphs. Rendering captions
   in the browser avoids both problems.
8. **Size caption boxes from the longest locale.** Vietnamese often runs longer than English.
9. **Copy.** No unprovable "nhất" (best/most) superlatives in ads. For Vietnamese copy, use the `vi-copywriting` skill.

## Kinetic on-screen text density (not captions)

- ≤ ~5 words (Vietnamese: ≤ ~7 syllables) on screen per beat.
- Hold each block for `max(0.833 s, chars/15, words/2.7)` from the moment it is readable. **Use chars/13 for
  Vietnamese, and count syllables as words**: its caption cap is 17 cps versus 20 for English, so scale display text the same way.
- TikTok's "5–10 words/s" is a ceiling for very short flashes, not a target.
- With a voiceover, on-screen text must be *keywords*, not the transcript.

## Footage and stills (non-software promos: food, venues, products)

- **Use real photos or footage of the real product.** Never generate images of real menu items, venues or products
  with AI: it misrepresents what the customer will get. AI B-roll is acceptable only for abstract mood backgrounds,
  and never with text.
- Ask the client for assets first. Until they arrive, build with clearly labelled placeholders.
- **Animate stills in the compositor** (canvas or Remotion transforms: scale 1.0→1.08 over the hold with ease-in-out,
  slight drift in the film's dominant direction). Avoid ffmpeg `zoompan`, which jitters unless the source is first
  upscaled to ~4× the output width.
- Photos need ≥ 2× the displayed size for crisp motion. Put a scrim under any text over a photo (contrast rule 5 in
  `motion-craft.md`).

## Music licensing (attach a licence record to every render)

| Source | Rule |
|---|---|
| TikTok Commercial Music Library | The only music business accounts may use on TikTok. It applies only when the sound is added **inside TikTok**, not baked into the file |
| YouTube Audio Library | Standard-licence tracks are **YouTube-only**. CC-BY tracks can be used anywhere with credit |
| Pixabay | Commercial use allowed, but Content ID claims happen and there is **$0 indemnification** |
| Epidemic Sound / Uppbeat | **Paid ads need the Pro / Business tier** |
| Artlist | Companies over 50 people need Max Business |
| Suno | Commercial use **only on Pro/Premier and only via a permitted download** (terms effective 2026-09-03) |
| Udio | Downloads disabled, so unusable |
| ElevenLabs Music | Self-serve reportedly excludes film, TV and games |
| Meta (Instagram/Facebook business accounts) | Meta offers an in-app licensed sound collection for business use, but its exact terms were **not verified** in the 2026-09 research. Treat it like TikTok CML: add sounds in-app only, and check the current Meta terms before claiming coverage |
| **Procedural synth (`templates/showreel/synth.cjs`)** | Yours, no licence needed. The safest default for stings and short promos |

When no licensed track is available, deliver a no-music master plus a beat cue sheet so the operator can add a cleared
sound in the platform's editor. Optionally add a synth-bed version as well.

## Variant matrix

`hooks(3) × locales(vi, en) × lengths(15/30) × aspects`

- Name files deterministically: `{campaign}_{hook}_{locale}_{len}s_{aspect}.mp4`.
- Change **only the hook** between A/B variants.
- TikTok recommends 3–5 creatives per ad group.
- Make one cover per variant, designed for the 3:4 grid crop.
