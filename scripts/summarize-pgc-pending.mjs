import fs from "node:fs";
const diff = JSON.parse(fs.readFileSync("docs/pgca-code-diff-2026-08-26.json", "utf8"));
const byClass = new Map();
const byLevel = new Map();
const byPrefix = new Map();
for (const row of diff.missingCodes) {
  const cls = row.code.split(/[.]/)[0];
  const level = row.level ?? row.code.split(/[.]/).length;
  byClass.set(cls, (byClass.get(cls) ?? 0) + 1);
  byLevel.set(level, (byLevel.get(level) ?? 0) + 1);
  const prefix = row.code.split(/[.]/).slice(0, 2).join(".");
  const bucket = byPrefix.get(prefix) ?? { count: 0, first: row, last: row };
  bucket.count += 1;
  bucket.last = row;
  byPrefix.set(prefix, bucket);
}
const lines = ["# Resumo concreto das contas PGCA pendentes", "", `O arquivo completo contém ${diff.fullCount} registos; ${diff.confirmedCount} estão confirmados visualmente no ERP e ${diff.missingCount} não têm confirmação equivalente persistida. A diferença representa confirmação normativa, não duplicação hierárquica.`, "", "## Distribuição por classe", "", "| Classe | Pendentes |", "|---:|---:|", ...[...byClass.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([k,v])=>`| ${k} | ${v} |`), "", "## Distribuição por nível", "", "| Nível do arquivo | Pendentes |", "|---:|---:|", ...[...byLevel.entries()].sort((a,b)=>a[0]-b[0]).map(([k,v])=>`| ${k} | ${v} |`), "", "## Grupos de códigos", "", "| Prefixo | Pendentes | Primeiro exemplo | Último exemplo |", "|---|---:|---|---|", ...[...byPrefix.entries()].sort((a,b)=>a[0].localeCompare(b[0], undefined, {numeric:true})).map(([k,v])=>`| ${k} | ${v.count} | ${v.first.code} — ${v.first.name} | ${v.last.code} — ${v.last.name} |`), "", "## Critério de confirmação", "", "Cada conta pendente precisa de evidência primária legível que permita confirmar literalmente código/designação, relação hierárquica, natureza, tipo de conta e regra de movimentação. Contas agregadoras não devem ser tratadas como contas movimentáveis; subcontas e contas analíticas não são duplicados apenas por partilharem o mesmo prefixo.", ""];
fs.writeFileSync("docs/pgca-pending-concrete-summary-2026-08-26.md", lines.join("\n"));
console.log(JSON.stringify({fullCount: diff.fullCount, confirmedCount: diff.confirmedCount, missingCount: diff.missingCount, byLevel: Object.fromEntries(byLevel), groups: byPrefix.size}, null, 2));
