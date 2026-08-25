import { createHash } from "node:crypto";
import { parseMysqlUrl } from "./backup-database.mjs";
import { readFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";

export const POST_RESTORE_STATES = [
  "HASH_VALIDATED",
  "RESTORED",
  "SCHEMA_VALIDATED",
  "DATA_VALIDATED",
  "MODULES_VALIDATED",
  "ROLLBACK_READY",
];

function databaseIdentity(databaseUrl) {
  const connection = parseMysqlUrl(databaseUrl);
  return {
    host: connection.host.toLowerCase(),
    port: String(connection.port || "3306"),
    database: connection.database,
    user: connection.user,
  };
}

function sameDatabase(left, right) {
  return left.host === right.host && left.port === right.port && left.database === right.database;
}

export function assertSafeRestoreTarget(env = process.env) {
  const target = String(env.RESTORE_TARGET ?? "").trim().toLowerCase();
  const approved = env.RESTORE_APPROVED === "true";
  if (!target || target === "production" || target === "prod") throw new Error("RESTORE_TARGET_MUST_BE_ISOLATED");
  if (!approved) throw new Error("RESTORE_APPROVAL_REQUIRED");
  if (!env.RESTORE_DATABASE_URL) throw new Error("RESTORE_DATABASE_URL_REQUIRED");
  const restore = databaseIdentity(env.RESTORE_DATABASE_URL);
  if (!restore.user || restore.user.toLowerCase() === "root") throw new Error("RESTORE_USER_MUST_BE_RESTRICTED");
  if (env.DATABASE_URL && sameDatabase(restore, databaseIdentity(env.DATABASE_URL))) throw new Error("RESTORE_TARGET_MATCHES_PRODUCTION");
  if (env.RESTORE_PRODUCTION_FINGERPRINT && env.RESTORE_DATABASE_FINGERPRINT && env.RESTORE_PRODUCTION_FINGERPRINT === env.RESTORE_DATABASE_FINGERPRINT) throw new Error("RESTORE_FINGERPRINT_MATCHES_PRODUCTION");
  if (env.RESTORE_DATABASE_FINGERPRINT && env.RESTORE_DATABASE_FINGERPRINT !== `${restore.host}:${restore.port}/${restore.database}`) throw new Error("RESTORE_FINGERPRINT_MISMATCH");
  if (env.RESTORE_ISOLATION_ATTESTATION !== "ISOLATED") throw new Error("RESTORE_ISOLATION_ATTESTATION_REQUIRED");
  const allowedHosts = String(env.RESTORE_ALLOWED_HOSTS ?? "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!allowedHosts.includes(restore.host)) throw new Error("RESTORE_HOST_NOT_ALLOWLISTED");
  return { target, approved, identity: restore, isolationAttested: true };
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

export function assertPostRestoreValidation(result) {
  const states = Array.isArray(result?.states) ? result.states : [];
  const missingStates = POST_RESTORE_STATES.filter(state => !states.includes(state));
  if (missingStates.length) throw new Error(`POST_RESTORE_VALIDATION_INCOMPLETE:${missingStates.join(",")}`);
  if (result.schema?.compatible !== true) throw new Error("POST_RESTORE_SCHEMA_INVALID");
  if (result.data?.consistent !== true) throw new Error("POST_RESTORE_DATA_INVALID");
  if (result.isolation?.tenantSafe !== true) throw new Error("POST_RESTORE_ISOLATION_INVALID");
  if (result.modules?.allValidated !== true) throw new Error("POST_RESTORE_MODULES_INVALID");
  if (result.rollback?.ready !== true) throw new Error("POST_RESTORE_ROLLBACK_NOT_READY");
  return { valid: true, states: [...POST_RESTORE_STATES] };
}

export function runMysqlRestore({ databaseUrl, backupPath }) {
  const connection = parseMysqlUrl(databaseUrl);
  return new Promise((resolvePromise, reject) => {
    const gunzip = spawn("gzip", ["-dc", backupPath], { stdio: ["ignore", "pipe", "pipe"] });
    const filter = spawn("sed", ["-e", "/^LOCK TABLES /d", "-e", "/^UNLOCK TABLES;/d"], { stdio: ["pipe", "pipe", "pipe"] });
    const mysql = spawn("mysql", [`--host=${connection.host}`, `--port=${connection.port}`, `--user=${connection.user}`, "--protocol=TCP", "--ssl-mode=REQUIRED", connection.database], { env: { ...process.env, MYSQL_PWD: connection.password }, stdio: ["pipe", "ignore", "pipe"] });
    gunzip.stdout.pipe(filter.stdin);
    filter.stdout.pipe(mysql.stdin);
    let stderr = "";
    const handleStreamError = error => {
      if (error?.code !== "EPIPE") stderr += `STREAM_ERROR:${error?.message ?? String(error)}`;
    };
    gunzip.stdout.on("error", handleStreamError);
    filter.stdin.on("error", handleStreamError);
    filter.stdout.on("error", handleStreamError);
    mysql.stdin.on("error", handleStreamError);
    gunzip.stderr.on("data", chunk => { stderr += chunk.toString(); });
    filter.stderr.on("data", chunk => { stderr += chunk.toString(); });
    mysql.stderr.on("data", chunk => { stderr += chunk.toString(); });
    let gunzipCode;
    let filterCode;
    let mysqlCode;
    const finish = () => {
      if (gunzipCode === undefined || filterCode === undefined || mysqlCode === undefined) return;
      if (gunzipCode !== 0 || filterCode !== 0 || mysqlCode !== 0) reject(new Error(`RESTORE_FAILED:${stderr.trim() || "unknown"}`));
      else resolvePromise();
    };
    gunzip.on("error", reject);
    filter.on("error", reject);
    mysql.on("error", reject);
    gunzip.on("close", code => { gunzipCode = code; finish(); });
    filter.on("close", code => { filterCode = code; finish(); });
    mysql.on("close", code => { mysqlCode = code; finish(); });
  });
}

export async function verifyRestore({ backupPath, manifestPath, env = process.env, postRestoreValidator } = {}) {
  const target = assertSafeRestoreTarget(env);
  const backupStat = await stat(backupPath);
  if (!backupStat.size) throw new Error("BACKUP_EMPTY");
  const integrity = await verifySha256Manifest(backupPath, manifestPath);
  await runMysqlRestore({ databaseUrl: env.RESTORE_DATABASE_URL, backupPath });
  if (typeof postRestoreValidator !== "function") throw new Error("POST_RESTORE_VALIDATION_REQUIRED");
  const validation = assertPostRestoreValidation(await postRestoreValidator({ target: target.identity }));
  return { ...integrity, target: env.RESTORE_TARGET, restored: true, validation };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [backupPath, manifestPath] = process.argv.slice(2);
  if (!backupPath || !manifestPath) { console.error("Uso: node scripts/restore-database-verify.mjs <backup.sql.gz> <backup.sql.gz.sha256.json>"); process.exitCode = 1; }
  else verifyRestore({ backupPath, manifestPath }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
