from __future__ import annotations

import csv
import re
from pathlib import Path

SOURCE = Path(__file__).with_name("decreto-82-01-pgca-ocr.txt")
OUTPUT = Path(__file__).with_name("decreto-82-01-pgca-review.csv")

code_re = re.compile(r"(?<!\d)([1-9]\d{2,4})(?!\d)")
page_re = re.compile(r"(?:p[aá]g(?:ina)?\.?|page)\s*[:.]?\s*(\d+)", re.IGNORECASE)

rows: list[dict[str, str]] = []
current_page = ""
for line_number, raw in enumerate(SOURCE.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
    line = " ".join(raw.split())
    if not line:
        continue
    page_match = page_re.search(line)
    if page_match:
        current_page = page_match.group(1)
    candidates = code_re.findall(line)
    if not candidates:
        continue
    for code in candidates:
        # Keep the OCR text exactly as evidence; review is required where a line has
        # several codes because the source PDF uses two-column tables.
        review = "REVISAR_COLUNAS" if len(candidates) > 1 else "REVISAR_OCR"
        rows.append({
            "lineNumber": str(line_number),
            "pageHint": current_page,
            "codeCandidate": code,
            "ocrLiteral": line,
            "reviewStatus": review,
        })

with OUTPUT.open("w", encoding="utf-8", newline="") as handle:
    writer = csv.DictWriter(handle, fieldnames=list(rows[0]) if rows else ["lineNumber", "pageHint", "codeCandidate", "ocrLiteral", "reviewStatus"])
    writer.writeheader()
    writer.writerows(rows)

print(f"candidatos={len(rows)}")
print(f"ficheiro={OUTPUT}")
