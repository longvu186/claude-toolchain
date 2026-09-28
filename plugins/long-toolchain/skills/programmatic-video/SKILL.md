---
name: programmatic-video
description: Use when asked to make, render, edit, plan or review any video or animation — motion graphics, showreel, logo sting, product demo, launch/promo video, landing-page hero loop, TikTok/Reels/Shorts social video, explainer, tutorial or screencast, animated captions/subtitles, voiceover/TTS sync — or when choosing between Remotion, HyperFrames, Manim, Motion Canvas, ffmpeg, Playwright capture, TTS engines or AI video generators (Veo, Kling).
---

# Programmatic video

## Overview

Video made from code: every frame is a **pure function of time**, **one timeline** drives the visuals, audio,
captions and chapters, and nothing counts as done until **you have inspected the rendered output and it passes the
numeric gates**. A render that exits 0 proves nothing: layout, sync, loudness and colour defects only show up after
rendering.

## Route by job (read the matching reference before building)

| Job | Engine | Read |
|---|---|---|
| Showreel, kinetic type, logo sting, abstract motion | Own canvas loop, from `templates/showreel/` | `references/motion-craft.md` |
| Product demo / launch video / hero loop from a real app | Playwright capture of a seeded app + a coded camera, cursor and captions | `references/product-demo.md` |
| Vertical social promo (9:16) | Remotion or canvas; captions burned in | `references/social.md` |
| Narrated explainer / tutorial / math | Remotion or Manim; audio-first timeline | `references/explainer.md` |
| Voiceover, captions, music, loudness | — | `references/audio-voice-captions.md` |
| Picking or vetting an engine, licence, MCP or skill pack | — | `references/engines.md` |
| QA, encoding, sharing a link | — | `references/qa-and-delivery.md` |

Always also skim `references/motion-craft.md` (25 checkable rules: easing, durations, stagger, overshoot, reading
time, beat grid, seams).

## Workflow

1. **Brief.** Confirm the deliverable (platforms, aspects, length, locale, voice or no voice, music source). For
   anything client- or brand-facing, write the beat sheet and get it approved before building.
2. **Timeline first.** Write a data file of beats, cues, word timestamps and anchors. The renderer, synth or mix, and
   the captions all read it (`templates/showreel/timeline.js`).
3. **Build deterministically.**
   - No `Date.now`/`Math.random`/CSS animations/timers/network at render time.
   - Fonts are loaded and awaited before frame 0.
   - The font has **Vietnamese coverage** whenever text may be Vietnamese.
   - Text is NFC-normalised.
4. **Inspect a draft.** Render stills or a low-res pass, then run `bash scripts/qa.sh all out.mp4 <cut times…>`. Read
   `sheet.png`, the seam triplets and full-res text crops, fix, and repeat.
5. **Finish.**
   - `node scripts/render-frames.mjs <dir>` renders frames.
   - Encode with the BT.709 preset in `qa-and-delivery.md`.
   - `bash scripts/loudnorm.sh in.mp4 out.mp4` brings audio to −14 LUFS / ≤ −1 dBTP, measured after the AAC encode.
6. **Gate.** Every hard gate in `qa-and-delivery.md` must pass. Report the measured numbers, not "looks good".
7. **Deliver.** Hand back the files, captions, licence manifest and editable source. `bash scripts/share.sh
   out.mp4` gives a verified temporary public link; tell the user it's public and when it expires.

## Scripts (in `~/.claude/skills/programmatic-video/scripts/`, all tested on this VPS)

