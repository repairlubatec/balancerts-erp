export const criticalMutationAuditMatrix = [
  { mutation: "companies.create", tables: ["companies"], action: "COMPANY_CREATED_PENDING", entityType: "company" },
  { mutation: "companies.activate", tables: ["companies"], action: "COMPANY_ACTIVATED", entityType: "company" },
  { mutation: "inventory.record", tables: ["stockMovements"], action: "STOCK_MOVEMENT_RECORDED", entityType: "stockMovement" },
  { mutation: "files.register", tables: ["fileAssets"], action: "FILE_ASSET_REGISTERED", entityType: "fileAsset" },
  { mutation: "documents.reserveNumber", tables: ["documentSeries"], action: "DOCUMENT_NUMBER_RESERVED", entityType: "documentSeries" },
  { mutation: "documents.transition", tables: ["businessDocuments"], action: "DOCUMENT_<TARGET_STATUS>", entityType: "businessDocument" },
  { mutation: "accounting.post", tables: ["journalEntries", "journalLines"], action: "JOURNAL_ENTRY_POSTED", entityType: "journalEntry" },
  { mutation: "reversal.post", tables: ["journalEntries", "journalLines"], action: "JOURNAL_ENTRY_REVERSED", entityType: "journalEntry" },
  { mutation: "fixedAssets.postDepreciation", tables: ["journalEntries", "journalLines"], action: "FIXED_ASSET_DEPRECIATION_POST", entityType: "FIXED_ASSET" },
  { mutation: "closing.validateReopen", tables: ["fiscalPeriods"], action: "PERIOD_REOPEN", entityType: "FISCAL_PERIOD" },
] as const;

export function getCriticalMutationAuditContract(mutation: string) {
  return criticalMutationAuditMatrix.find((item) => item.mutation === mutation) ?? null;
}
