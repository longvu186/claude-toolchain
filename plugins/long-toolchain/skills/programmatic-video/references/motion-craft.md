# Motion craft — checkable rules with numbers

Load when designing timing, easing, transitions, kinetic type or layout for any video.
Evidence: `personal-hq/docs/toolchain/research/programmatic-video/04-agent-skills-and-motion-craft.md`, Part B.
The strongest single source of craft rules is HyperFrames' `motion-doctrine` (Apache-2.0).

## The 25 rules (verify each before final render)

1. **Pure function of time.** Every frame is f(frame, seed, props). Not allowed: `Date.now`, `performance.now`,
   unseeded `Math.random`, CSS transitions or `@keyframes`, Tailwind `animate-*`, GSAP `repeat:-1`, `setTimeout`,
   or network fetches at render time. Seed a PRNG (mulberry32, Remotion `random('seed')`).
2. **Fonts load before frame 0.** Await `document.fonts.load()` or `loadFont()`, and measure text only after that.
3. **Safe area.**
   - 16:9: keep inside 90% title-safe (≈96×54 px at 1080p). Key text sits ≥ 80 px from the sides and ≥ 100 px from top and bottom.
   - 9:16: see `social.md`. The universal box is x 80–888, y 288–1248.
4. **Type sizes at 1080 px width.** Headline ≥ 84 px, supporting text ≥ 44 px. Captions: line height ≥ 8% of frame
   height (16:9) or ≥ 4.5% (9:16). Scale linearly with width.
5. **Contrast.** ≥ 4.5:1, or ≥ 3:1 for large bold text, measured against the real pixels behind the text on its hold frame.
   If it fails, add a scrim (60–80% dark), a 2–4 px outline or a hard offset shadow. Never rely on `difference`,
   `overlay` or `screen` blends without checking luminance (they turn muddy or vanish).
6. **One focal point per beat.** Everything else is at least one step lower in size, contrast or saturation. While
   text is being read, only the focal element moves, and background motion stays ≤ 20% of its speed.
7. **Palette: ≤ 3 hues plus neutrals.** Reserve the accent for focal elements and hits. Interpolate colour in
   OKLCH/OKLab, not sRGB (sRGB midpoints go muddy).
8. **Ease by direction.** Entrances use ease-out. Exits use ease-in. On-screen repositioning uses standard ease-in-out.
   No `linear` on position or scale, except constant-velocity loops and scrolls.
9. **Durations.** Single entrance ≤ ~800 ms, exit ≈ 75% of its entrance. UI-like micro moves 100–400 ms. Nothing
   except a camera move takes ≥ 1 s.
10. **Shared intent.** Similar elements share one (ease, duration) pair.
11. **Stagger budget.** Total stagger per group ≤ 500 ms. Per letter 20–40 ms, per word 60–120 ms, per list item
    20–80 ms. Item n+1 starts before item n finishes.
12. **Overshoot budget.**
    - Opacity and colour: 0%.
    - UI and productive motion: ≤ 2% (ζ ≥ 0.8).
    - Expressive titles and logos: 5–10% (ζ 0.6–0.7, `back.out(1.4–1.7)`).
    - Never use `bounce.out` or `elastic.out`.
    - Remotion and Framer spring defaults (m 1, k 100, c 10 → ζ 0.5, ~16% overshoot, ~800 ms settle) are bouncy.
      Override them deliberately.
13. **Specify springs by ζ and k.** Convert with c = 2ζ√(k·m). Overshoot = e^(−ζπ/√(1−ζ²)).
14. **Reading time.** `hold_s = max(0.833, chars/15, words/2.7)`, counted from the moment the text is fully readable.
    **Vietnamese: use `chars/13`, and count *syllables* as words** (Vietnamese writes space-separated syllables), so
    24 chars / 6 syllables → max(1.85, 2.2) = **2.2 s**.
    Captions: ≤ 20 cps in English, **≤ 17 cps in Vietnamese**, 0.83–7 s per cue, ≤ 42 chars per line, ≤ 2 lines.
