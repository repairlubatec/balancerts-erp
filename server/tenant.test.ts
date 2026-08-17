import { describe, expect, it } from "vitest";
import { assertTenantScope } from "./tenant";

describe("tenant scope", () => {
  it("accepts a fully authorized organization/company/period", () => {
    expect(assertTenantScope({ organizationId: 1, companyId: 2, periodId: 3 }, { organizationIds: [1], companyIds: [2], periodIds: [3] })).toBe(true);
  });

  it("rejects cross-tenant access at every hierarchy level", () => {
    expect(() => assertTenantScope({ organizationId: 9, companyId: 2 }, { organizationIds: [1], companyIds: [2] })).toThrow("ORGANIZATION_SCOPE_FORBIDDEN");
    expect(() => assertTenantScope({ organizationId: 1, companyId: 9 }, { organizationIds: [1], companyIds: [2] })).toThrow("COMPANY_SCOPE_FORBIDDEN");
    expect(() => assertTenantScope({ organizationId: 1, companyId: 2, periodId: 9 }, { organizationIds: [1], companyIds: [2], periodIds: [3] })).toThrow("PERIOD_SCOPE_FORBIDDEN");
  });
});
