import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const flatten = (value) => {
  const result = [];
  const visit = (item, parentCode = null, level = 1) => {
    if (!item || typeof item !== "object") return;
    const current = { ...item, parentCode: item.parentCode ?? item.parent ?? parentCode, level: item.level ?? level };
    result.push(current);
    for (const child of [...(item.children ?? []), ...(item.accounts ?? [])]) visit(child, current.code, level + 1);
  };
  if (Array.isArray(value)) value.forEach((item) => visit(item));
  else if (Array.isArray(value.classes)) value.classes.forEach((item) => visit(item));
  else if (Array.isArray(value.accounts)) value.accounts.forEach((item) => visit(item));
  return result;
};
const full = flatten(read("/tmp/pgc-angola-main/pgc_chart_of_accounts.json"));
const confirmed = flatten(read("docs/normative-sources/pgca-visually-confirmed-accounts.json"));
const confirmedCodes = new Set(confirmed.map((item) => item.code));
const missing = full.filter((item) => !confirmedCodes.has(item.code));
const byClass = Object.groupBy(missing, (item) => String(item.code).split(/[.]/)[0]);
const report = {
  fullCount: full.length,
  confirmedCount: confirmed.length,
  missingCount: missing.length,
  missingByClass: Object.fromEntries(Object.entries(byClass).map(([key, items]) => [key, items.length])),
  missingCodes: missing.map((item) => ({ code: item.code, name: item.name, parentCode: item.parentCode, level: item.level })),
};
console.log(JSON.stringify(report, null, 2));
