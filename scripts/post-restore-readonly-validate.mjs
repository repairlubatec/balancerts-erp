import mysql from "mysql2/promise";

const url = process.env.RESTORE_DATABASE_URL;
if (!url) throw new Error("RESTORE_DATABASE_URL_REQUIRED");
const connection = await mysql.createConnection({ uri: url, connectTimeout: 15_000, ssl: { rejectUnauthorized: true } });
const tables = ["organizations", "companies", "fiscalPeriods", "chartAccounts", "journalEntries", "journalLines", "businessDocuments", "auditEvents"];
try {
  const [identityRows] = await connection.query("SELECT DATABASE() AS database_name, @@version AS server_version");
  const identity = identityRows[0] ?? {};
  const exactCounts = {};
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS row_count FROM \`${table}\``);
    exactCounts[table] = Number(rows[0]?.row_count ?? 0);
  }
  const [orphanCompanyRows] = await connection.query("SELECT COUNT(*) AS orphan_count FROM companies c LEFT JOIN organizations o ON o.id = c.organizationId WHERE o.id IS NULL");
  const [orphanPeriodRows] = await connection.query("SELECT COUNT(*) AS orphan_count FROM fiscalPeriods p LEFT JOIN companies c ON c.id = p.companyId WHERE c.id IS NULL");
  const [orphanJournalLineRows] = await connection.query("SELECT COUNT(*) AS orphan_count FROM journalLines l LEFT JOIN journalEntries e ON e.id = l.entryId WHERE e.id IS NULL");
  const integrity = {
    orphanCompanies: Number(orphanCompanyRows[0]?.orphan_count ?? 0),
    orphanFiscalPeriods: Number(orphanPeriodRows[0]?.orphan_count ?? 0),
    orphanJournalLines: Number(orphanJournalLineRows[0]?.orphan_count ?? 0),
  };
  process.stdout.write(JSON.stringify({ readOnly: true, database: identity.database_name, serverVersion: identity.server_version, exactCounts, integrity, integrityValid: Object.values(integrity).every((count) => count === 0), sensitiveValuesOmitted: true }, null, 2) + "\n");
} finally {
  await connection.end();
}
