export type TenantScope = { organizationId: number; companyId: number; periodId?: number };

export function assertTenantScope(scope: TenantScope, allowed: { organizationIds: number[]; companyIds: number[]; periodIds?: number[] }) {
  if (!allowed.organizationIds.includes(scope.organizationId)) throw new Error("ORGANIZATION_SCOPE_FORBIDDEN");
  if (!allowed.companyIds.includes(scope.companyId)) throw new Error("COMPANY_SCOPE_FORBIDDEN");
  if (scope.periodId !== undefined && !(allowed.periodIds ?? []).includes(scope.periodId)) throw new Error("PERIOD_SCOPE_FORBIDDEN");
  return true;
}
