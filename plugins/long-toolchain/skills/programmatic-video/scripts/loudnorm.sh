#!/usr/bin/env bash
# Two-pass linear EBU R128 normalisation (default -14 LUFS / -1 dBTP), always resampled to 48 kHz
# (loudnorm upsamples to 192 kHz internally).
# - Audio in -> audio out (WAV/FLAC; no lossy step).
# - Video in -> video out: the video stream is copied and audio re-encoded to AAC. The AAC encoder adds true-peak
#   overshoot (measured up to ~1 dB on dense/saturated mixes), so the result is re-measured AFTER encoding and the
#   ceiling is lowered by the overshoot until the delivered file passes (max 3 tries, non-zero exit if it never does).
# Usage: bash loudnorm.sh <in> <out> [I=-14] [TP=-1] [LRA=11]
set -euo pipefail
in=${1:?in}; out=${2:?out}; I=${3:--14}; TP=${4:--1}; LRA=${5:-11}

measure_tp() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary:/,0' | awk '/Peak:/{print $2}' | tail -1; }
measure_i()  { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 | awk '/Summary:/,0' | awk '/ I:/{print $2}' | head -1; }
pass() { # $1 = true-peak ceiling to use
  local tp=$1 json get mi mtp mlra mth off af
  json=$(ffmpeg -hide_banner -nostats -i "$in" -af "loudnorm=I=$I:TP=$tp:LRA=$LRA:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  get() { sed -n "s/.*\"$1\" *: *\"\\([^\"]*\\)\".*/\\1/p" <<<"$json"; }
  mi=$(get input_i); mtp=$(get input_tp); mlra=$(get input_lra); mth=$(get input_thresh); off=$(get target_offset)
  [ -n "$mi" ] || { echo "loudnorm pass 1 failed (no audio stream?)" >&2; exit 1; }
  af="loudnorm=I=$I:TP=$tp:LRA=$LRA:measured_I=$mi:measured_TP=$mtp:measured_LRA=$mlra:measured_thresh=$mth:offset=$off:linear=true"
  if [ "$is_video" = 1 ]; then
    ffmpeg -loglevel error -y -i "$in" -map 0:v -map 0:a -c:v copy -af "$af" -ar 48000 -c:a aac -b:a 256k -movflags +faststart "$out"
  else
    ffmpeg -loglevel error -y -i "$in" -af "$af" -ar 48000 "$out"
  fi
  echo "source measured I=$mi LUFS TP=$mtp dBTP (ceiling used: $tp)"
}
is_video=0; ffprobe -v error -select_streams v -show_entries stream=index -of csv=p=0 "$in" | grep -q . && is_video=1
ceiling=$TP
for try in 1 2 3; do
  pass "$ceiling"
  got_tp=$(measure_tp "$out"); got_i=$(measure_i "$out")
  echo "delivered: I=$got_i LUFS, true peak=$got_tp dBTP (target I=$I, TP<=$TP)"
  if awk -v g="$got_tp" -v t="$TP" 'BEGIN{exit !(g<=t)}'; then echo "PASS"; exit 0; fi
  ceiling=$(awk -v c="$ceiling" -v g="$got_tp" -v t="$TP" 'BEGIN{printf "%.2f", c-(g-t)-0.1}')
  echo "over by $(awk -v g="$got_tp" -v t="$TP" 'BEGIN{printf "%.2f", g-t}') dB after encode, retrying with ceiling $ceiling"
done
echo "FAIL: could not meet true peak <= $TP dBTP" >&2; exit 1
