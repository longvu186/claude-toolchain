# Product demo videos (from a real web app)

Evidence: `research/programmatic-video/03-product-demo-and-social.md` §1–2 and §10a.

## Default architecture: hybrid

Capture the **real app** (exact, honest pixels), then do the **camera, cursor, text, captions and sound in code**.
Recreate UI in code only for a hero moment the real UI can't deliver. Even then, build it from the real components
and never invent UI the product doesn't have.

## Formats

| Type | Length | Frame | Sound | Notes |
|---|---|---|---|---|
| Landing hero loop | 8–20 s | 16:9 (or product-shaped), ≤ ~4 MB | **None; strip the track** (`-an`) | Starts mid-action, no logo intro, seamless loop. The poster = strongest frame (it counts toward LCP). `autoplay muted loop playsinline`. If the brief asks for a voiceover "for the landing page", ship **both**: the silent autoplay loop, plus a click-to-play voiced cut with captions |
| Launch video (PH / X / LinkedIn) | 30–60 s | 16:9 master + 1:1/4:5 + 9:16 cutdowns | Music-led, optional voiceover | One promise, demonstrated. Product Hunt takes a YouTube URL |
| Feature walkthrough | 60–180 s | 16:9 | Voiceover + ducked bed | One job-to-be-done per video; chapters |
| Changelog clip | 5–20 s | Product-shaped | Silent | One interaction, loops |
| App Store preview | 15–30 s, up to 3 per locale | **886×1920** (modern iPhones), 1200×1600 iPad | AAC 256k stereo | **≤ 30 fps**, H.264 10–12 Mbps, ≤ 500 MB. Show the actual app, full frame (no device mockup) |

**Beat budget (30 s / 60 s):**

| Beat | 30 s | 60 s |
|---|---|---|
| Hook (the *outcome* in real UI, no logo sting) | 0–2 s | 0–3 s |
| Problem | 2–5 s | 3–10 s |
| 2–4 interactions, each zoomed, each ≤ 5 s | 5–22 s | 10–45 s |
| Payoff (the number that moved, before/after) | 22–26 s | 45–53 s |
| CTA end card (logo, URL, one verb) | 26–30 s | 53–60 s |

## Capture: decision rule

The composition layer (camera, cursor, text) is always deterministic because it is rendered from frames. Only the
**capture** of the real app varies:

| Does the app's own motion (transitions, charts animating, typing echo) matter on screen? | Capture with |
|---|---|
| **No** (most demos: the story is state A → state B) | **Per-step 2× screenshots** (`page.screenshot` after each action settles, `deviceScaleFactor: 2`). The compositor synthesises zoom, cursor and transitions. Fully deterministic, and the default for agents |
| **Yes, and a few dropped frames are tolerable** | **`page.screencast`** (Playwright ≥ 1.59): viewport 1440×900 at DPR 2, `size` 2880×1800, `quality: 90–100`, re-encoded to an intermediate at CRF ≤ 16. **Gate:** `bash scripts/qa.sh dupes cap.mp4 <start_s> <end_s>` over each motion segment (take the times from `events.json`). A duplicate-frame ratio above ~1% during motion segments means recapture with the next row. Designed holds also count as duplicates, so judge motion segments, not the whole file. The `fps` frame-lock option ships after 1.63 |
| **Yes, and it must be frame-perfect** | **Virtual time + `HeadlessExperimental.beginFrame`** in `chrome-headless-shell` (puppeteer-capture, or the Replit shim approach). The installed `chromium_headless_shell-1234` works when passed via `executablePath` (the Playwright revision mismatch only affects the default launch). Mock the network or keep data local, because server timers misbehave under virtual time. `<video>` elements need their own decode path |

**Never ship `recordVideo`.** It is hardcoded VP8 at 1 Mbit/s realtime, 25 fps, scaled to fit 800×800.

**Frame rate:**
- 60 fps if the capture scrolls or the cursor or camera moves a lot.
- 30 fps otherwise, and always for LinkedIn and App Store (≤ 30) deliverables.
- Render the master at 60 and derive 30 fps versions with `-r 30`, not the other way round.

**Running the app for capture:**
- Use a **production build on its own port** (a separate worktree or copy), never the process already serving
  :3000.
- Use the project's own seed/fixture script. If none exists, create the demo tenant through the app's API or a
  throwaway DB copy.
- **Never point capture at production data.**
- Log in once, then reuse the auth with `storageState`.

**Resolution headroom is mandatory.** Capture at ≥ 2× the output scale and re-sample the source for each zoom.
Upscaling a small capture is the #1 cause of mushy text.

## Making the app demo-ready (checklist)

- [ ] Seed a **fresh demo tenant** per take and per locale: fake but plausible names, VND amounts for Vietnamese, **no
      production PII**.
