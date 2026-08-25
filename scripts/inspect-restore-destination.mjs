import mysql from "mysql2/promise";

const url = process.env.RESTORE_DATABASE_URL;
if (!url) throw new Error("RESTORE_DATABASE_URL_REQUIRED");

const connection = await mysql.createConnection({
  uri: url,
  connectTimeout: 15_000,
  ssl: { rejectUnauthorized: true },
});

try {
  const [identityRows] = await connection.query(
    "SELECT DATABASE() AS database_name, CURRENT_USER() AS authenticated_user, @@version AS server_version",
  );
  const [tableRows] = await connection.query(
    "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema = DATABASE()",
  );
  const [engineRows] = await connection.query(
    "SELECT COUNT(*) AS innodb_table_count FROM information_schema.tables WHERE table_schema = DATABASE() AND engine = 'InnoDB'",
  );
  const [relationRows] = await connection.query(
    "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name",
  );

  const identity = identityRows[0] ?? {};
  const tables = tableRows[0] ?? {};
  const engines = engineRows[0] ?? {};
  process.stdout.write(
    JSON.stringify({
      readOnly: true,
      database: identity.database_name,
      serverVersion: identity.server_version,
      authenticatedUser: identity.authenticated_user,
      tableCount: Number(tables.table_count ?? 0),
      innodbTableCount: Number(engines.innodb_table_count ?? 0),
      relations: relationRows.map((row) => ({ name: row.table_name, type: row.table_type })),
    }) + "\n",
  );
} finally {
  await connection.end();
}
