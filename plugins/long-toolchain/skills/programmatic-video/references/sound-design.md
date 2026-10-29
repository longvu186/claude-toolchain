# Sound design: SFX, beat grid, mix, licences (mined 2026-10-30)

Silent motion feels unfinished. **You can't hear, so every sound decision is measured, and the user gets the 5
riskiest timestamps to check with headphones. Never write "it sounds good."** Voice, TTS, captions and the loudness
target are covered in `audio-voice-captions.md`; this file covers effects, music sync and the mix. Evidence: research
`08-github-skill-mining.md`.

## Two SFX sources (pick per job, record it in the manifest)

| Source | When | Path |
|---|---|---|
| **Procedural** (pure Python stdlib, deterministic, no licence) | Abstract motion, UI ticks/pops/whooshes, anything where reproducibility matters | `vendor/claude-motion-sfx@*/sfx/`. Generators: click, pop, blip, whoosh, scratch, riser, impact, chime, pad, typing. Also `templates/showreel/synth.cjs` |
| **Recorded CC0 kit** (sounds less synthetic) | Product/brand films where a "beep" would read as cheap | `vendor/sound-pass@*/sfx/kit/` + `manifest.json`: whoosh, click, pop, riser, impact, tick. All CC0 with source URLs. `sound_pass.py` places them, checks the beat grid and writes `CREDITS.txt` and `report.html` |

**Procedural cue sheet.** Times come from the timeline and are never typed:

```python
# cue.py
TIMELINE = "timeline.json"   # must contain "duration"
OUT = "sfx.wav"
from sfx.synth import pop, whoosh, impact

def score(mix, tl):
    s = tl["s1"]
    mix.put(s["title"], whoosh(0.4, 500, 2400, peak=0.45), 0.3)
    for i, t in enumerate(s["items"]):
        mix.put(t, pop(900 + i * 150, 400), 0.2, pan=-0.4 + i * 0.4)
```

Run it with `PYTHONPATH=~/.claude/skills/programmatic-video/vendor/claude-motion-sfx@e627941543d9 python3 -m sfx
cue.py`. Tested here: −14.0 LUFS, −4.3 dBTP.

The engine masters itself to −14 LUFS with ≤ −2 dBFS true peak, which leaves room for AAC overshoot. A sparse mix
(short hits with silence between) can't reach −14 without crushing. Add a pad or longer tails instead of forcing it.

## Visual event → sound

| On screen | Sound | Placement |
|---|---|---|
| Slide, camera move, scene cut | whoosh, length matched to the move | starts **2 frames early** |
| Element appears, badge, success | pop (raise the pitch across a sequence) | on the frame |
| Click / control snaps | click (+ a blip in key) | on the frame (on the squash frame for a cursor press) |
| Typing | one humanised keystroke per character (jitter ±4–6 ms) | quiet |
| Build-up | riser | **ends** on the next hit; at most one per film |
| Hero reveal | impact | the loudest effect; at most one per film |
| Hover, small UI | tick | very quiet |
| Under everything | pad or ambience | duck ~65 % under the hero hit |

- **Accent, don't narrate.** Continuous motion (drift, grain, rotation) stays silent.
- Every hit needs a **visible cause**. A loud sound on a still picture is flagged by `av-audit.py`.
- Vary takes within a category so repeats don't sound robotic.
- Keep tonal sounds in **one key**, with pitch rising with progress and resolving on the payoff.
- Pan follows screen position (−1 … +1).
- Start every sound at zero and end it with a ≥ 6 ms cos² tail. **Unfaded sample edges click**: av-audit found 14
  clicks in our own 09-28 reel.

## Levels

- Priority is **voice > SFX > music**.
- Hero hits: gain 0.25–0.35. Supporting sounds: 0.08–0.2. Pad: about 0.03.
- The music bed sits about −12 dB under the SFX and ducks 8–12 dB under voice.
- Before the hit, leave silence (or pull the music) so the hit lands.
- **Loudness range 3–8 LU.** A flat 1–2 LU mix has no build or drop (av-audit warns on it).
- The delivery target is still `loudnorm.sh`: −14 LUFS, ≤ −1 dBTP **on the MP4**. Some creators prefer −16 LUFS /
  −4 dBTP for phone speakers. Pick one and report it.

## Beat grid (music-driven edits)

1. `librosa.beat.beat_track` → beat times.
2. **librosa sometimes locks onto the off-beat.** Low-pass the music below 120 Hz, plot the first 4 bars against the
   beat lines, and shift the grid by the median kick offset if the kicks miss.
3. Hard cuts and reveals land on a beat. If the animation can't move, search the music start offset that minimises
   the cut-to-beat error, and report the error per cut in ms.
4. A hit 80–300 ms off the picture reads as late or early. Pros land ~35 % of cuts within ±80 ms of a sound onset
   (motionmaxxing measurement). Not every cut needs a sound.
5. Typed sync points landed 8–11 frames off in practice. Derive cue frames from the animation code (contact frame,
   50 % pop, settle) instead.

Frames per beat is fps·60/BPM. 120 BPM gives whole frames at 24/30/60.

## Licences (checked by the source repo 2026-10-13; re-check the live page before a paid or client publish)

| Source | OK | Not OK |
|---|---|---|
| Freesound **CC0** / Kenney | anything; may bundle | — (CC-BY needs a credit; **never CC-BY-NC commercially**) |
| Mixkit SFX | videos incl. monetised, TV | redistributing the file, or putting it in a template/tool. Download into the project at runtime, never into a skill |
| Mixkit music | YouTube, social, online ads | broadcast, games, Content ID registration |
| Pixabay sounds | videos, no credit | standalone redistribution |
| YouTube Audio Library | YouTube only | anything else |
| AI music (Suno/Udio etc.) | per plan terms | see `audio-voice-captions.md` |

Every run writes a licence manifest with the sound, source URL, licence and use case. Music with an unknown source is
**LICENCE NOT CONFIRMED**: say so plainly and don't publish.

## Prove it (measure the exported MP4)

```bash
P=~/.cache/programmatic-video/venv/bin/python     # numpy/scipy/soundfile/librosa/opencv venv (see qa-and-delivery.md)
C=~/.claude/skills/programmatic-video/vendor/cinetic@ecfa6605de1a/scripts
$P -I $C/av-audit.py final.mp4 --cues cues.json [--stems stems/] --json qa/av.json
python3 -I ~/.claude/skills/programmatic-video/vendor/motionmaxxing@8c8ec0f2a6f6/scripts/look.py final.mp4 --out qa/look --expect <s> --expect-audio
```

- `cues.json` for av-audit looks like
  `{"fps":30,"total":<frames>,"events":[{"f":144,"kind":"cut","apex":false}, …]}`. Mark the hero hit `"apex":true`.
  Pass `--stems` for the strict per-stem gate, so the music can't hide a late effect.
- `look.py` prints integrated LUFS and true peak, sound onsets, cut-to-onset sync and lead/tail silence. It is stdlib
  only.
- Also run the mono check: `ffmpeg -i f.mp4 -ac 1 -af ebur128=peak=true -f null -`.
- Report the numbers, then the 5 riskiest timestamps for a headphone check.
