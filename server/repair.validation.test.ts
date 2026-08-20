import { describe, expect, it } from "vitest";
import { buildValidationConfig } from "../scripts/validate-repair-lubatec.mjs";

describe("validador read-only da Repair Lubatec", () => {
  it("usa a empresa e organização reais por defeito quando a ligação existe", () => {
    expect(buildValidationConfig({ DATABASE_URL: "mysql://redacted" })).toEqual({
      companyId: 1,
      organizationId: 1,
      databaseUrl: "mysql://redacted",
    });
  });

  it("aceita IDs explicitamente configurados", () => {
    expect(buildValidationConfig({
      DATABASE_URL: "mysql://redacted",
      REPAIR_LUBATEC_COMPANY_ID: "7",
      REPAIR_LUBATEC_ORGANIZATION_ID: "8",
    })).toEqual({
      companyId: 7,
      organizationId: 8,
      databaseUrl: "mysql://redacted",
    });
  });

  it("bloqueia ausência de DATABASE_URL", () => {
    expect(() => buildValidationConfig({})).toThrow("DATABASE_URL_REQUIRED");
  });

  it("bloqueia IDs não positivos", () => {
    expect(() => buildValidationConfig({ DATABASE_URL: "mysql://redacted", REPAIR_LUBATEC_COMPANY_ID: "0" })).toThrow("INVALID_COMPANY_ID");
    expect(() => buildValidationConfig({ DATABASE_URL: "mysql://redacted", REPAIR_LUBATEC_ORGANIZATION_ID: "-1" })).toThrow("INVALID_ORGANIZATION_ID");
  });
});
