import fs from "node:fs";
import crypto from "node:crypto";
import mysql from "mysql2/promise";

const ROOT = process.cwd();
const packagePath = "/tmp/pgc-angola-main/pgc_chart_of_accounts.json";
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL em falta");
if (!fs.existsSync(packagePath)) throw new Error(`Pacote PGCA não encontrado: ${packagePath}`);
const raw = fs.readFileSync(packagePath);
const plan = JSON.parse(raw.toString("utf8"));
const sourceHash = crypto.createHash("sha256").update(raw).digest("hex");
const confirmed = JSON.parse(fs.readFileSync(`${ROOT}/docs/normative-sources/pgca-visually-confirmed-accounts.json`, "utf8"));
const confirmedCodes = new Set(confirmed.accounts.map((a) => a.code));

function flatten(nodes, parentCode = null, classCode = null, level = 1, out = []) {
  for (const node of nodes ?? []) {
    const code = String(node.code).trim();
    const children = node.children ?? node.accounts ?? [];
    out.push({ code, name: String(node.name).trim(), description: node.description ? String(node.description).trim() : null, parentCode, classCode: classCode ?? code.split(/[.]/)[0], level, hasChildren: children.length > 0 });
    flatten(children, code, classCode ?? code.split(/[.]/)[0], level + 1, out);
  }
  return out;
}
const rows = flatten(plan.classes);
if (rows.length !== 776) throw new Error(`Contagem PGCA inesperada: ${rows.length}; esperado 776`);
const connection = await mysql.createConnection(dbUrl);
try {
  await connection.beginTransaction();
  const [versions] = await connection.query("SELECT id, organizationId, status FROM pgcVersions WHERE code = 'PGCA-82-01' ORDER BY id LIMIT 1");
  if (!versions[0]) throw new Error("PGCA-82-01 não encontrado");
  const version = versions[0];
  const [sources] = await connection.query("SELECT id FROM pgcSources WHERE versionId = ? AND instrumentNumber = '82/01' LIMIT 1", [version.id]);
  if (!sources[0]) throw new Error("Fonte Decreto 82/01 não encontrada");
  const sourceId = sources[0].id;
  const [existing] = await connection.query("SELECT id, code, validationStatus FROM pgcAccounts WHERE versionId = ?", [version.id]);
  const existingByCode = new Map(existing.map((a) => [a.code, a]));
  const inserted = [];
  const preserved = [];
  for (const row of rows) {
    const current = existingByCode.get(row.code);
    if (current) { preserved.push(row.code); continue; }
    const parent = row.parentCode ? existingByCode.get(row.parentCode) : null;
    const level = row.level;
    const accountType = level === 1 ? "CLASS" : "GROUP";
    const result = await connection.query(`INSERT INTO pgcAccounts (organizationId, versionId, sourceId, code, name, description, classCode, parentId, parentCode, level, accountType, nature, balanceType, acceptsEntries, acceptsChildren, active, fiscal, iva, balanceSheet, incomeStatement, validFrom, validTo, validationStatus, notes, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NOT_APPLICABLE', 'NOT_APPLICABLE', 0, ?, 0, 0, 0, 0, 0, '2001-11-16 00:00:00', NULL, 'NEEDS_NORMATIVE_VALIDATION', ?, 1)`, [version.organizationId, version.id, sourceId, row.code, row.name, row.description, row.classCode, parent?.id ?? null, row.parentCode, level, accountType, row.hasChildren ? 1 : 0, `Importação estrutural PGCA-82-01; hash=${sourceHash}; natureza e regra de movimentação pendentes de confirmação primária.`]);
    inserted.push({ code: row.code, id: Number(result[0].insertId) });
    existingByCode.set(row.code, { id: Number(result[0].insertId), code: row.code, validationStatus: "NEEDS_NORMATIVE_VALIDATION" });
  }
  await connection.commit();
  const result = { versionId: version.id, organizationId: version.organizationId, versionStatus: version.status, sourceId, packageHash: sourceHash, packageCount: rows.length, insertedCount: inserted.length, preservedCount: preserved.length, confirmedBeforeImport: confirmedCodes.size, validationStatus: "NEEDS_NORMATIVE_VALIDATION", activationChanged: false };
  fs.writeFileSync(`${ROOT}/docs/pgca-global-staging-import-2026-08-26.json`, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
