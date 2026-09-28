# Educational / explainer / tutorial videos

Evidence: `research/programmatic-video/02-educational-explainers.md`.

## Pedagogy rules (Mayer 2008 effect sizes; Guo 2014, 6.9M edX sessions)

| Rule | Why (d = effect size) |
|---|---|
| Animate **while** the word is spoken, using word timestamps | Temporal contiguity, d 1.31 |
| **Narrate. Don't put the narration's words on screen** (captions are the toggleable exception) | Modality d 1.02; redundancy d 0.72 |
| Put labels next to the thing, not in a legend | Spatial contiguity, d 1.12 |
| Cut decoration, **background music** and gratuitous SFX | Coherence, d 0.82–1.66 (music/sounds 1.11) |
| Signal essentials: highlight, arrow, surrounding box | Signalling, d 0.52 |
| Name and define the parts **before** the process | Pre-training, d ~0.86 |
| Short segments, chapters, pauses | Segmenting, d ~0.9 |
| Conversational "you/we" | Personalisation, d 1.11 |
| A talking-head avatar adds little | Image principle, d 0.26 |

More rules:
- **Modern TTS shows no learning penalty** against a recorded human voice (Craig & Schroeder 2019).
- Keep each segment **under 6 minutes**.
- Tutorials get rewatched and skimmed, so give them chapters.
- **Concrete before abstract** (3Blue1Brown): show the example first, then derive the rule on screen.

**Script structure (1–3 min):**
1. Hook question (0–10 s).
2. Pre-train the 2–4 components with labels.
3. Concrete example, one idea per beat, each beat ending in a visual state change.
4. Formalism derived from the example.
5. Recap plus one retrieval question.

**Pacing:**
- English ~150 wpm (a 90 s script ≈ 225 words); slow to 120–140 wpm for dense maths.
- Budget Vietnamese by **syllables**. Azure's vi voices run ~200 wpm by default, so use SSML `<prosody rate="-10%">`.
- Leave 250–600 ms of breath between beats, more after a key idea.
- Write for the ear: TTS every line and rewrite anything awkward.

## Pipeline: audio-first timing (the timeline is the source of truth)

```
script.md → spoken.txt (normalised, NFC) → TTS per beat → word timestamps → timeline.json
         → storyboard/layout boxes (checked) → render → mux → captions → QA gates → publish
```

1. **Beats.** 5–12 beats, each with narration (display text), visual intent, terms to signal, and inline anchors
   `{{A}}` where a visual must fire.
   **Fact-check the script against primary sources before any TTS or render.** For technical topics that means the
   RFC, spec or official docs, or a real capture (e.g. `openssl s_client -msg` for TLS). Record the sources in the
   manifest, and list what you deliberately simplified. A VLM frame review does not check correctness, and a
   polished wrong explainer is worse than none.
2. **Spoken vs display text.** Normalise numbers, dates, currency and acronyms into spoken form. For Vietnamese use
   `vietnormalizer` (MIT). Keep a display↔spoken map, e.g. the caption shows "1.000 đồng" while TTS says "một nghìn
   đồng".
3. **TTS per beat, not one giant request.** Beats cache individually, retry individually, and give natural boundaries.
   Pass `previous_text`/`next_text` for ElevenLabs prosody continuity.
4. **Timestamps.** Use the engine's native timestamps if it has them. Otherwise **force-align the known text** (see
   `audio-voice-captions.md`). Never time TTS audio from ASR output.
5. **`timeline.json`:** `{fps, beats:[{id, start, end, audio, words:[{w,s,e}], anchors:{A:t}}]}`. It drives the
   animation, captions and YouTube chapters.
6. **Layout before code.** List each element's keyframe bounding box per beat. Reserve the bottom ≈15% for captions and
   keep a title-safe margin. Check no overlaps, everything in frame, and minimum text size, including
   **mid-transition** (collisions often exist only mid-interpolation).
7. **Render:** Remotion (`calculateMetadata` sets duration from the timeline; each beat is `<Sequence from>` +
   `<Audio>`; anchors become `interpolate(frame,[a,a+15],…)`), or Manim (below), or a Playwright tutorial (below).
8. **Mix.** Narration only, or music far under it. Use `bash scripts/loudnorm.sh in.mp4 out.mp4` for the default
   −14 LUFS / −1 dBTP. For a dialogue-only piece whose main home is a course or LMS, `-16 -1` is also acceptable.
9. **Captions from `timeline.words`**, not from ASR. Emit VTT + SRT sidecars, burn in only for social. Emit YouTube
   chapter lines.
