# Engines: which renderer for which job (verified 2026-09-28)

Evidence: `personal-hq/docs/toolchain/research/programmatic-video/01-frameworks-and-pipelines.md` (full version
table, licences, costs) and `04-…` (agent skills, MCPs).

## Decision matrix

| Job | First choice | Alternative | Watch out for |
|---|---|---|---|
| Showreel, code-art, kinetic type, logo sting, abstract motion | **Own canvas loop** (`templates/showreel/`) → `scripts/render-frames.mjs` → ffmpeg | HyperFrames (HTML + GSAP, Apache-2.0) | Average motion-blur subframes in linear light for accuracy (sRGB darkens edges but matches AE). Dither or add grain against banding |
| Product demo from a real web app | **Hybrid:** Playwright drives a seeded demo tenant and logs actions → compositor adds camera, cursor, captions (Remotion or HyperFrames) | Rebuild key screens as HTML/React (crisper, but can drift from the real product) | `recordVideo` output can't be shipped. See `product-demo.md` |
| Vertical social short with word captions | **Remotion** + `@remotion/captions` | HyperFrames caption components; ffmpeg + ASS for simple SRT | Safe zones and Vietnamese fonts (`social.md`); Remotion licence |
| Narrated explainer (diagrams, UI, code) | **Remotion** (Code Hike, captions, `calculateMetadata` from audio) or HyperFrames | Motion Canvas (authoring only; stalled) | Audio-first timing (`explainer.md`) |
| Math / geometry / equations | **ManimCE 0.21** (`MathTypst` needs no TeX) | ManimGL (3b1b; incompatible API) | API hallucination, layout overlap (`explainer.md`) |
| Data-driven batch / personalised videos | **Remotion Lambda** (inputProps) | HyperFrames on your own Lambda/Cloud Run (compute only); Shotstack/Creatomate/JSON2Video with no infra | Lambda concurrency starts at 10 on new AWS accounts; remote video inside video raises cost |
| Simple slideshow, trims, concat, burn-in, no browser | **ffmpeg filtergraphs** from code | editly; MoviePy v2 | xfade needs the same res/pix_fmt/fps/timebase; zoompan jitters unless you upscale first |
| Live-action B-roll, mood, people | **Veo 3.1** ($0.05–0.40/s), Kling 3.0, Seedance, Runway | HeyGen/Synthesia avatars for a presenter | **Never** for UI, product text or logos. **Sora 2 is gone** (API removed 2026-09-24) |

## Remotion (React) — 4.0.529

- **Licence.** Free for individuals, non-profits and for-profit companies with **≤ 3 people**. Contractors and
  agencies on the same project **count toward the 3**. Above that you need a Company License:
  - Creators: $25/seat/month.
  - Automators: **$0.01/render, $100/month minimum.**
  - Enterprise: from $500/month.

  Studio and Player previews don't count as renders. **Check the business's headcount before building on it.**
- **Frame model.** Parallel tabs render frames out of order. Everything must come from `useCurrentFrame()` +
  `interpolate()` (clamp both ends) or `spring()`. CSS transitions/animations, Tailwind `animate-*`, D3
  transitions and FLIP libraries (shiki-magic-move) **do not render**, so drive them from the frame yourself. Use
  `random('seed')` instead of `Math.random()`. `--concurrency=1` hides flicker without fixing it.
- **2026 changes.**
  - Use `<Video>`/`<Audio>` from `@remotion/media` (Mediabunny/WebCodecs) instead of `<OffthreadVideo>`.
  - `<HtmlInCanvasMotionBlur>`: 180° shutter, 8 samples.
  - Stable client-side renderer. It sends telemetry and lacks `z-index`/`perspective`/`mix-blend-mode`.
  - **v4 defaults to a bt601 colour space with JPEG q80 frames. Render with `--color-space=bt709 --image-format=png`.**
- **Assets.** Put them in `public/` and load via `staticFile()`. Premount every `<Sequence>` (`premountFor={fps}`).
  `loadFont()` blocks until the font is ready, and `measureText`/`fitText` only work after it. `delayRender` has a
  30 s default timeout.
- **Duration.** `<TransitionSeries>` overlaps shorten the total. Set `durationInFrames` from real audio in
  `calculateMetadata()`.
- **Inspect without a full render:** `npx remotion still <id> --frame=N`, or
  `npx remotion render <id> out/ --frames=0,30,90 --image-format=png`.
- **Official agent skills:** `remotion-dev/skills`, 12–15 skills, version-locked to the Remotion release, **no LICENSE
  file**. The hosted MCP is **deprecated**; use the `/remotion-docs` skill. The Claude plugin is
  `remotion-dev/claude-code-plugin`. Append `.md` to any Remotion doc URL to get markdown.
