# Audio, voice (TTS), timestamps, captions, loudness

Evidence: `research/programmatic-video/02-educational-explainers.md` §5–6 and `03-…` §5–6.

## Choosing a TTS engine (Sept 2026)

| Engine | Vietnamese | Word timing | Cost | Use |
|---|---|---|---|---|
| **ElevenLabs v3 / Flash v2.5** | ✅ | ✅ per character (`POST /v1/text-to-speech/{voice}/with-timestamps`) | $0.10 / $0.05 per 1k chars | Best expressive quality. **Set `model_id` explicitly: the endpoint defaults to `eleven_multilingual_v2`, which has NO Vietnamese** |
| **Azure Neural** `vi-VN-HoaiMyNeural` (F) / `vi-VN-NamMinhNeural` (M) | ✅ | ✅ WordBoundary + SSML `<bookmark>` | Free tier ~0.5M chars/month | Most robust sync story. Native in manim-voiceover. Slow its ~200 wpm default |
| Google Chirp 3 HD `vi-VN-Chirp3-HD-*` | ✅ | ❌ (no SSML, no `<mark>`) | Per 1M chars | Force-align afterwards |
| Gemini 3.8 Flash TTS | ✅ (vendor says top for vi) | ❌ | — | Prompt-steerable style. Force-align |
| OpenAI `gpt-4o-mini-tts` | ⚠ English-optimised, so test | ❌ | ~$0.015/min | Force-align |
| **VieNeu-TTS v3 Turbo** (local, Apache-2.0) | ✅ native, vi↔en code-switch | ❌ | Free, CPU-capable | Offline Vietnamese. Force-align. (v4 is proprietary) |
| Piper `vi_VN-vais1000` | ✅ robotic | ❌ | Free (GPL) | Drafts only |
| Kokoro-82M | ❌ **no Vietnamese** | — | Free | Great English per unit of compute |
| Chatterbox v3 | ⚠ listed, but the vendor reports 75% CER on vi | — | — | Avoid for vi |
| F5-TTS vi fine-tunes, XTTS v2 weights | ✅ / ❌ | — | **Non-commercial licences** | Avoid for client work |
| Amazon Polly, Qwen3-TTS, VibeVoice | ❌ no Vietnamese | — | — | — |

Keys: run `list-secret-keys` to see what exists (names only), and `with-secrets -- <cmd>` to use them. Never print
values. Tell the operator the voice is AI-generated so they can disclose it.

## Word timestamps: pick the first that applies

1. **Native TTS timestamps** (ElevenLabs characters grouped into words on whitespace; Azure WordBoundary, offsets in
   100 ns ticks). Use `alignment` (the original text) for captions; `normalized_alignment` follows the expanded text.
2. **Forced alignment of the known script** (preferred for any TTS without timestamps):
   - WhisperX `align()`; Vietnamese needs `nguyenvulebinh/wav2vec2-base-vi-vlsp2020`.
   - torchaudio `MMS_FA` (1,100+ languages; **drops numbers it can't romanise**).
   - MFA with the Vietnamese acoustic model v2.0.0.
   - ElevenLabs Forced Alignment has **no Vietnamese**.

   **Normalise numbers before aligning.** WhisperX gives tokens like "2014." no timing.
3. **ASR** (faster-whisper `word_timestamps=True`, whisper.cpp `--dtw`, Remotion `@remotion/install-whisper-cpp`) only
   for human-recorded audio or existing footage. Turn VAD on, since Whisper hallucinates on silence. Use non-`.en`
   models for Vietnamese. **PhoWhisper** beats Whisper-large-v3 on standard Vietnamese, while large-v3 wins on
   code-switched vi/en.

For Vietnamese, always NFC-normalise before matching timestamps to script tokens. Mixed NFD/NFC breaks matching.

## Captions: build rules

- **Pack words greedily:**
  - ≤ 42 chars/line, ≤ 2 lines.
  - **≤ 17 cps for Vietnamese** (Netflix vi; children 13), ≤ 20 cps for English.
  - Each cue 5/6 s (0.833 s) to 7 s.
- **Break** after punctuation or before conjunctions. Never split article+noun, adjective+noun, a name, or
  verb+auxiliary. Prefer a bottom-heavy pyramid.
- **Netflix Vietnamese conventions:** spell out 1–10 and use numerals from 11. Decimal comma (`2,5`), thousands dot
  (`1.000 đồng`). Keep diacritics in names. Use the U+2026 ellipsis.
- **Formats:**
  - SRT is the portable sidecar.
  - WebVTT is the web standard (`line:`/`position:`, karaoke `<00:00:01.200>`).
  - ASS for styled burn-in: colours are `&HAABBGGRR` (BGR), and `Fontsize` is line-box height, not em size.
- **Where to ship them:**
  - Burn in for TikTok, Reels, Shorts and X.
  - Also ship sidecars for YouTube, LinkedIn and Facebook.
  - To mux a sidecar into MP4: `-c:s mov_text`.
- **ffmpeg burn-in** needs a libass build (`ffmpeg -filters | grep subtitles`) plus fonts with the glyphs, e.g.
  `subtitles=c.srt:fontsdir=./fonts:force_style='FontName=Be Vietnam Pro,Outline=2'`. For word-highlight styles,
  render the captions in the browser instead.
- **WCAG 1.2.2:** captions must be accurate. Unverified auto-captions don't count.

## Loudness and mix

- **Delivery targets:**
  - Online: **−14 LUFS integrated, true peak ≤ −1 dBTP**.
  - Dialogue-led explainer: −16 LUFS is also fine.
  - Broadcast: −23 (EBU R128).
  - Only YouTube's normalisation is documented: it turns loud masters down and never up.
- **Two-pass, linear loudnorm, and always `-ar 48000`** (loudnorm resamples to 192 kHz internally):
  ```bash
  ffmpeg -i mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2> ln.txt   # read measured_* from JSON
  ffmpeg -i mix.wav -af loudnorm=I=-14:TP=-1:LRA=11:measured_I=X:measured_TP=X:measured_LRA=X:measured_thresh=X:offset=X:linear=true -ar 48000 mix_n.wav
  ```
  The helper `bash scripts/qa.sh loudness <file>` prints integrated loudness and true peak.
- **Ducking.** Music sits 12–18 dB under the voiceover and is high-passed at 100–150 Hz under it. UI clicks are −20 to
  −25 dB relative to the voiceover.
- **Fades.** 5–30 ms on every audio edit so cuts never pop, and at both ends of a loop.
- **Checks.** Listen on a phone speaker. Check `astats` peak and RMS, and `showwavespic` to confirm transients sit on the
  cue grid.

## Procedural sound (no licence needed)

`templates/showreel/synth.cjs` is a verified pure-Node synth that writes a 48 kHz stereo WAV from the shared
`timeline.js`. It includes:
- Kick: a pitch-swept sine.
- Impact: kick + sub + low-passed noise.
- Hats: differenced noise.
- SVF band-pass noise sweeps: risers, whooshes, typewriter ticks.
- FM zaps, a detuned-saw drone, and a pad chord.
- A Schroeder reverb send, a tanh soft clip, and normalisation to −1 dBFS.

Seed every noise source. Alternatives in the same headless page: `OfflineAudioContext` or `Tone.Offline(cb, dur)`.
ffmpeg `aevalsrc`/`anoisesrc`/`sine` also work for quick tones.

**Beat-syncing to a supplied track:** detect beats (librosa `beat.beat_track`, aubio), snap scene boundaries to the
nearest beat within ±3 frames, and put the biggest visual change on the downbeat.
