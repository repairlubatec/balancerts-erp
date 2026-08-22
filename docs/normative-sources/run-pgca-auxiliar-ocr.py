from pathlib import Path
import subprocess

pdf = Path('docs/normative-sources/pgca-explicado-auxiliar.pdf')
out = Path('docs/normative-sources/pgca-explicado-auxiliar-ocr.txt')
out.parent.mkdir(parents=True, exist_ok=True)

parts = []
for page in range(1, 31):
    prefix = Path('/tmp') / f'pgca_aux_{page}'
    subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-r', '120', '-jpeg', '-singlefile', str(pdf), str(prefix)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    text = subprocess.check_output(['tesseract', f'{prefix}.jpg', 'stdout', '-l', 'por'], text=True, stderr=subprocess.DEVNULL)
    parts.append(f'\n===== PÁGINA {page} =====\n{text}')
    Path(f'{prefix}.jpg').unlink(missing_ok=True)
out.write_text(''.join(parts), encoding='utf-8')
print(out)
