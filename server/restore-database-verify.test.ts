import { describe, expect, it } from "vitest";
import { assertPostRestoreValidation, assertSafeRestoreTarget, POST_RESTORE_STATES } from "../scripts/restore-database-verify.mjs";

const baseEnv = {
  RESTORE_TARGET: "isolated-test",
  RESTORE_APPROVED: "true",
  RESTORE_DATABASE_URL: "mysql://restore_user:secret@restore-db.internal:4000/balancerts_restore_test",
  DATABASE_URL: "mysql://app_user:secret@production-db.internal:4000/balancerts",
  RESTORE_ISOLATION_ATTESTATION: "ISOLATED",
  RESTORE_ALLOWED_HOSTS: "restore-db.internal",
  RESTORE_DATABASE_FINGERPRINT: "restore-db.internal:4000/balancerts_restore_test",
  RESTORE_PRODUCTION_FINGERPRINT: "production-db.internal:4000/balancerts",
};

describe("D4 — segurança e validação de destino de restauro", () => {
  it("aceita apenas um destino explicitamente isolado e allowlisted", () => {
    expect(assertSafeRestoreTarget(baseEnv)).toMatchObject({ target: "isolated-test", isolationAttested: true, identity: { host: "restore-db.internal", database: "balancerts_restore_test" } });
  });

  it("rejeita URL de restauro igual à produção mesmo com nome de destino de teste", () => {
    expect(() => assertSafeRestoreTarget({ ...baseEnv, RESTORE_DATABASE_URL: baseEnv.DATABASE_URL })).toThrow("RESTORE_TARGET_MATCHES_PRODUCTION");
  });

  it("rejeita root, host não allowlisted e ausência de atestação", () => {
    expect(() => assertSafeRestoreTarget({ ...baseEnv, RESTORE_DATABASE_URL: "mysql://root:secret@restore-db.internal:4000/balancerts_restore_test" })).toThrow("RESTORE_USER_MUST_BE_RESTRICTED");
    expect(() => assertSafeRestoreTarget({ ...baseEnv, RESTORE_ALLOWED_HOSTS: "outro-host.internal" })).toThrow("RESTORE_HOST_NOT_ALLOWLISTED");
    expect(() => assertSafeRestoreTarget({ ...baseEnv, RESTORE_ISOLATION_ATTESTATION: "" })).toThrow("RESTORE_ISOLATION_ATTESTATION_REQUIRED");
  });

  it("rejeita fingerprint coincidente ou divergente", () => {
    expect(() => assertSafeRestoreTarget({ ...baseEnv, RESTORE_DATABASE_FINGERPRINT: baseEnv.RESTORE_PRODUCTION_FINGERPRINT })).toThrow("RESTORE_FINGERPRINT_MATCHES_PRODUCTION");
    expect(() => assertSafeRestoreTarget({ ...baseEnv, RESTORE_DATABASE_FINGERPRINT: "restore-db.internal:3306/balancerts_restore_test" })).toThrow("RESTORE_FINGERPRINT_MISMATCH");
  });
});

describe("D4 — estados de validação pós-restauro", () => {
  const valid = {
    states: POST_RESTORE_STATES,
    schema: { compatible: true },
    data: { consistent: true },
    isolation: { tenantSafe: true },
    modules: { allValidated: true },
    rollback: { ready: true },
  };

  it("exige todos os estados e verificações", () => {
    expect(assertPostRestoreValidation(valid)).toEqual({ valid: true, states: POST_RESTORE_STATES });
  });

  it("não aceita sucesso parcial como restauro validado", () => {
    expect(() => assertPostRestoreValidation({ ...valid, states: ["HASH_VALIDATED", "RESTORED"] })).toThrow("POST_RESTORE_VALIDATION_INCOMPLETE");
    expect(() => assertPostRestoreValidation({ ...valid, modules: { allValidated: false } })).toThrow("POST_RESTORE_MODULES_INVALID");
    expect(() => assertPostRestoreValidation({ ...valid, isolation: { tenantSafe: false } })).toThrow("POST_RESTORE_ISOLATION_INVALID");
  });
});
