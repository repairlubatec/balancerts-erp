import mysql from "mysql2/promise";
import { parseMysqlUrl } from "./backup-database.mjs";

const source = process.env.RESTORE_DATABASE_URL;
if (!source) throw new Error("RESTORE_DATABASE_URL_REQUIRED");
const parsed = parseMysqlUrl(source);
const connection = await mysql.createConnection({
  host: parsed.host,
  port: Number(parsed.port),
  user: parsed.user,
  password: parsed.password,
  connectTimeout: 15_000,
  ssl: { rejectUnauthorized: true },
});
try {
  await connection.query("CREATE DATABASE IF NOT EXISTS `balancerts_restore`");
  process.stdout.write(JSON.stringify({ prepared: true, host: parsed.host, port: parsed.port, database: "balancerts_restore", sensitiveValuesOmitted: true }) + "\n");
} finally {
  await connection.end();
}
