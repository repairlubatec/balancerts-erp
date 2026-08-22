import { readFile, writeFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile("docs/normative-catalog-complete-review.json", "utf8"));
const accounts = catalog.pgcaAccounts.filter((account) => /^(1|2|3|4|5)(?:$|[.\d])/.test(account.code));
const byClass = new Map();
for (const account of accounts) {
  const classCode = account.code.replace(/\..*$/, "").charAt(0);
  if (!byClass.has(classCode)) byClass.set(classCode, []);
  byClass.get(classCode).push(account);
}
const movementRules = {
  status: "PENDING_HUMAN_CONFIRMATION",
  reason: "O PDF anexado é uma obra explicativa digitalizada; as regras só podem ser transcritas literalmente após revisão visual das páginas dos esquemas de movimentação.",
  sourceFile: "PGCA_Explicado_compressed.pdf",
  sourceType: "obra auxiliar fornecida pelo utilizador",
  entries: [],
};
const output = {
  generatedAt: new Date().toISOString(),
  policy: "Inventário para revisão humana; não confirma nem activa contas ou regras.",
  source: catalog.sources.pgca,
  sourceProvidedByUser: "PGCA_Explicado_compressed.pdf",
  classes: Object.fromEntries([...byClass.entries()].map(([classCode, classAccounts]) => [classCode, {
    classCode,
    total: classAccounts.length,
    confirmed: classAccounts.filter((account) => account.status === "CONFIRMED").length,
    accounts: classAccounts,
  }])),
  movementRules,
};
await writeFile("docs/pgca-balance-sheet-review-inventory.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ classes: Object.fromEntries([...byClass.entries()].map(([key, value]) => [key, value.length])), total: accounts.length, movementRules: movementRules.entries.length }));
