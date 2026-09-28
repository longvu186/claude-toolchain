# QA gates, encode presets, and delivery

Principle: **render → inspect → fix before calling anything done, and fail closed.** A render that exits 0 proves
nothing. Research shows 93.8% execution success alongside a layout score of only 0.61. Spatial defects
"become evident only after rendering". A gate that checked 0 samples is a FAIL.

## Inspect protocol (you review images; Claude sees only the first frame of a GIF)

Run `bash scripts/qa.sh all <video.mp4> [cut_times_s...]`. It writes into `<video>.qa/`:

| Output | Catches |
|---|---|
| `sheet.png`: contact sheet, ≤ 4 columns × 480 px (stays under the 1568–2000 px vision downscale) | Composition, pacing, dead beats, colour mistakes (muddy blends, lingering flashes) |
| `seam_<t>_{a,b,c}.png`: frames at cut−1 / cut / cut+1 | Two scenes blended in one frame, flash frames, a dead settle before a cut |
| `probe.txt`: ffprobe summary | Wrong fps, duration, pix_fmt, missing audio stream |
| `loudness.txt`: integrated LUFS and true peak | Mix too hot or too quiet |
| `defects.txt`: blackdetect / freezedetect / silencedetect | Accidental black, frozen frames, audio gaps |
| `wave.png`: waveform | Audio transients vs the cue grid (px per second = width / duration) |

Then, by hand:
- **Mid-motion frame of every entrance** (`qa.sh frame <video> <t>`). This catches collisions that exist only
  mid-interpolation.
- **Full-res crop of every text block** at its hold frame, for legibility, kerning, clipped diacritics and fallback
  glyphs.
- **Safe-zone overlay** for vertical video: `qa.sh safezone <png>` draws the cross-post box (x 80–888, y 288–1248).
- **Review with a checklist, not "does it look good?"** Check the headline is ≥ 84 px at 1080 w, text is inside
  safe, there's one focal point, contrast is ≥ 4.5:1, there's no text under platform UI, and Vietnamese glyphs all
  come from one font.
- **Determinism** (for custom renderers): render the same 8 frames in 2–3 shuffled orders and compare hashes. Also grep
  the source for `Date.now|performance.now|Math.random|setTimeout|requestAnimationFrame`.

## Hard gates before saying "done"

- [ ] `ffprobe` duration = spec ± 1 frame. fps, resolution (even dimensions), `yuv420p`, BT.709 tags, AAC 48 kHz,
      moov at front.
- [ ] Audio stream present and not silent (`astats` RMS above the floor, unless the deliverable is silent by design).
- [ ] No unexpected black or freeze frames.
- [ ] Loudness within ±1 LU of target, true peak ≤ −1 dBTP.
- [ ] Contact sheet, seams and text crops reviewed, and every defect found was fixed and re-checked.
- [ ] Captions: cps, line length, cue duration, NFC, and text exactly matching the display script.
- [ ] Licence record for every third-party asset (music, SFX, fonts, footage). Fonts must be OFL or licensed.
- [ ] For voiceover work: an ASR round-trip CER against the spoken script.

## Encode presets

**Always put `-framerate` before `-i`** for image sequences (otherwise ffmpeg assumes 25 fps). Always use an explicit
BT.709 matrix plus tags: swscale converts RGB→YUV with BT.601 by default while players assume BT.709 for HD, which
shifts the colours.

```bash
# frames → master (web/YouTube). Use CRF 14–18 for masters, 18–20 is plenty for social.
ffmpeg -framerate 60 -i frames/f_%04d.png -i audio.wav \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -tune animation -g 30 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out.mp4
```

| Target | Changes |
|---|---|
| Landing hero loop | `-an -crf 22–26`, ≤ ~4 MB, + a poster JPG, + optional VP9/AV1 WebM `<source>` first |
| Vertical social | See `social.md` (`-maxrate 16M -bufsize 32M -r 30 -g 15`) |
| Transparent overlay | ProRes 4444 (`-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le`) or VP9 `yuva420p` WebM (VP8/VP9 alpha is flaky in Chromium, so prefer PNG sequences for compositing) |
| Banding in dark gradients/glows | Add ±0.5–1 LSB grain or dither before 8-bit; `-tune grain`, or `aq-mode=2`; test after platform re-encode |

Colour notes:
- Remotion v4 defaults to bt601 with JPEG q80 frames. Render with `--color-space=bt709 --image-format=png`.
- Averaging motion-blur subframes in sRGB darkens moving edges (this matches After Effects 8-bit). Linear light is
  physically correct.

## Delivery

Hand back:
- The deliverables and a `manifest.json` (sources, licences, versions, render command).
- Captions, cover or thumbnail.
- The editable source project, so it re-renders when content changes.

**Browser link from this VPS:** `bash scripts/share.sh <file-or-dir> [port] [hours]`.
- It starts a Range-capable static server (Safari/iOS need 206 responses) and a Cloudflare quick tunnel, both as
  transient systemd units that expire automatically (default 24 h).
- It verifies the public URL (200 page, 206 range) before printing it.
- The link is **public but unguessable**. Say so, give the expiry, and give the stop command.
- The quick tunnel runs with an empty `--config` and a scratch HOME. **Otherwise cloudflared inherits
  `~/.cloudflared/config.yml`, whose catch-all returns 404 for everything.**
- Never publish to third-party hosts (YouTube, file hosts) without asking first.
