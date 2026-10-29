# Footage editing: talking heads, vlogs, long-to-short (mined 2026-10-30)

This file covers jobs that start from **recorded footage**, not from code: a talking-head take, a vlog, a webinar to
cut into shorts, a screen recording with voice. Evidence: research `08-github-skill-mining.md`. Vendored tools sit in
`vendor/herk-cuts@…` and `vendor/video-use@…`, both MIT.

## The pipeline

```
ffprobe + word-level transcript (cached) → silence pass → mistake pass (review-gated) → story/keep decisions
→ plain-English strategy, CONFIRMED by the user → render per segment → overlays → captions LAST → self-eval → loudness
```

1. **Transcribe once, word-level, verbatim.**
   - Use word timestamps with fillers kept, never SRT/phrase mode. Phrase mode loses the sub-second gaps that cuts
     need, and normalised fillers lose the editing signal.
   - Cache the JSON per source file. Re-transcribe only if the file changed.
   - Local option: faster-whisper / whisperX. Cloud option: ElevenLabs Scribe (video-use's default).
   - Vietnamese: whisper large-v3 handles it. Check names and brand words by hand.
2. **Cut from the transcript, never from volume.** One measured case: a volume-only `silencedetect` cut of a
   34-minute class gave ~800 choppy pieces, while word-timestamp cutting gave 120 pieces the creator liked. Use the
   waveform only to refine edges.
3. **Silence pass** (deterministic):
   ```
   node vendor/herk-cuts@*/cut-silences/scripts/cut-silences.mjs words.json --video raw.mp4 --out-dir edit/ [--apply]
   ```
   - Pauses ≥ `--gap` (0.55 s) are trimmed, but a breath is kept: 0.24 s after a long pause, 0.20 s after `.!?`,
     0.14 s otherwise.
   - Head and tail pads are 0.22 s and 0.34 s.
   - It writes the EDL, a re-timed transcript (feed this to the next step) and a decisions file.
   - It typically removes 15–20 % of a raw take.
   - Tested here on a Vietnamese transcript.
4. **Mistake pass** (stutters, retakes, false starts). `find-cut-candidates.mjs` → **you review every candidate in
   context** → `apply-cuts.mjs --cuts approved.json`.
   - Emphatic repetition ("never, never") looks identical to a stutter, so never apply `recommend` blindly.
   - Zero real cuts is a valid result.
5. **Story decisions are yours; cut placement is the script's.**
   - Decide what stays by word index (keep-list).
   - Retakes: keep the best complete take, usually the last, and cut the restart cue with it.
   - Spoken notes to the editor ("roll the demo here") become markers, not footage.
   - Fillers stay in a vlog.
   - Unsure? Keep it and flag it. A flag costs the user 5 s; a wrong cut is invisible to them.
6. **Confirm the strategy before touching the cut.** In 4–8 plain sentences, cover:
   - shape and take choices
   - cut direction
   - overlays
   - grade
   - caption style
   - length estimate

   Wait for a yes.

## Pacing numbers (measured by creators; facts restated, source CC BY-NC so not vendored)

| Setting | Tutorial / class | Vlog |
|---|---|---|
| Shorten pauses longer than | 0.5 s | **1.0 s** |
| …down to | 0.3 s | **0.6 s** (0.5/0.3 felt "popping" on a vlog) |
| Silence threshold | below −43 dB for ≥ 0.25 s | same |
| Word pad | start −0.08 s, end +0.12 s, snapped to the nearest silence edge | same |
| Scene edge room | 0.5 s before the first word, 0.6 s after the last | same |

- **Cut padding window 30–200 ms.** Scribe/whisper timestamps drift 50–100 ms. Tighter for montage, looser for
  documentary.
- Silences ≥ 400 ms are the cleanest cut points. 150–400 ms are usable after a visual check. **< 150 ms is mid-phrase:
  don't.**
- Speaker hand-offs keep 400–600 ms of air. Extend past laughs and reactions: the laugh is the beat.
- **Jump-cut framing.** Alternate 100 % / 107.5 % on jump cuts *inside* one scene. A new scene or B-roll opens at
  100 %. Punch in to 115 % only on the punchline, splitting at its first word **and** right after its last word: one
  missing split held a punch-in for 83 s.
- "It's choppy" → **measure first.** Count the cuts that come from pause shortening, from scene edges and from zoom
  toggles. The usual fix is looser pauses, more scene room and no zoom change at scene cuts.

## Hard render rules (silent-failure class; from video-use)

1. **Captions are the last filter**, after every overlay, or overlays hide them.
2. **Extract each segment, then `-c copy` concat**, rather than one giant filtergraph that re-encodes once per
   overlay.
3. **30 ms audio fade at every segment boundary**:
   `afade=t=in:st=0:d=0.03,afade=t=out:st={dur-0.03}:d=0.03`. Without it every cut pops.
4. **Overlay PTS shift:** `setpts=PTS-STARTPTS+T/TB`. Without it the overlay plays from its middle.
5. **Caption times on the output timeline:** `out = word.start − segment.start + segment.offset`.
6. **Never cut inside a word.** Every edge snaps to a word boundary.
7. Never reason about audio and video independently: every cut must work on both tracks.

## Captions on footage: drop / rail / embed (HyperFrames doctrine)

| Class | What | Shown as |
|---|---|---|
| drop | um/uh, stutters, self-corrections | not shown |
| rail (default) | ordinary speech, verbatim | clean lower line **in front**; a punch word may get an accent colour |
| embed (scarce) | the headline beat | one big word **behind the subject** (matte); ≤ 1 per beat, never two co-visible |

- A caption is an **overlay, not a reserved band.** Centre the composition on the true vertical centre and don't push
  content up.
- Keep critical small text (URL, legal) out of the bottom ~80 px centre span.
- Vietnamese limits still apply (`audio-voice-captions.md`): ≤ 17 cps, ≤ 42 chars per line.

## Long → shorts

- Score 8–12 candidate segments of 15–55 s. Hook strength carries the most weight (≈ 0.30); the other weights are
  payoff, standalone clarity, emotion and pace.
- Write a 2-line hook overlay for the first 3 s.
- **Let the user pick**; never auto-publish.
- Reframe 16:9 → 9:16 by tracking the speaker's face or using a fixed crop. Use the 9:16 safe box from `social.md`.

## Self-eval before showing anyone (cap: 3 passes)

- At every cut ±1.5 s on the **rendered output**, check for: a visual jump or flash, a waveform spike (a pop that got
  past the fade), a caption hidden under an overlay, an overlay on the wrong frames.
- Sample the first 2 s, the last 2 s and 2–3 midpoints.
- `ffprobe` the duration against the EDL total.
- Measure loudness per section: dialogue vs music-only vs end card. An end card 15 dB under the dialogue is a bug.
- For anything published, run one **critic subagent** that sees only the render, the EDL and the references. Brief it
  to roast: ranked problems with timecodes, then the 5 fixes to do first.
- `qa.sh all` and `loudnorm.sh` still gate the delivered file.

## Tools not adopted

- **DaVinci Resolve scripting** (appariciojunior): needs Resolve Studio on a desktop, and it's CC BY-NC.
- **HeyGen avatars** (avatar-mix): paid; a presenter clone needs the person's consent.
- **Instagram/TikTok scraping for "outliers"** (Melvynx/Treg): third-party account access. Ask the operator first.
