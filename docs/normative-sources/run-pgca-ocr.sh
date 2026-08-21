#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$BASE/pgca-pages" "$BASE/pgca-ocr"
pdftoppm -r 150 -gray -png "$BASE/decreto-82-01-pgca.pdf" "$BASE/pgca-pages/page" >/dev/null 2>&1
for image in "$BASE"/pgca-pages/page-*.png; do
  stem="${image##*/}"
  stem="${stem%.png}"
  tesseract "$image" "$BASE/pgca-ocr/$stem" -l por --psm 6 >/dev/null 2>&1 || true
done
cat "$BASE"/pgca-ocr/page-*.txt > "$BASE/decreto-82-01-pgca-ocr.txt"
wc -l -w -c "$BASE/decreto-82-01-pgca-ocr.txt"
