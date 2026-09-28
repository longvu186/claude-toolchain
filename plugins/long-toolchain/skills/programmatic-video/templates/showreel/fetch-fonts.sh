#!/usr/bin/env bash
# Downloads the OFL fonts the showreel uses into ./fonts (not vendored to keep the skill small).
# NOTE: Archivo Black has NO Vietnamese glyphs. For Vietnamese text swap it for Be Vietnam Pro / Montserrat / Anton.
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p fonts
curl -fsSL -o fonts/ArchivoBlack-Regular.ttf https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf
curl -fsSL -o fonts/SpaceMono-Bold.ttf       https://github.com/google/fonts/raw/main/ofl/spacemono/SpaceMono-Bold.ttf
curl -fsSL -o fonts/Unbounded.ttf            "https://github.com/google/fonts/raw/main/ofl/unbounded/Unbounded%5Bwght%5D.ttf"
# Vietnamese-safe display alternative:
curl -fsSL -o fonts/BeVietnamPro-ExtraBold.ttf https://github.com/google/fonts/raw/main/ofl/bevietnampro/BeVietnamPro-ExtraBold.ttf
ls -la fonts