- **Vendoring policy.** Never `npx skills add` straight from GitHub: there is no pinning, `update` pulls latest,
  and telemetry is on. Instead, in the project that adopts Remotion:
  1. `git clone https://github.com/remotion-dev/skills vendor/remotion-skills`
  2. `git -C vendor/remotion-skills checkout <sha matching the installed remotion version>`
  3. `DISABLE_TELEMETRY=1 npx skills add ./vendor/remotion-skills/skills/<name>`, or copy the folders into the
     project's `.claude/skills/`.
  4. Record the SHA and date in a README.
  5. Review every script inside before first use.

## HyperFrames (HeyGen) — 0.8.x, Apache-2.0, no render fees

- A composition is plain HTML: `class="clip" data-start data-duration data-track-index`. GSAP timelines are
  registered **paused** on `window.__timelines[id]` and seeked, never played. Renders go through `beginFrame` on Linux
  and ffmpeg. Output: MP4, MOV ProRes 4444, WebM alpha, GIF, PNG sequence.
- Rules: no clocks/rAF/timers, no unseeded random, no mid-render fetch, finite repeats (`floor`, not `ceil`).
  Register the timeline **after** an async font build, or the render comes out blank. `<audio>` needs an `id`, or the
  render is silent. `<video>` must be `muted`, with audio in separate `<audio>` tags.
- **Cold seek.** Put reveal values in the `to` vars of `fromTo`. Put initial hides in CSS or `gsap.set()` outside the
  timeline, not `tl.set()` at t=0.
- `npx hyperframes check` gates on lint + runtime + layout + WCAG contrast. **"0 samples" means nothing ran**, so it's a
  fail. Parallel workers are not bit-identical (±1 level at chunk boundaries), so use `--workers 1` when hashing.
- **Vendor-pin** its skills the same way. **Strip the router's `npx hyperframes skills update` / `@latest` steps.**
  Its internal `motion-doctrine` is already mined into `motion-craft.md`.

## Manim — see `explainer.md`

ManimCE 0.21.0 (Python ≥ 3.11):
- `pip install "manim[typst]"` renders maths without TeX.
- Use `Text()` with a Vietnamese-capable font for prose.
- `-ql -s` renders the last frame as a cheap layout check.
- LLM-written Manim needs a sandbox (it runs arbitrary Python).

## Stalled or avoid

- **Motion Canvas:** no stable release since Dec 2024, no headless render. The old `motioncanvas.io` domain now
  serves an unrelated site; the real docs are at `motion-canvas.io` or in the repo.
- **Revideo:** absorbed into commercial Midrender (bus-factor risk).
- **Theatre.js, FFCreator, timecut:** dormant.
- **MoviePy v2:** API break from v1 (`moviepy.editor` removed, `.set_*` → `.with_*`) plus reported 10× slowdowns.
- **mp4-muxer:** deprecated in favour of **Mediabunny**.
- **etro:** GPL-3.0. **OpenMontage:** AGPL-3.0. **Diffusion Studio:** watermarks unless licensed.
- **GSAP:** free, including SplitText and MorphSVG, but the licence bans building *competing no-code visual
  animation tools*.
- Blogs that call Remotion "BUSL/$1M ARR" or HyperFrames "proprietary" are wrong.

## MCP servers: default is none

The agent already has a shell, so plain `ffmpeg`/`ffprobe` beats ffmpeg MCPs: most are stale and unsandboxed, and they
cost tool-schema tokens. Kinocut is the only guardrailed one (workspace isolation), and it's better used as a CLI.
- The local ElevenLabs MCP repo was archived on 2026-08-20. The hosted one uses OAuth and spends credits.
- Blender MCPs execute unguarded generated Python, so run them in a VM only.

## Headless capture model (applies to every browser engine)

| Model | Deterministic | Use |
|---|---|---|
| Seek-per-frame (your own clock, canvas, Remotion, HyperFrames) | Yes | Anything authored |
| Time virtualisation (shim `Date`/`performance.now`/timers/rAF) + `HeadlessExperimental.beginFrame` | Yes | Arbitrary pages / real apps. **Needs `chrome-headless-shell`, Linux or Windows only** |
| Real-time screencast (`recordVideo`, `page.screencast`, CDP screencast) | **No** (drops frames under load) | Rough cuts, CI evidence, "video receipts" |

This VPS: Playwright wants `chromium_headless_shell-1243`, but only `-1234` is installed.
`scripts/render-frames.mjs` resolves the newest installed shell automatically, or reads `CHROME_PATH`.