15. **Beat grid.** Frames per beat = fps·60/BPM. Compute each cut from absolute time, `round(n·60/BPM·fps)`, never by
    adding up rounded intervals. Scene changes go on bars (every 4 beats), accents on beats or 8th notes. 120 BPM
    gives whole frames at 24, 30 and 60 fps.
16. **Audio is the clock.** One cue map or timeline drives visuals, audio and captions. With a voiceover, re-time
    scenes to the real word timestamps. A voiceover regeneration re-opens every seam.
17. **AV sync.** Sound never lags its visual event by more than ~2 frames at 30 fps. Leading by ≤ 45 ms is invisible.
    The whoosh peak lands on the cut or the fastest frame, hits land on the contact frame, and a riser ends on the
    reveal downbeat.
18. **Loudness.** −14 LUFS integrated (±1) and ≤ −1 dBTP for online delivery. Put a 5–30 ms fade on every audio
    edit, and seed all noise sources.
19. **Transition budget.** ≤ 3 distinct transition types per film, reused. The default seam is a directional cut in
    mid-motion. No default crossfades.
20. **Vector law at seams.** Across a cut, keep the same axis and direction (on Z, the same sign of scale change) and
    matched speed (mirrored in/out eases), with both sides still moving. Never run consecutive seams in opposite
    directions ("ping-pong" reads as an error).
21. **No idle wobble.** No breathe, float or pulse loops as filler. Pause at any second and something meaningful is
    mid-flight, or the frame is holding for reading. Leave 0.3–0.75 s of stillness before the climax.
22. **Causality.** Reactions (squash, recoil, particles, SFX) start on the frame that causes them. Heavier objects
    rebound more slowly.
23. **Duration arithmetic.** Parent duration = Σ scenes − Σ transition overlaps. No clip ends past the root duration.
    Confirm with ffprobe.
24. **Comfort.** ≤ 3 flashes per second (WCAG 2.3.1, glitch strobes included). No fast full-frame zoom or rotation
    without a stationary reference. A motion-blur shutter must not straddle a cut: make it forward-facing,
    `t = (f + s/SUB·shutter)/fps`.
25. **Inspect before calling it final, and fail closed.** See `qa-and-delivery.md`. A check that ran 0 samples is a fail.

## Easing tokens (cubic-bezier)

| Use | Value | Source |
|---|---|---|
| Entrance, strong (house default) | (0.16, 1, 0.3, 1) expo-out | Remotion skill, easings.net |
| Entrance, emphasised | (0.05, 0.7, 0.1, 1) | Material 3 emphasized-decelerate |
| Exit, emphasised | (0.3, 0, 0.8, 0.15) | Material 3 emphasized-accelerate |
| On-screen move | (0.2, 0, 0, 1) | Material 3 standard |
| Productive UI entrance / exit | (0, 0, 0.38, 0.9) / (0.2, 0, 1, 0.9) | IBM Carbon |
| Expressive entrance / exit | (0, 0, 0.3, 1) / (0.4, 0.14, 1, 1) | IBM Carbon |
| Overshoot entrance (~10%) | (0.34, 1.56, 0.64, 1) back-out | easings.net |
| Across a cut | exit `power4.in` → entrance `power4.out`, same distance and duration | HyperFrames cut-the-curve |

Durations:
- Material 3: short 50–200 ms, medium 250–400 ms, long 450–600 ms, extra-long 700–1000 ms.
- IBM Carbon: 70 (micro), 110 (small fade), 150 (default), 240 (expansion/toast), 400 (large), 700 ms (hero).

## Spring presets (mass 1; `{stiffness, damping}` for Remotion/Framer)

