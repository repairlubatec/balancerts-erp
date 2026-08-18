import json
from pathlib import Path

source = Path('/home/ubuntu/balancerts-erp/docs/google-drive-inventory.ndjson')
output = Path('/home/ubuntu/balancerts-erp/docs/google-drive-relevant-manifest.md')
terms = ('balancerts', 'agt', 'angola', 'fiscal', 'saft', 'logo', 'lubatec', 'decreto', 'pgc', 'factur', 'contab', 'requisitos')
rows = []
for line in source.read_text(encoding='utf-8').splitlines():
    try:
        payload = json.loads(line)
    except json.JSONDecodeError:
        continue
    for file in payload.get('files', []):
        name = file.get('name', '')
        if any(term in name.casefold() for term in terms):
            rows.append(file)
rows.sort(key=lambda item: (item.get('mimeType', ''), item.get('name', '').casefold()))
lines = ['# Manifesto de documentos relevantes do Google Drive', '', '| Nome | Tipo | ID | Modificado | Tamanho | Link |', '|---|---|---|---|---:|---|']
for item in rows:
    lines.append('| {name} | {mime} | `{id}` | {modified} | {size} | [abrir]({link}) |'.format(
        name=item.get('name', '').replace('|', '\\|'),
        mime=item.get('mimeType', ''),
        id=item.get('id', ''),
        modified=item.get('modifiedTime', ''),
        size=item.get('size', ''),
        link=item.get('webViewLink', '')
    ))
output.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(f'{len(rows)} documentos relevantes')