- [ ] `page.clock.install()` first, then `setFixedTime()`, so "2 minutes ago" labels and charts stay stable.
- [ ] Use a production build (`next build && next start`), not dev. That removes the dev indicator, HMR stutter and
      error overlays.
- [ ] Hide cookie banners, chat widgets, toasts and "new version" banners with a flag or injected CSS. Pin the theme.
      `await document.fonts.ready`.
- [ ] Hide scrollbars (`::-webkit-scrollbar{display:none} *{scrollbar-width:none}`) and the OS cursor
      (`cursor:none!important`), then draw a synthetic cursor in post.
- [ ] Use semantic locators (`getByRole`/`getByLabel`/`getByTestId`). Before every action, log
      `{tMs, action, locator, bbox, viewport, scrollY}` to `events.json`. That log drives the cursor, zoom, ripples,
      key-cap overlays, SFX and caption timing.
- [ ] Human pacing:
  - Type with 40–90 ms jittered per-key delays.
  - Pause 300–600 ms before a click so the cursor "arrives".
  - Hold result states 0.8–1.5 s.
  - Speed up dead time in post; don't rush the script.
- [ ] For vertical output, drive the mobile layout (390×844 @3×), or follow-cam crop the 2× desktop capture using the
      event log. Never letterbox 16:9 into 9:16.

## Auto-zoom and smooth cursor (the Screen Studio / Cap approach)

1. **Cluster events into focus segments.**
   - Clicks within ~1–2 s and a small radius become one segment.
   - A typing burst becomes a segment centred on its input.
   - A gap longer than ~1.5–2 s ends the segment.
2. **Zoom per segment.** Fit the union of the bboxes plus ~40% padding, clamp to **1.5–2.5×**, and reduce the zoom if
   the cursor would leave the frame.
3. **Animate the camera with a critically damped spring** (ζ ≈ 1, no overshoot). Pan directly between consecutive
   segments instead of zooming out and back in. Use an analytical spring, not Euler steps.
4. **Smooth the cursor.**
   - Drop jitter (Cap removes back-and-forth moves < 0.015 UV within 100 ms).
   - Fit Catmull-Rom/bezier curves, or spring-follow the raw path.
   - Snap to the target on click, then add the click ripple.
5. **Motion-blur** fast camera or cursor moves only (Cap: 24-sample Gaussian when motion exceeds 0.5 px).
6. Re-sample the high-resolution source through each frame's camera transform.

```ts
// Remotion camera sketch. segments come from events.json.
const t = (frame / fps) * 1000, seg = activeSegment(segments, t);
const target = seg ? clamp(Math.min(W / (seg.box.w * 1.4), H / (seg.box.h * 1.4)), 1, 2.5) : 1;
const k = spring({frame: frame - msToFrame(seg?.startMs ?? 0), fps, config: {mass: 1, stiffness: 120, damping: 22}});
const scale = interpolate(k, [0, 1], [prevScale, target]);   // translate so seg centre maps to frame centre, clamp to edges
```

## Composition layers (in order)

1. Background (brand gradient or soft solid).
2. Browser or device frame with rounded corners and a shadow, optionally a gentle 3D tilt.
3. Capture video (`<Video>` from `@remotion/media`), transformed by the camera.
4. Synthetic cursor + click ripple.
5. Kinetic headline per beat (2–5 words; keep it off the UI being demonstrated).
6. Key-cap overlays for shortcuts.
7. Captions from TTS alignment.
8. End card.

Audio:
- Voiceover from TTS with timestamps.
- A **licensed** bed, ducked 12–18 dB.
- SFX driven by the event log: clicks −20 to −25 dB, whooshes on camera moves, a hit on the payoff.
- Two-pass loudnorm to −14 LUFS / −1 dBTP.

## Variants from one composition

Deliver:
- 16:9 1920×1080 master.
- 1:1 or 4:5 feed version.
- 9:16 cutdown (15–30 s, **re-laid out**).
- Silent 8–20 s hero loop (+ poster JPG, + WebM).

In Remotion, `calculateMetadata()` returns width, height and duration per variant. Commit `beat-sheet.json`, the flows
and the composition so the demo re-renders when the UI changes (the aidemo GitHub Action pattern).

## Prior art worth reading (young, MIT)

- `Alexwtlf/agentic-product-demo`: Remotion rebuild from the real codebase. Beat sheet → approval → render → frame gate.
- `Co-Messi/supercut`: recipe validated against real selectors, then frame-by-frame capture.
- `tandryukha/aidemo`: deterministic `storyboard.json` replay, CI re-render.
- `45ck/demo-machine`: `.demo.yaml` "demo as code".
- `ThePatriczek/playwright-recast`: `trace.zip` → polished MP4 with autoZoom, cursorOverlay and TTS.
