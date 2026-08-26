import fs from "node:fs";
import crypto from "node:crypto";

const archives = [
  { id: "UPLOAD_PGC_ANGOLA_MAIN", base: "/tmp/pgc-angola-main", files: { flat: "pgc_chart_of_accounts_flat.json", tree: "pgc_chart_of_accounts.json", typed: "pgc_type_detailType.json", text: "pgc.txt", pdf: "docs/pgc.pdf" } },
  { id: "PROJECT_PGCA_CONFIRMED", base: ".", files: { tree: "docs/normative-sources/pgca-visually-confirmed-accounts.json", text: "docs/normative-sources/decreto-82-01-pgca.txt" } },
];

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const accountsFrom = (value) => {
  const flattened = [];
  const visit = (account, parentCode = null, level = 1) => {
    if (!account || typeof account !== "object") return;
    const current = { ...account, parentCode: account.parentCode ?? parentCode, level: account.level ?? level };
    flattened.push(current);
    for (const child of [...(account.children ?? []), ...(account.accounts ?? [])]) visit(child, current.code, level + 1);
  };
  if (Array.isArray(value)) value.forEach((account) => visit(account));
  else if (Array.isArray(value.accounts)) value.accounts.forEach((account) => visit(account));
  else if (Array.isArray(value.classes)) value.classes.forEach((account) => visit(account));
  else if (Array.isArray(value.chartOfAccounts)) value.chartOfAccounts.forEach((account) => visit(account));
  else if (Array.isArray(value.data)) value.data.forEach((account) => visit(account));
  return flattened;
};
const codeOf = (account) => String(account.code ?? account.accountCode ?? "").trim();
const natureOf = (account) => String(account.nature ?? account.accountNature ?? account.natureza ?? "").trim();
const postableOf = (account) => account.postable === true || account.launchable === true || account.lancavel === true || ["MOVIMENTAVEL", "MOVIMENTÁVEL", "POSTABLE", "LANCAVEL", "LANÇÁVEL"].includes(natureOf(account).toUpperCase());

const report = [];
for (const archive of archives) {
  const row = { id: archive.id, base: archive.base, files: {}, metrics: {} };
  for (const [kind, relative] of Object.entries(archive.files)) {
    const file = `${archive.base}/${relative}`;
    if (!fs.existsSync(file)) { row.files[kind] = { path: relative, exists: false }; continue; }
    row.files[kind] = { path: relative, exists: true, sha256: sha256(file), bytes: fs.statSync(file).size };
    if (kind === "flat" || kind === "tree" || kind === "typed") {
      const accounts = accountsFrom(json(file));
      const codes = accounts.map(codeOf).filter(Boolean);
      const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
      const withNature = accounts.filter((account) => Boolean(natureOf(account))).length;
      const postable = accounts.filter(postableOf).length;
      const classes = accounts.filter((account) => codeOf(account).length === 1).map(codeOf);
      row.metrics[kind] = { entries: accounts.length, codes: codes.length, duplicateCodes: [...new Set(duplicates)], classes: [...new Set(classes)], withNature, postable, parentFields: accounts.filter((account) => account.parentCode || account.parent || account.parentId).length };
    }
  }
  report.push(row);
}
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));
