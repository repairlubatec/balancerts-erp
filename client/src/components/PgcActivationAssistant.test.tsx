import { describe, expect, it } from "vitest";
import { canActivatePgcVersion, canImportPgcAccount } from "./PgcActivationAssistant";

describe("PgcActivationAssistant guards", () => {
  it("only allows activation when readiness has no blockers", () => {
    expect(canActivatePgcVersion({ ready: true, blockers: [] })).toBe(true);
    expect(canActivatePgcVersion({ ready: true, blockers: ["PGC_VERSION_WITHOUT_ACCOUNTING_RULES"] })).toBe(false);
    expect(canActivatePgcVersion({ ready: false, blockers: [] })).toBe(false);
  });

  it("only allows importing a confirmed account with complete primary evidence", () => {
    const eligible = { validationStatus: "CONFIRMED", hasPrimarySource: true, hasParent: true, isReserved: false, isDuplicate: false };
    expect(canImportPgcAccount(eligible)).toBe(true);
    expect(canImportPgcAccount({ ...eligible, isReserved: true })).toBe(false);
    expect(canImportPgcAccount({ ...eligible, isDuplicate: true })).toBe(false);
    expect(canImportPgcAccount({ ...eligible, hasParent: false })).toBe(false);
    expect(canImportPgcAccount({ ...eligible, validationStatus: "PENDING" })).toBe(false);
  });
});
