import { readFile, writeFile } from "node:fs/promises";
const root = "/home/ubuntu/balancerts-erp";
const catalog = JSON.parse(await readFile(`${root}/docs/normative-catalog-complete-review.json`, "utf8"));
const groups = new Map();
for (const account of catalog.pgcaAccounts) {
  const first = account.code.charAt(0);
  const key = `PGCA-CLASSE-${first}`;
  if (!groups.has(key)) groups.set(key, { batchId: key, domain: "PGCA", scope: `Classe ${first}`, status: "PENDING_HUMAN_CONFIRMATION", count: 0, confirmed: 0, candidateCodes: [] });
  const batch = groups.get(key);
  batch.count += 1;
  if (account.status === "CONFIRMED") batch.confirmed += 1;
  batch.candidateCodes.push(account.code);
}
for (const rule of catalog.ivaRules) {
  const key = `IVA-${rule.article.replace(/[^0-9IVX]+/gi, "") || "REGRA"}`;
  if (!groups.has(key)) groups.set(key, { batchId: key, domain: "IVA", scope: rule.article, status: "PENDING_HUMAN_CONFIRMATION", count: 0, confirmed: 0, candidateCodes: [] });
  const batch = groups.get(key);
  batch.count += 1;
  if (rule.status === "CONFIRMED") batch.confirmed += 1;
  batch.candidateCodes.push(rule.id);
}
const batches = [...groups.values()].sort((a, b) => a.batchId.localeCompare(b.batchId, undefined, { numeric: true }));
const review = { policy: "Aprovar visualmente cada lote; activar somente CONFIRMED", generatedAt: new Date().toISOString(), totalBatches: batches.length, batches };
await writeFile(`${root}/docs/normative-human-confirmation-batches.json`, JSON.stringify(review, null, 2));
console.log(JSON.stringify({ totalBatches: review.totalBatches, batches: batches.map(({ batchId, domain, scope, count, confirmed }) => ({ batchId, domain, scope, count, confirmed })) }));
