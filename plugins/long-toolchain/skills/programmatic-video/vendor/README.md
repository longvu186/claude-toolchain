# Vendored third-party video packs (pinned, reviewed 2026-10-30)

These are read on demand from the `references/*.md` files. They are **not** standalone skills: every upstream
`SKILL.md` was renamed `SKILL.vendored.md` so it never registers or triggers. Rules:

- **Never** run `npx skills add`, `git pull`, `skills update`, or any upstream self-update or version-check step
  (huashu-motion's `.last-update-check` is not vendored). To update: re-clone into a sandbox at a new SHA, re-review
  every script, re-run the smoke tests below, then replace the folder and update this table.
- Licences are kept in each folder (Apache-2.0 also needs its NOTICE). Credit the source in a delivery manifest when a
  vendored text materially shapes the deliverable.
- Python helpers that need numpy/scipy/opencv/librosa run from
  `~/.cache/programmatic-video/venv/bin/python -I` (uv venv, py3.12). Create it with:
  `uv venv ~/.cache/programmatic-video/venv --python 3.12 && VIRTUAL_ENV=~/.cache/programmatic-video/venv uv pip install numpy opencv-python-headless scipy soundfile librosa matplotlib`

| Folder | Upstream @ SHA | Licence | What we use | Review / smoke test |
|---|---|---|---|---|
| `motionmaxxing@8c8ec0f2a6f6` | github.com/Tejashmakwana/motionmaxxing | Apache-2.0 (+NOTICE) | `references/` (measured motion, slop, transitions, ui-demo, sound-sync), `taste/`, `scripts/look.py` (stdlib), `lint.mjs` + `_cdp.mjs` | look.py: ffmpeg/ffprobe only, no network. It ran on our reel and its LUFS matched loudnorm (−14.0 / −1.0 dBTP). The G0 length gate correctly failed a wrong `--expect`. lint.mjs launches local Chrome via CDP (`CHROME_PATH`) and was not smoke-tested yet |
| `cinetic@ecfa6605de1a` | github.com/leonxlnx/cinetic | MIT | `references/` (chromium-rendering, review-loop, timing-grid, transitions…), `assets/critics/`, `scripts/forensics.py`, `av-audit.py`, `sheet.py`, `grab.sh`, `dither-gradient.py`, `probe.py` | ffmpeg/ffprobe only (sheet.py can call `npx remotion compositions` for Remotion projects). forensics and av-audit both ran on our reel and found real issues |
| `hyperframes-doctrine@4e2a1c215a42` | github.com/heygen-com/hyperframes `.agents/skills/` | Apache-2.0 | cut-the-curve, seam-craft, captions-overlay, oversized-cursor, motion-doctrine, changelog-video | docs, plus changelog-video's own scripts (not run) |
| `claude-motion-sfx@e627941543d9` | github.com/whaleyxbt/claude-motion | MIT | `sfx/` procedural SFX engine (stdlib), plus sound-design / review-loop / motion-design notes | Ran a cue sheet: −14.0 LUFS, −4.3 dBTP. The timeline JSON **must** contain `duration` |
| `sound-pass@3d83d987d658` | github.com/Barty-Bart/motion-graphics `skills/sound-effects` | MIT; kit files CC0 (manifest has source URLs) | CC0 SFX kit + manifest, `scripts/sound_pass.py` (librosa beat grid, placement, licence report) | Subprocess is ffmpeg only. Mixkit entries download at runtime into the *project*. Not yet run end to end |
| `herk-cuts@10511e5af86f` | github.com/nateherkai/herk-edit-kit | MIT | `cut-silences/`, `cut-mistakes/` (node, ffmpeg) | cut-silences planned a Vietnamese word transcript correctly. Spawns ffprobe/ffmpeg only |
| `video-use@43cfc5668335` | github.com/browser-use/video-use | MIT | `SKILL.vendored.md` hard rules + `helpers/` (transcribe via ElevenLabs Scribe, render, grade, timeline_view) | Read only. Helpers need `ELEVENLABS_API_KEY` from Infisical, never `.env` |
| `charlie947-brand@229022ebca76` | github.com/charlie947/motion-graphics-skills | MIT | brand-intake, reel-export, motion-prompt-writer | docs |
| `lemo-opuscar-styles@f17136060781` | github.com/lemomo-ai/lemo-opuscar `styles/*/STYLE.md` | MIT code / **CC BY 4.0 text: credit "Lemo-Opuscar"** | 66 style prompts | docs |

Mined but deliberately **not** vendored: see `personal-hq/docs/toolchain/research/programmatic-video/08-github-skill-mining.md`
(NC licences, AGPL, no licence, or ideas only).
