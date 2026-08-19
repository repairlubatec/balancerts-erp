import fs from 'node:fs';
const source = fs.readFileSync('client/src/components/HumanResourcesPanel.tsx', 'utf8');
for (const needle of ['Recibo interno', 'window.print']) {
  const index = source.indexOf(needle);
  const output = index >= 0 ? source.slice(Math.max(0, index - 500), index + 3500) : 'não encontrado';
  fs.writeFileSync(`scripts/receipt-${needle === 'window.print' ? 'print' : 'header'}.txt`, output);
}
