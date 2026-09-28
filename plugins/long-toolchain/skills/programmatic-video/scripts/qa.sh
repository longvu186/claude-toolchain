#!/usr/bin/env bash
# Video QA helpers. Outputs land in <video>.qa/ (review the PNGs with the Read tool).
# Usage:
#   bash qa.sh all <video> [cut_s ...]   probe + sheet + seams + loudness + defects + wave
#   bash qa.sh probe|sheet|loudness|defects|wave <video>
#   bash qa.sh seams <video> <cut_s> [...]    frames at cut-1f / cut / cut+1f
#   bash qa.sh frame <video> <t_s>            one full-res still
#   bash qa.sh dupes <video> [start_s end_s]  duplicate/stuck-frame ratio, optionally only over a motion segment (screencast frame-drop gate; >1% during motion = recapture)
#   bash qa.sh safezone <png>                 overlay 9:16 cross-post safe box (x80-888, y288-1248) + Meta/YouTube margins
set -uo pipefail
cmd=${1:?command}; src=${2:?file}; shift 2
[ -f "$src" ] || { echo "no such file: $src" >&2; exit 2; }
qa="${src%.*}.qa"; mkdir -p "$qa"
fps() { ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$src" | awk -F/ '{printf "%.6f", $1/($2?$2:1)}'; }
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$src"; }

probe() {
  ffprobe -v error -show_entries format=duration,size,bit_rate:stream=index,codec_name,profile,width,height,pix_fmt,r_frame_rate,color_space,color_primaries,color_transfer,sample_rate,channels \
    -of default=nw=1 "$src" | tee "$qa/probe.txt"
  local head; head=$(head -c 65536 "$src" | grep -c moov || true)
  echo "moov_in_first_64KiB=$([ "$head" -gt 0 ] && echo yes || echo NO-faststart-missing)" | tee -a "$qa/probe.txt"
}
sheet() { # <=4 columns x 480px keeps the sheet under the vision downscale limit
  local d n step; d=$(dur); n=$(awk -v d="$d" -v f="$(fps)" 'BEGIN{print int(d*f)}'); step=$(( n / 16 )); [ $step -lt 1 ] && step=1
  ffmpeg -loglevel error -y -i "$src" -vf "select='not(mod(n\,$step))',scale=480:-2,tile=4x4:padding=4:color=black" -frames:v 1 -update 1 "$qa/sheet.png" \
    && echo "sheet: $qa/sheet.png (every ${step}th frame)"
}
frame() { # exact frame nearest to t: seek to its midpoint so ffmpeg doesn't land one frame late
  local t; t=$(awk -v s="$1" -v f="$(fps)" 'BEGIN{n=int(s*f+0.5); t=(n-0.5)/f; if(t<0)t=0; printf "%.5f", t}')
  ffmpeg -loglevel error -y -ss "$t" -i "$src" -frames:v 1 -update 1 "$qa/frame_$1.png" && echo "$qa/frame_$1.png"; }
seams() {
  local f; f=$(fps)
  for c in "$@"; do
    for k in a:-1 b:0 c:1; do
      # seek to the MIDPOINT before frame N so ffmpeg lands exactly on N (seeking to N/fps+eps lands on N+1)
      local tag=${k%%:*} off=${k##*:} t; t=$(awk -v c="$c" -v o="$off" -v f="$f" 'BEGIN{n=int(c*f+0.5)+o; t=(n-0.5)/f; if(t<0)t=0; printf "%.5f", t}')
      ffmpeg -loglevel error -y -ss "$t" -i "$src" -frames:v 1 -update 1 -vf scale=640:-2 "$qa/seam_${c}_${tag}.png"
    done
    echo "seam $c: $qa/seam_${c}_{a,b,c}.png (cut-1f, cut, cut+1f)"
  done
}
loudness() {
  if ! ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$src" | grep -q .; then
    echo "NO AUDIO STREAM" | tee "$qa/loudness.txt"; return 0; fi
  ffmpeg -hide_banner -nostats -i "$src" -af ebur128=peak=true -f null - 2>&1 | awk '/Summary:/,0' | grep -E 'I:|LRA:|Peak:' | tee "$qa/loudness.txt"
  ffmpeg -hide_banner -nostats -i "$src" -af astats=metadata=0 -f null - 2>&1 | grep -E 'Overall' -A30 | grep -E 'RMS level dB|Peak level dB' | head -2 | tee -a "$qa/loudness.txt"
}
defects() {
  ffmpeg -hide_banner -nostats -i "$src" -vf "blackdetect=d=0.1:pix_th=0.05,freezedetect=n=0.001:d=0.5" -af "silencedetect=n=-50dB:d=1.5" -f null - 2>&1 \
    | grep -E 'black_start|freeze_start|silence_start' | tee "$qa/defects.txt"
  [ -s "$qa/defects.txt" ] || echo "no black/freeze/silence events" | tee "$qa/defects.txt"
}
wave() {
  ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$src" | grep -q . || { echo "no audio"; return 0; }
  ffmpeg -loglevel error -y -i "$src" -filter_complex "showwavespic=s=1920x240:split_channels=0:colors=#FF4D2E" -frames:v 1 -update 1 "$qa/wave.png" \
    && echo "wave: $qa/wave.png ($(awk -v d="$(dur)" 'BEGIN{printf "%.1f", 1920/d}') px per second)"
}
dupes() {
  local log d k win=(); [ $# -ge 2 ] && win=(-ss "$1" -to "$2")
  log=$(ffmpeg -hide_banner -nostats "${win[@]}" -i "$src" -vf mpdecimate -loglevel debug -f null - 2>&1 | grep Parsed_mpdecimate)
  d=$(grep -c ' drop pts:' <<<"$log" || true); k=$(grep -c ' keep pts:' <<<"$log" || true)
  echo "duplicate frames: $d of $((d+k)) ($(awk -v d="$d" -v t="$((d+k))" 'BEGIN{printf "%.2f", t?100*d/t:0}')%)" | tee "$qa/dupes.txt"
}
safezone() { # src is a 1080x1920 PNG
  ffmpeg -loglevel error -y -i "$src" -vf "drawbox=x=80:y=288:w=808:h=960:color=lime@0.9:t=4,drawbox=x=0:y=0:w=1080:h=270:color=red@0.25:t=fill,drawbox=x=0:y=1248:w=1080:h=672:color=red@0.25:t=fill,drawbox=x=888:y=270:w=192:h=978:color=red@0.25:t=fill" \
    "${src%.*}_safezone.png" && echo "${src%.*}_safezone.png (green = cross-post safe box, red = platform UI)"
}
case "$cmd" in
  all) probe; echo; sheet; [ $# -gt 0 ] && seams "$@"; loudness; defects; wave ;;
  probe|sheet|loudness|defects|wave) "$cmd" ;;
  dupes) dupes "$@" ;;
  seams|frame) "$cmd" "$@" ;;
  safezone) safezone ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac
