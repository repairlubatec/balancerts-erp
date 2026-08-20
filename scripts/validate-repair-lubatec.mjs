import mysql from "mysql2/promise";

export function buildValidationConfig(env = process.env) {
  const companyId = Number(env.REPAIR_LUBATEC_COMPANY_ID ?? 1);
  const organizationId = Number(env.REPAIR_LUBATEC_ORGANIZATION_ID ?? 1);
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL_REQUIRED");
  if (!Number.isInteger(companyId) || companyId <= 0) throw new Error("INVALID_COMPANY_ID");
  if (!Number.isInteger(organizationId) || organizationId <= 0) throw new Error("INVALID_ORGANIZATION_ID");
  return { companyId, organizationId, databaseUrl };
}

export async function validateRepairLubatec(env = process.env) {
  const { companyId, organizationId, databaseUrl } = buildValidationConfig(env);
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [companyRows] = await connection.query(
      "SELECT id, organizationId, name, nif, functionalCurrency, ivaRegime, configurationStatus FROM companies WHERE id = ?",
      [companyId],
    );
    const [exerciseRows] = await connection.query(
      "SELECT id, companyId, year, status FROM fiscalExercises WHERE companyId = ? ORDER BY year",
      [companyId],
    );
    const [periodRows] = await connection.query(
      "SELECT id, companyId, exerciseId, year, month, status FROM fiscalPeriods WHERE companyId = ? ORDER BY year, month",
      [companyId],
    );

    const [tenantTables] = await connection.query(
      "SELECT DISTINCT TABLE_NAME AS tableName FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'companyId' ORDER BY TABLE_NAME",
    );
    const counts = [];
    for (const { tableName } of tenantTables) {
      const safeTable = String(tableName).replaceAll("`", "``");
      const [rows] = await connection.query(`SELECT COUNT(*) AS rowCount FROM \`${safeTable}\` WHERE companyId = ?`, [companyId]);
      counts.push({ tableName, rowCount: Number(rows[0]?.rowCount ?? 0) });
    }

    const [auditRows] = await connection.query(
      "SELECT COUNT(*) AS rowCount FROM auditEvents WHERE organizationId = ?",
      [organizationId],
    );
    const [membershipRows] = await connection.query(
      "SELECT COUNT(*) AS rowCount FROM organizationMemberships WHERE organizationId = ?",
      [organizationId],
    );

    return {
      companyId,
      organizationId,
      company: companyRows[0] ?? null,
      fiscalExercises: exerciseRows,
      fiscalPeriods: periodRows,
      tenantCounts: counts,
      auditEvents: Number(auditRows[0]?.rowCount ?? 0),
      organizationMemberships: Number(membershipRows[0]?.rowCount ?? 0),
      readOnly: true,
    };
  } finally {
    await connection.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateRepairLubatec().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