10. **QA gates** (`qa-and-delivery.md`), plus an ASR round-trip: transcribe the final mix and compute CER against
    `spoken.txt`. A high CER for Vietnamese usually means a wrong tone or a skipped word, so re-synthesise that beat.

## Manim (ManimCE 0.21.0) for agents

- **Pin the flavour.** ManimCE uses `from manim import *`, ManimGL uses `from manimlib import *`, and **they are not
  compatible**. LLMs mix them up; that is the #1 failure (API hallucination), followed by LaTeX errors and then layout.
  Use version-matched docs.
- **Installing on Debian/Ubuntu.** Run `apt install build-essential python3-dev libcairo2-dev libpango1.0-dev
  pkg-config`, then install with `uv`, keeping Python 3.11–3.12 if WhisperX shares the venv. Use
  `pip install "manim[typst]"` + `MathTypst` for maths **without TeX**.
- **Vietnamese prose:** `Text("…", font="Be Vietnam Pro")` or Noto Sans via Pango. Keep `Tex` for maths only.
- **Transforms.** `Transform(a, b)` leaves `a` in the scene. Default to `ReplacementTransform`,
  `TransformMatchingTex` or `TransformMatchingShapes`.
- **Layout.** Use relative layout: `VGroup(...).arrange(DOWN, buff=0.4)`, `.next_to()`, `.to_edge()`,
  `scale_to_fit_width(config.frame_width - 1)`. Fade out finished groups between beats (leftovers cause clutter).
- **Iterate cheaply.** `manim -ql -s scene.py Scene` renders the last frame as a PNG. Run a programmatic bbox check
  over `self.mobjects`: out of `±frame_width/2 − margin`, text-on-text overlap, and text height below the floor. Then
  do a VLM critique of keyframes with a **grid overlay** (Code2Video anchors) and fix. **Cap it at ~5 repair loops**,
  feeding back only the traceback tail and the offending scope. Render `-qh` once layout passes.
- **Sandbox renders.** LLM-written Manim is arbitrary Python: use a container, no network, a timeout.
- **manim-voiceover 0.4.0.** Bookmarks work via `<bookmark mark='A'/>`, `wait_until_bookmark`,
  `tracker.time_until_bookmark("A")` and `get_remaining_duration()`.
  - Azure (`vi-VN-HoaiMyNeural`/`NamMinhNeural`) is the least fragile Vietnamese path: its word boundaries come from
    the service, with no Whisper.
  - The `[transcribe]` extra breaks on setuptools ≥ 80 (`pkg_resources`).
  - ElevenLabs v3 is unsupported there.

## Code walkthroughs

- **Remotion + Code Hike** (`remotion-dev/template-code-hike`): each markdown step becomes a `<Sequence>`, and
  annotations animate via `interpolate`.
- **shiki-magic-move** (now `@shikijs/magic-move` 4.4.x) is FLIP/CSS-based, so it **does not render in Remotion** unless
  you drive its progress from `useCurrentFrame()`.
- **Typing:** `text.slice(0, Math.floor(interpolate(frame,[s,e],[0,len])))`, paced to the narration, not a fixed cps.
- **Motion Canvas `Code`** node does patience-diff morphing, but it is authoring-only (no headless render).

## Diagrams and data

- **Excalidraw:** `excalidraw-animate` replays strokes as animated SVG. Capture it frame-accurately, not through its
  WebM export.
- **Mermaid** has no native animation. Render the SVG, give nodes and edges ids, and reveal them per anchor
  (opacity or stroke-dashoffset).
- **D3 in Remotion:** use D3 for scales, layout and paths only, render the SVG from the frame, and disable all D3/CSS
  transitions.
- **Charts:** keep axes stable and animate one variable at a time (signalling).

## Screen-recorded software tutorials

- **Playwright `page.screencast`** (≥ 1.59) has `showActions()`, `showChapter(title, {description, duration})` and
  `showOverlay(html)`. The same features are exposed in Playwright MCP (`browser_start_video`,
  `browser_video_chapter`).
- **Record at 2× device scale** and zoom in post from the bboxes in the trace (`product-demo.md` has the auto-zoom
  algorithm). Build the narration **from the test steps** so step N maps to sentence N.
- `playwright-recast` converts a `trace.zip` into an MP4 with speed-up-idle, autoZoom, cursorOverlay, click effects,
  subtitles and TTS.
- **YouTube chapters:** the first is `00:00`, with ≥ 3 entries and each ≥ 10 s. Emit them from the same timeline as the
  `showChapter` cards.

## Accessibility

- WCAG 1.2.2 (Level A): prerecorded media needs **accurate** captions. Auto-captions count only once verified.
- WCAG 1.2.5 (AA): if an animation conveys information the narration doesn't, the narration must say it. Script the
  visuals in.
