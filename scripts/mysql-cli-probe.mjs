import { spawn } from "node:child_process";
import { parseMysqlUrl } from "./backup-database.mjs";

const url = process.env.RESTORE_DATABASE_URL;
if (!url) throw new Error("RESTORE_DATABASE_URL_REQUIRED");
const connection = parseMysqlUrl(url);
const child = spawn("mysql", [
  `--host=${connection.host}`,
  `--port=${connection.port}`,
  `--user=${connection.user}`,
  "--protocol=TCP",
  "--ssl-mode=REQUIRED",
  "--connect-timeout=15",
  connection.database,
  "--execute=SELECT 1 AS cli_probe",
], { env: { ...process.env, MYSQL_PWD: connection.password }, stdio: ["ignore", "pipe", "pipe"] });

let stdout = "";
let stderr = "";
child.stdout.on("data", chunk => { stdout += chunk.toString(); });
child.stderr.on("data", chunk => { stderr += chunk.toString(); });
const timeout = setTimeout(() => child.kill("SIGTERM"), 20_000);
child.on("error", error => { clearTimeout(timeout); throw error; });
child.on("close", code => {
  clearTimeout(timeout);
  if (code !== 0) {
    console.error(`CLI_PROBE_FAILED:${stderr.trim() || `exit_${code}`}`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(JSON.stringify({ cli: true, output: stdout.trim(), sensitiveValuesOmitted: true }) + "\n");
});
