export const pendingMutationPolicy = [
  { mutation: "companies.create", allowsPending: true, guard: "organization-owner" },
  { mutation: "companies.activate", allowsPending: true, guard: "configuration-completeness" },
  { mutation: "inventory.record", allowsPending: false, guard: "assertCompanyReady" },
  { mutation: "files.register", allowsPending: false, guard: "assertCompanyReady" },
  { mutation: "files.updateMetadata", allowsPending: false, guard: "owner+assertCompanyReady" },
  { mutation: "files.newVersion", allowsPending: false, guard: "owner+assertCompanyReady" },
  { mutation: "files.archive", allowsPending: false, guard: "owner+assertCompanyReady" },
  { mutation: "documents.reserveNumber", allowsPending: false, guard: "assertCompanyReady" },
  { mutation: "documents.transition", allowsPending: false, guard: "assertCompanyReady" },
  { mutation: "accounting.post", allowsPending: false, guard: "configurationStatus+period" },
  { mutation: "reversal.post", allowsPending: false, guard: "configurationStatus+period" },
  { mutation: "fixedAssets.postDepreciation", allowsPending: false, guard: "auditScope+posting" },
  { mutation: "closing.validateReopen", allowsPending: false, guard: "auditScope+closedPeriod" },
] as const;

export function getPendingMutationPolicy(mutation: string) {
  return pendingMutationPolicy.find((item) => item.mutation === mutation) ?? null;
}
