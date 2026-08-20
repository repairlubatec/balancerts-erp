import mysql from "mysql2/promise";

export const integrityChecks = [
  ["companies.organizationId", "companies", "organizationId", "organizations", "id"],
  ["employees.companyId", "employees", "companyId", "companies", "id"],
  ["employees.organizationId", "employees", "organizationId", "organizations", "id"],
  ["employmentContracts.employeeId", "employmentContracts", "employeeId", "employees", "id"],
  ["employmentContracts.companyId", "employmentContracts", "companyId", "companies", "id"],
  ["journalEntries.periodId", "journalEntries", "periodId", "fiscalPeriods", "id"],
  ["journalLines.entryId", "journalLines", "entryId", "journalEntries", "id"],
  ["journalLines.accountId", "journalLines", "accountId", "chartAccounts", "id"],
  ["businessDocuments.companyId", "businessDocuments", "companyId", "companies", "id"],
  ["documentItems.documentId", "documentItems", "documentId", "businessDocuments", "id"],
  ["documentTaxes.documentId", "documentTaxes", "documentId", "businessDocuments", "id"],
  ["payments.companyId", "payments", "companyId", "companies", "id"],
  ["treasuryTransactions.cashAccountId", "treasuryTransactions", "cashAccountId", "cashAccounts", "id"],
  ["stockMovements.companyId", "stockMovements", "companyId", "companies", "id"],
  ["stockMovements.periodId", "stockMovements", "periodId", "fiscalPeriods", "id"],
  ["fileAssets.companyId", "fileAssets", "companyId", "companies", "id"],
  ["auditEvents.organizationId", "auditEvents", "organizationId", "organizations", "id"],
];

export function buildOrphanQuery([label, childTable, childColumn, parentTable, parentColumn]) {
  return { label, sql: `SELECT COUNT(*) AS orphanCount FROM \`${childTable}\` child LEFT JOIN \`${parentTable}\` parent ON parent.\`${parentColumn}\` = child.\`${childColumn}\` WHERE child.\`${childColumn}\` IS NOT NULL AND parent.\`${parentColumn}\` IS NULL` };
}

export async function auditReferentialIntegrity(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const results = [];
    for (const check of integrityChecks) {
      const query = buildOrphanQuery(check);
      const [rows] = await connection.query(query.sql);
      const orphanCount = Number(rows[0]?.orphanCount ?? 0);
      results.push({ label: query.label, orphanCount, status: orphanCount === 0 ? "OK" : "ORPHANS_FOUND" });
    }
    return { ok: results.every(result => result.orphanCount === 0), checked: results.length, results };
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  auditReferentialIntegrity().then(result => { console.log(JSON.stringify(result, null, 2)); if (!result.ok) process.exitCode = 2; }).catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
