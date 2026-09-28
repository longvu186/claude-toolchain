#!/usr/bin/env bash
# Publish a video (or a directory) at a temporary public https://*.trycloudflare.com link.
# Usage: bash share.sh <video-file|dir> [port=8791] [hours=24]
# - Video file: builds a player page (autoplay muted loop + download link) in <file-dir>/.share-<name>/
# - Runs a Range-capable static server + cloudflared quick tunnel as transient systemd units that auto-expire.
# - The link is PUBLIC (unguessable, no auth). Tell the user, with the expiry and the stop command.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
src=$(realpath "${1:?file or dir}"); port=${2:-8791}; hours=${3:-24}
node_bin=$(command -v node); cf_bin=$(command -v cloudflared) || { echo "cloudflared not installed" >&2; exit 2; }

if [ -f "$src" ]; then
  name=$(basename "${src%.*}"); share="$(dirname "$src")/.share-$name"; mkdir -p "$share"
  ext="${src##*.}"; cp -f "$src" "$share/video.$ext"
  cat > "$share/index.html" <<EOF
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>$name</title><style>html,body{margin:0;height:100%;background:#0B0B10;color:#EEE;font:600 13px/1.4 ui-monospace,monospace}
main{min-height:100%;display:grid;place-items:center;gap:14px;padding:24px;box-sizing:border-box}
video{max-width:min(100%,1280px);max-height:82vh;background:#000}a{color:#FF6A4D}</style></head><body><main>
<video src="video.$ext" controls autoplay muted loop playsinline></video>
<div>$name, unmute for sound · <a href="video.$ext" download>download</a></div></main></body></html>
EOF
else
  share="$src"; name=$(basename "$src")
fi
slug=$(echo "$name" | tr -c 'a-zA-Z0-9-' '-' | cut -c1-40 | sed 's/-*$//')
while ss -ltnH | awk '{print $4}' | grep -qE ":$port\$"; do port=$((port+1)); done
cfhome=$(mktemp -d "/tmp/share-cf-$slug.XXXX"); : > "$cfhome/empty.yml"   # isolate from ~/.cloudflared/config.yml
secs=$((hours*3600))
for u in "share-$slug-http" "share-$slug-tunnel"; do systemctl stop "$u" 2>/dev/null || true; systemctl reset-failed "$u" 2>/dev/null || true; done
systemd-run --quiet --unit="share-$slug-http" --property=RuntimeMaxSec=$secs --setenv=HOME=/root "$node_bin" "$here/serve.cjs" "$share" "$port"
systemd-run --quiet --unit="share-$slug-tunnel" --property=RuntimeMaxSec=$secs --setenv=HOME="$cfhome" \
  "$cf_bin" tunnel --no-autoupdate --config "$cfhome/empty.yml" --url "http://127.0.0.1:$port"
inv=$(systemctl show -p InvocationID --value "share-$slug-tunnel")
url=""
for _ in $(seq 1 40); do
  logs=$(journalctl "_SYSTEMD_INVOCATION_ID=$inv" --no-pager -o cat 2>/dev/null || true)
  url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' <<<"$logs" | tail -1 || true)
  [ -n "$url" ] && grep -q 'Registered tunnel' <<<"$logs" && break; sleep 1
done
[ -n "$url" ] || { echo "tunnel did not come up; see: journalctl -u share-$slug-tunnel" >&2; exit 1; }
# new hostnames take a few seconds to resolve (curl exit 6); never let set -e kill the retry loop
code=000; for _ in $(seq 1 40); do code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url/" || true); [ "$code" = 200 ] && break; sleep 3; done
[ "$code" = 200 ] || { echo "public URL returned $code: $url (check journalctl -u share-$slug-tunnel)" >&2; exit 1; }
if [ -f "$src" ]; then
  r=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -H 'Range: bytes=0-1023' "$url/video.$ext" || true)
  [ "$r" = 206 ] || { echo "range request returned $r (Safari/iOS playback would fail)" >&2; exit 1; }
fi
echo "URL: $url/"
echo "public (no auth), expires in ${hours}h; stop now: systemctl stop share-$slug-tunnel share-$slug-http"
