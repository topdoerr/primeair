#!/usr/bin/env bash
# Headless-Chromium screenshots of local pages for design review.
#   scripts/screenshot.sh <url> <out.png> [width] [height]
# Uses the Playwright-managed Chromium pre-installed in this environment
# (no npm install needed). Height controls how much of the page is captured.
set -euo pipefail

URL="${1:?url}"
OUT="${2:?output png}"
W="${3:-1440}"
H="${4:-1800}"

CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
if [ ! -x "$CHROME" ]; then
  CHROME="$(find /opt/pw-browsers -maxdepth 3 -type f -name chrome | head -1)"
fi

mkdir -p "$(dirname "$OUT")"
"$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size="${W},${H}" \
  --virtual-time-budget=4000 --run-all-compositor-stages-before-draw \
  --screenshot="$OUT" "$URL" >/dev/null 2>&1

echo "$OUT"
