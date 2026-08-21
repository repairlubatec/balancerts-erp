#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$BASE/iva-pages" "$BASE/iva-ocr"
pdftoppm -r 150 -gray -png "$BASE/lei-14-23-iva.pdf" "$BASE/iva-pages/page" >/dev/null 2>&1
for image in "$BASE"/iva-pages/page-*.png; do
  stem="${image##*/}"
  stem="${stem%.png}"
  tesseract "$image" "$BASE/iva-ocr/$stem" -l por --psm 6 >/dev/null 2>&1 || true
done
cat "$BASE"/iva-ocr/page-*.txt > "$BASE/lei-14-23-iva-ocr.txt"
wc -l -w -c "$BASE/lei-14-23-iva-ocr.txt"