| Feel | ζ | k | c | Overshoot | Settle |
|---|---:|---:|---:|---:|---:|
| Critically damped camera (screen-recording zoom) | 1.0 | 120–200 | 22–28 | 0% | ~0.4 s |
| M3 standard spatial | 0.9 | 700 | 47.6 | 0.2% | 168 ms |
| M3 expressive spatial | 0.8 | 380 | 31.2 | 1.5% | 256 ms |
| M3 expressive fast | 0.6 | 800 | 33.9 | 9.5% | 236 ms |
| Remotion "no bounce" | ≫1 | 100 | 200 | 0% | overdamped |
| Kinetic letter rise (in-house) | 0.42 | f≈3.2 Hz | — | ~23% | expressive end |

## ms → frames

| ms | 100 | 150 | 200 | 250 | 300 | 400 | 500 | 700 | 800 | 1000 |
|---|---|---|---|---|---|---|---|---|---|---|
| 24 fps | 2 | 4 | 5 | 6 | 7 | 10 | 12 | 17 | 19 | 24 |
| 30 fps | 3 | 5 | 6 | 8 | 9 | 12 | 15 | 21 | 24 | 30 |
| 60 fps | 6 | 9 | 12 | 15 | 18 | 24 | 30 | 42 | 48 | 60 |

## Transitions: when to use each

| Transition | Use when | Avoid when |
|---|---|---|
| Hard cut on a beat | Fast pace, impact | The scenes share no rhythm |
| Cut on action (mid-motion, matched vector) | **Default** for motion graphics | Exit already settled, or entrance starts from rest |
| Match cut (shape/position/colour rhyme) | Linking ideas, metaphor | No real rhyme exists |
| Mask / iris / shape wipe | Chapter openers, loops (iris back to the opening dot) | Frequent use (reads retro) |
| Slice / split strips | Tech or brand energy, list reveals | Busy footage underneath |
| Morph (radial function over 240 rays for star-shaped outlines) | Logo → logo, icon → icon, data → data | The two shapes have different topology |
| Zoom-through | "Going deeper" (meaning reserved) | Used just for variety |
| Pull-back | Arrival, the big reveal | Paired with a grow-from-small entrance (Z-sign clash) |
| Whip pan (6–10 frames of blur at 30 fps) | Energetic topic change | Low-energy pieces |
| Glitch / RGB split (2–6 frames) | Tech or error semantics, beat accents | Calm brands; more than 3 flashes per second |
| Crossfade | Passage of time, mood | Default scene changes |

## Kinetic typography

- **Mask reveal.** Clip each line or letter and translate it up from 100% to 0% with expo-out or a spring. Align
  mask edges to the ascent and descent so diacritics and descenders don't clip.
- **Splitting.** Split by grapheme (`Intl.Segmenter`), never by UTF-16 code unit. Vietnamese combining marks must
  stay with their base letter. Normalize to NFC first.
- **Tracking.** In the DOM, animate per-glyph `x`, never `letter-spacing` (it reflows and jumps). On canvas,
  `ctx.letterSpacing` is fine.
- **Emphasis.** One keyword gets 1.1–1.3× scale or a heavier weight on the beat. The most important word moves last,
  or moves differently.
- **Karaoke / word captions.** Hard-kill the previous group; never crossfade two caption groups. Animate only one
  opacity owner (container × word opacity multiplies into a pop).
- **Text on a path.** Keep the curve radius > ~3× the cap height.

## Sound design vocabulary

- **Whoosh:** pitch and filter sweep in the direction of travel.
- **Riser:** 1–4 bars, ends abruptly on the reveal.
- **Hit:** kick + sub + noise, on the contact frame.
- **UI tick:** −20 to −25 dB relative to the voiceover.
- **Stinger:** the brand close.
- **Music bed:** ducked 12–18 dB under the voiceover, high-passed at 100–150 Hz.

Procedural audio is fully feasible and deterministic. See `templates/showreel/synth.cjs` (Node) or
`OfflineAudioContext` / `Tone.Offline` in the same headless page.
