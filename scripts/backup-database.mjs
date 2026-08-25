import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

export function requireDatabaseUrl(env = process.env) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");
  return env.DATABASE_URL;
}

export function parseMysqlUrl(databaseUrl) {
  const parsed = new URL(databaseUrl);
  if (!parsed.protocol.startsWith("mysql")) throw new Error("DATABASE_URL_MUST_USE_MYSQL");
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!parsed.hostname || !database) throw new Error("DATABASE_URL_INCOMPLETE");
  return { host: parsed.hostname, port: parsed.port || "3306", user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password), database };
}

export function buildBackupPath({ directory = "./backups", timestamp = new Date() } = {}) {
  const stamp = timestamp.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return resolve(directory, `balancerts-${stamp}.sql.gz`);
}

export async function sha256File(path) {
  const hash = createHash("sha256");
  await new Promise((resolvePromise, reject) => {
    const stream = createReadStream(path);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolvePromise);
  });
  return hash.digest("hex");
}

export async function writeSha256Manifest(backupPath, hash, metadata = {}) {
  const manifestPath = `${backupPath}.sha256.json`;
  const content = JSON.stringify({ file: backupPath, sha256: hash, createdAt: new Date().toISOString(), schemaVersion: metadata.schemaVersion ?? "unknown", environment: metadata.environment ?? "unknown" }, null, 2) + "\n";
  await mkdir(dirname(manifestPath), { recursive: true });
  await import("node:fs/promises").then(fs => fs.writeFile(manifestPath, content, "utf8"));
  return manifestPath;
}

export function runMysqldump({ databaseUrl, outputPath, consistentSnapshot = true }) {
  const connection = parseMysqlUrl(databaseUrl);
  const consistencyArgs = consistentSnapshot ? ["--single-transaction"] : ["--skip-lock-tables"];
  return new Promise((resolvePromise, reject) => {
    const child = spawn("mysqldump", [`--host=${connection.host}`, `--port=${connection.port}`, `--user=${connection.user}`, "--protocol=TCP", "--ssl-mode=REQUIRED", ...consistencyArgs, "--routines", "--triggers", "--hex-blob", "--set-gtid-purged=OFF", connection.database], { env: { ...process.env, MYSQL_PWD: connection.password }, stdio: ["ignore", "pipe", "pipe"] });
    const output = createWriteStream(outputPath);
    const gzip = spawn("gzip", [], { stdio: ["pipe", "pipe", "pipe"] });
    child.stdout.pipe(gzip.stdin);
    gzip.stdout.pipe(output);
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    gzip.stderr.on("data", chunk => { stderr += chunk.toString(); });
    let childCode;
    let gzipCode;
    const finish = () => {
      if (childCode === undefined || gzipCode === undefined) return;
      if (childCode !== 0 || gzipCode !== 0) reject(new Error(`BACKUP_FAILED:${stderr.trim() || "unknown"}`));
      else resolvePromise();
    };
    child.on("error", reject);
    gzip.on("error", reject);
    child.on("close", code => { childCode = code; finish(); });
    gzip.on("close", code => { gzipCode = code; finish(); });
  });
}

export async function createBackup({ directory = process.env.BACKUP_DIR ?? "./backups", env = process.env } = {}) {
  const databaseUrl = requireDatabaseUrl(env);
  const outputPath = buildBackupPath({ directory });
  const consistentSnapshot = env.BACKUP_SINGLE_TRANSACTION !== "false";
  await mkdir(dirname(outputPath), { recursive: true });
  await runMysqldump({ databaseUrl, outputPath, consistentSnapshot });
  const fileStat = await stat(outputPath);
  if (!fileStat.size) throw new Error("BACKUP_EMPTY");
  const hash = await sha256File(outputPath);
  const manifestPath = await writeSha256Manifest(outputPath, hash, { schemaVersion: env.SCHEMA_VERSION, environment: env.NODE_ENV, consistency: consistentSnapshot ? "single-transaction" : "skip-lock-tables-explicit" });
  return { outputPath, manifestPath, sha256: hash, size: fileStat.size };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
