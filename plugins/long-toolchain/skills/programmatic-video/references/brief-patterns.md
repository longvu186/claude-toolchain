# Brief patterns: structuring a video job (prompt or internal plan)

Load when turning a vague request ("make a promo", "make me a showreel") into a buildable plan, or when writing a
prompt for another agent to build a video. Evidence: `research/programmatic-video/07-awesome-opus5-5-videos-mining.md`.
That covers 389 viral agent-made videos, and the snapshot of full prompts is in `external/…@b9ef22c36793/`. The proven
approach at scale is HTML canvas, SVG, Three.js or shaders via a pure `seek(t)`, headless frame capture, ffmpeg and
synthesized sound. Frameworks appear in under 1% of the corpus.

## Brief anatomy (fill every section before writing code)

| Section | Contents |
|---|---|
| `inputs` | What the user must supply: product name and one-line promise, real UI states or screens, real data, brand colours and fonts, accent colour, formats (16:9 / 1:1 / 9:16), footage or photos they own, and music with a licence that allows the intended use. **Ask for these first.** In autonomous mode, pick defaults and list them in the final report |
| `direction` | One **style register** (below), palette (exact hex, ≤ 3 hues), font roles (display / secondary / mono), and a **Banned** list |
| `copy` | The **exact** on-screen words in order ("locked, no extra slogans"). **Accuracy guardrails** for product claims: only shipped features, correct release status |
| `structure` | Duration, fps, BPM and bar count ("something happens on every beat"), and an ordered state or scene list with second ranges. Speech-led pieces use a **phrase cue sheet**, not a beat grid |
| `build` | Engineering rules: pure `seek(t)`, no CSS transitions or timers or carried state, closed-form springs, the capture method, motion blur, audio analysis and placement |
| `gotchas` | Known traps for this style (see the list below) |
| `validation` | Stills per beat or scene before the full render, the numeric gates, and "fix before delivering" |
| `deliverables` | Files, formats, source, "**do not stop at a storyboard, stills or a plan**" |
| `start` | "Show me the state list / storyboard on the beat grid before writing code." Skip this only in autonomous mode |

## Style registers: pick exactly one per film

"UI-morph film" below is a **format** (one persistent shape through real UI states). It uses the High-end minimal
register unless the brief says otherwise. "Dribbble-style, premium, minimal" therefore means UI-morph format +
High-end minimal bans.

| Register | Motion | Uses | Bans |
|---|---|---|---|
| **High-end minimal** (product promos, SaaS, luxury) | One idea per shot, lots of negative space, masked type reveals, match cuts, one camera language, springs with ≤ 2% overshoot | Real footage and UI, one accent colour, Geist/Inter with tight tracking | Shockwave rings, particle bursts, RGB split, camera shake, lens flares, neon glows, grid floors, flashing backgrounds, bouncy easing, full stops in on-screen text |
| **Expressive / hype** (showreels, bumpers, launch stings) | Hits on beats, overshoot 5–10%, flashes, chromatic split on impacts only, fast cuts | Kinetic type, particles, shape morphs | Idle wobble, generic "AI" clichés (brains, robots, sparkles), purple/blue neon, glassmorphism |
| **Calm polished** (brand films, desktop tours) | One continuous camera, **moves of 1.5–3 s with ease-in-out, about half the speed agents default to**, no hard cuts | Motion blur on fast moves, light grain | Snappy easing, beat-slam cuts |
| **UI-morph film** (format; defaults to the High-end minimal register) | "**One shape, never cut**": one persistent element morphs size, radius and colour through 8–12 real UI states, driven by a visible cursor, and the camera zooms so each state fills the frame | Springs, liquid tab indicators, direct-manipulation drags, loop back to the first state | Bouncy easing, particles, glows, gradients on UI chrome, mismatched icon strokes, dead time |
| **Kinetic spoken word** (manifestos, quotes, narration-led) | Typography stages the speech in reading order. Words take structural roles. **≥ 400 ms of absolute stillness** before the key line | Real glyph paths, occlusion transitions | Forcing speech onto a dance beat, destroying a line before it's read |
| **Explainer** | See `explainer.md`: narration-first timing, concrete before abstract | Simulate the real thing (an actual random walk, real numbers, honest uncertainty) | Redundant on-screen text, background music under dense teaching |

