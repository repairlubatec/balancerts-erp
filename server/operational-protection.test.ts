import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafeRestoreTarget } from "../scripts/restore-database-verify.mjs";
import { buildBackupPath, parseMysqlUrl, requireDatabaseUrl } from "../scripts/backup-database.mjs";

const originalEnv = { ...process.env };

afterEach(() => {
  vi.unstubAllEnvs();
  process.env = { ...originalEnv };
});

describe("protecção operacional de backup e restauro", () => {
  it("exige DATABASE_URL para criar backup", () => {
    expect(() => requireDatabaseUrl({})).toThrow("DATABASE_URL_REQUIRED");
    expect(requireDatabaseUrl({ DATABASE_URL: "mysql://isolated" })).toBe("mysql://isolated");
  });

  it("interpreta DATABASE_URL sem incluir a palavra-passe nos argumentos", () => {
    expect(parseMysqlUrl("mysql://user:secret%40pass@db.example:3307/balancerts")).toEqual({ host: "db.example", port: "3307", user: "user", password: "secret@pass", database: "balancerts" });
    expect(() => parseMysqlUrl("postgres://user:secret@db.example/balancerts")).toThrow("DATABASE_URL_MUST_USE_MYSQL");
  });

  it("gera um nome de backup determinístico e fora do código da aplicação", () => {
    const path = buildBackupPath({ directory: "/var/backups/balancerts", timestamp: new Date("2026-08-20T10:20:30.000Z") });
    expect(path).toContain("balancerts-20260820T102030Z.sql.gz");
  });

  it("bloqueia produção e exige aprovação explícita para restauro", () => {
    expect(() => assertSafeRestoreTarget({ RESTORE_TARGET: "production", RESTORE_APPROVED: "true", RESTORE_DATABASE_URL: "mysql://prod" })).toThrow("RESTORE_TARGET_MUST_BE_ISOLATED");
    expect(() => assertSafeRestoreTarget({ RESTORE_TARGET: "staging", RESTORE_APPROVED: "false", RESTORE_DATABASE_URL: "mysql://staging" })).toThrow("RESTORE_APPROVAL_REQUIRED");
    expect(() => assertSafeRestoreTarget({ RESTORE_TARGET: "isolated-verification", RESTORE_APPROVED: "true", RESTORE_DATABASE_URL: "mysql://isolated" })).toThrow("DATABASE_URL_INCOMPLETE");
  });
});

import { buildOrphanQuery, integrityChecks } from "../scripts/audit-referential-integrity.mjs";

describe("auditoria de integridade referencial", () => {
  it("mantém um conjunto explícito de relações críticas", () => {
    expect(integrityChecks.length).toBeGreaterThan(10);
    expect(integrityChecks.some(([label]) => label === "businessDocuments.companyId")).toBe(true);
  });

  it("gera consultas somente de leitura para detectar órfãos", () => {
    const query = buildOrphanQuery(["businessDocuments.companyId", "businessDocuments", "companyId", "companies", "id"]);
    expect(query.sql).toContain("SELECT COUNT(*)");
    expect(query.sql).toContain("LEFT JOIN");
    expect(query.sql).not.toMatch(/\\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE)\\b/i);
  });
});