| Script | Usage | Does |
|---|---|---|
| `render-frames.mjs` | `node render-frames.mjs <projectDir> [--workers 5] [--from 0 --to N] [--w 1920 --h 1080]` | Serves the dir over http, opens N headless pages, and writes `frames/f_%04d.png`. The page must define `window.ready` (a Promise), `window.FRAMES`, and `window.renderFrame(f)` returning PNG base64. Resolves playwright-core and chrome-headless-shell itself (override with `PLAYWRIGHT_CORE` / `CHROME_PATH`) |
| `qa.sh` | `bash qa.sh all <video> [cut_s…]` · `probe` · `sheet` · `seams <video> <cut_s…>` · `frame <video> <t>` · `loudness` · `defects` · `wave` · `dupes <video> [start end]` · `safezone <1080x1920.png>` | Writes into `<video>.qa/`: 4×4 contact sheet, exact cut−1/cut/cut+1 frames, ffprobe summary, LUFS and true peak, black/freeze/silence events, waveform, duplicate-frame ratio, safe-zone overlay |
| `loudnorm.sh` | `bash loudnorm.sh <in> <out> [I=-14] [TP=-1] [LRA=11]` | Two-pass linear loudnorm at 48 kHz. For video it re-measures after AAC and compensates. Exits non-zero if it can't pass |
| `share.sh` | `bash share.sh <video-or-dir> [port=8791] [hours=24]` | Player page + Range server + isolated Cloudflare quick tunnel (auto-expiring systemd units). Verifies 200 and 206 publicly before printing the URL |

## Quick reference

| Thing | Value |
|---|---|
| Frame rate | 30 by default (social, LinkedIn, explainers, App Store ≤ 30). 60 for showreels and scrolling UI capture |
| Loudness | −14 LUFS integrated, ≤ −1 dBTP **measured on the delivered file** (−16 is allowed for dialogue-only course video) |
| Encode | H.264 High, yuv420p, **explicit bt709 matrix + tags**, `-framerate` before `-i`, `+faststart` |
| 9:16 safe box | x 80–888, y 288–1248 (at 1080×1920) |
| Captions | ≤ 42 chars/line, ≤ 2 lines, ≤ 20 cps English / **≤ 17 cps Vietnamese**, 0.83–7 s per cue |
| Beat grid | frames/beat = fps·60/BPM (120 BPM gives whole frames at 24/30/60) |
| Motion blur | 8 subframes, 180° **forward-facing** shutter, so no cut blends two scenes |
| Vietnamese-safe fonts | Be Vietnam Pro, Montserrat, Inter, Anton, Oswald, Lexend. **Not** Poppins, Bebas Neue, Archivo Black |

## Common mistakes

| Mistake | Fix |
|---|---|
| Shipping Playwright `recordVideo` (1 Mbit/s VP8, fits 800×800) | Deterministic capture at 2× DPR (`product-demo.md`) |
| Normalising the WAV and assuming the MP4 passes | AAC adds up to ~1 dB of true-peak overshoot. Use `loudnorm.sh`, which re-measures after the encode |
| No colour tags (swscale defaults to BT.601, players assume BT.709) | Use the bt709 preset. In Remotion: `--color-space=bt709 --image-format=png` |
| Timing captions or visuals from ASR of TTS audio | Use the TTS's native timestamps, or force-align the known script |
| ElevenLabs Vietnamese with the default model | Set `model_id` (v3 / flash_v2_5); the default `multilingual_v2` has no Vietnamese |
| Building on Remotion without a licence check | Free only for ≤ 3 people, **contractors included** |
| `npx skills add` straight from GitHub, or "skills update" mid-task | Vendor at a commit SHA and review the scripts first (`engines.md`) |
| Using Sora | Sora 2 was removed on 2026-09-24. Veo or Kling for B-roll only, never for UI or text |
| Unlicensed "trending" music in a brand promo | Licence record per track, TikTok CML in-app, or the procedural synth |

## Evidence

Full research with sources lives in `/root/projects/personal-hq/docs/toolchain/research/programmatic-video/`:
- `01`: frameworks
- `02`: explainers
- `03`: demo and social
- `04`: skills and craft
- `00`: the in-house pipeline
- `05`: baseline

Re-verify fast-moving facts (platform specs, prices, versions) before a big campaign.
