import { createHash } from "node:crypto";
import { parseMysqlUrl } from "./backup-database.mjs";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";

export function assertSafeRestoreTarget(env = process.env) {
  const target = String(env.RESTORE_TARGET ?? "").toLowerCase();
  const approved = env.RESTORE_APPROVED === "true";
  if (!target || target === "production" || target === "prod") throw new Error("RESTORE_TARGET_MUST_BE_ISOLATED");
  if (!approved) throw new Error("RESTORE_APPROVAL_REQUIRED");
  if (!env.RESTORE_DATABASE_URL) throw new Error("RESTORE_DATABASE_URL_REQUIRED");
  return { target, approved };
}

export async function verifySha256Manifest(backupPath, manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const hash = createHash("sha256");
  const { createReadStream } = await import("node:fs");
  await new Promise((resolvePromise, reject) => {
    const stream = createReadStream(backupPath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolvePromise);
  });
  const actual = hash.digest("hex");
  if (manifest.sha256 !== actual) throw new Error("BACKUP_HASH_MISMATCH");
  return { expected: manifest.sha256, actual, valid: true };
}

export function runMysqlRestore({ databaseUrl, backupPath }) {
  const connection = parseMysqlUrl(databaseUrl);
  return new Promise((resolvePromise, reject) => {
    const gunzip = spawn("gzip", ["-dc", backupPath], { stdio: ["ignore", "pipe", "pipe"] });
    const mysql = spawn("mysql", [`--host=${connection.host}`, `--port=${connection.port}`, `--user=${connection.user}`, "--protocol=TCP", connection.database], { env: { ...process.env, MYSQL_PWD: connection.password }, stdio: ["pipe", "ignore", "pipe"] });
    gunzip.stdout.pipe(mysql.stdin);
    let stderr = "";
    gunzip.stderr.on("data", chunk => { stderr += chunk.toString(); });
    mysql.stderr.on("data", chunk => { stderr += chunk.toString(); });
    let gunzipCode;
    let mysqlCode;
    const finish = () => {
      if (gunzipCode === undefined || mysqlCode === undefined) return;
      if (gunzipCode !== 0 || mysqlCode !== 0) reject(new Error(`RESTORE_FAILED:${stderr.trim() || "unknown"}`));
      else resolvePromise();
    };
    gunzip.on("error", reject);
    mysql.on("error", reject);
    gunzip.on("close", code => { gunzipCode = code; finish(); });
    mysql.on("close", code => { mysqlCode = code; finish(); });
  });
}

export async function verifyRestore({ backupPath, manifestPath, env = process.env } = {}) {
  assertSafeRestoreTarget(env);
  const backupStat = await stat(backupPath);
  if (!backupStat.size) throw new Error("BACKUP_EMPTY");
  const integrity = await verifySha256Manifest(backupPath, manifestPath);
  await runMysqlRestore({ databaseUrl: env.RESTORE_DATABASE_URL, backupPath });
  return { ...integrity, target: env.RESTORE_TARGET, restored: true };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [backupPath, manifestPath] = process.argv.slice(2);
  if (!backupPath || !manifestPath) { console.error("Uso: node scripts/restore-database-verify.mjs <backup.sql.gz> <backup.sql.gz.sha256.json>"); process.exitCode = 1; }
  else verifyRestore({ backupPath, manifestPath }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
