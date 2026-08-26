import fs from "node:fs";
const result = JSON.parse(fs.readFileSync("docs/pgca-upload-validation-2026-08-26.json", "utf8"));
const count = (items) => Object.fromEntries(Object.entries(Object.groupBy(items, (item) => item.code)).map(([code, rows]) => [code, rows.length]));
console.log(JSON.stringify({ valid: result.valid, activationEligible: result.activationEligible, accountCount: result.accountCount, errorCount: result.errorCount, warningCount: result.warningCount, errorsByCode: count(result.errors), warningsByCode: count(result.warnings) }, null, 2));
