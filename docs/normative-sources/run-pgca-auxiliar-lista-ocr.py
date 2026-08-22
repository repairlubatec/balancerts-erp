from pathlib import Path
import subprocess

pdf = Path('docs/normative-sources/pgca-explicado-auxiliar.pdf')
out = Path('docs/normative-sources/pgca-explicado-auxiliar-lista-ocr.txt')
parts = []
for page in range(105, 132):
    prefix = Path('/tmp') / f'pgca_aux_list_{page}'
    subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-r', '160', '-jpeg', '-singlefile', str(pdf), str(prefix)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    text = subprocess.check_output(['tesseract', f'{prefix}.jpg', 'stdout', '-l', 'por'], text=True, stderr=subprocess.DEVNULL)
    parts.append(f'\n===== PÁGINA {page} =====\n{text}')
    Path(f'{prefix}.jpg').unlink(missing_ok=True)
out.write_text(''.join(parts), encoding='utf-8')
print(out)