## Recurring techniques (implementations in `templates/lib/motion.js`, tested)

- **Retargeting springs:** `springTrack(t, [{t,v}…], cfg)` sums one closed-form spring per target change, so it stays a
  pure function of t. Use it for anything that changes target several times (size, radius, position, colour
  channels).
- **Stretchy indicators:** `stretchyRange` puts the leading edge on a stiffer spring than the trailing edge.
- **Direct-manipulation drags:** while the cursor is held, the value is computed from the cursor position. On release,
  `springTrack` continues from the value at release. Dragging past the max stretches with an elastic limit.
- **Content inside a morphing container** enters *after* the container starts morphing, exits *before* the next morph,
  and swaps with a 2–6 px blur. Text never overlaps.
- **A persistent continuity element** (a player bar, a cursor, a logo tile) connects shots and stays visually
  secondary.
- **Colour.** Never fade black straight into the accent colour. Carry an accent-coloured element across the state
  change instead.
- **Scramble.** Letters shuffle with `seededShuffle(glyphs, seed)` and snap into place on the beat.
- **Infinite zoom.** `logZoomSchedule(zooms, T)` gives segment durations proportional to log(zoom); within a segment the
  camera scale is `zoomAt(Z, p)`, and parallax layer scale = camera^Z (Z ≈ 0.45–1.22). Cut when the portal fills the
  frame. Cutout elements animate on twos (`onTwos`).
- **Camera discipline (hype register).** Only punch-ins (1.0→1.08) and beat-timed smash pans; never random drift.
  Print misregistration (±2–4 px colour-offset copies) only on impact frames.
- **Loops.** The last frame equals the first *including cursor position and velocity*. Make the timeline periodic
  (`render(0) === render(T)`) and reset hidden elements while they are fully occluded. **Render frames `0 … N−1`
  with `N = T·fps`, never frame N:** it duplicates frame 0 and makes a one-frame hitch at the wrap.
- **Real footage in an HTML render.** `ffmpeg -i clip.mp4 -vf fps=30 frames/clip_%04d.jpg`, swap `img.src` per frame,
  and have `seek(t)` await `img.decode()`.
- **A 16:9 master** keeps important content inside a central 9:16-safe column, so vertical cutdowns need no re-layout
  for the key frames.
- **Every transition demonstrates a feature** (a stream reconnecting, a branch splitting), not a title card replacing
  another.

## Style gotchas

- `will-change` on anything the camera scales rasterises it, so text goes blurry. Don't use it.
- `opacity` or `filter` on a `transform-style: preserve-3d` element flattens it (both faces show). Fade the wrapper.
- Measure element positions at runtime for match cuts, never hard-code them.
- Don't interpolate arbitrary path points between unrelated words or shapes. Use occlusion or matched edges.
  Radial-function morphs only work for star-shaped outlines.
- Many shared prompts blend subframes **centred** on t (t ± 1/240 s, then ffmpeg `tmix`). That is fine for one
  continuous shot, but on hard cuts it blends two scenes, so keep the forward-facing shutter.

## Audio in briefs

- **Supplied track.** Analyse tempo, beat grid, per-bar energy and the drop (librosa or numpy). **Calibrate the grid to
  the real kick transients**, not the nominal BPM. Cuts go on downbeats, UI hits on beats.
- **SFX placement.** Place each SFX so its **measured peak** (not its file start) lands on the event.
- **Energy.** Scale effect intensity with section energy (e.g. intro 40%, verse 70%, chorus 100%). Let low-energy
  passages breathe with quieter shots.
- **No licensed music.** Synthesize the score and SFX in code (`templates/showreel/synth.cjs`) and say so.

## Autonomous-mode clause (when the user is away)

"Don't stop to ask. Make the calls, then list every decision at the end." This still requires the verification loops
(stills per scene, frame-by-frame checks on transitions, measured audio) and delivering source that reproduces the
video. Paid generative steps (image/video/music APIs) are the exception: **list each generation with its estimated
cost and wait for approval**.
