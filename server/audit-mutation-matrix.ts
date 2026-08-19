export const criticalMutationAuditMatrix = [
  { mutation: "companies.create", tables: ["companies"], action: "COMPANY_CREATED_PENDING", entityType: "company" },
  { mutation: "companies.activate", tables: ["companies"], action: "COMPANY_ACTIVATED", entityType: "company" },
  { mutation: "inventory.record", tables: ["stockMovements"], action: "STOCK_MOVEMENT_RECORDED", entityType: "stockMovement" },
  { mutation: "files.register", tables: ["fileAssets", "fileAssetVersions"], action: "FILE_ASSET_REGISTERED", entityType: "fileAsset" },
  { mutation: "files.updateMetadata", tables: ["fileAssets"], action: "FILE_ASSET_METADATA_UPDATED", entityType: "fileAsset" },
  { mutation: "files.newVersion", tables: ["fileAssets", "fileAssetVersions"], action: "FILE_ASSET_VERSION_CREATED", entityType: "fileAsset" },
  { mutation: "files.archive", tables: ["fileAssets"], action: "FILE_ASSET_ARCHIVED", entityType: "fileAsset" },
  { mutation: "purchases.create", tables: ["purchaseOrders", "purchaseOrderItems"], action: "PURCHASE_ORDER_CREATED", entityType: "purchaseOrder" },
  { mutation: "purchases.transition", tables: ["purchaseOrders"], action: "PURCHASE_ORDER_<TARGET_STATUS>", entityType: "purchaseOrder" },
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

export function getCriticalMutationForAuditAction(action: string, entityType: string) {
  return criticalMutationAuditMatrix.find((item) => (item.action === action || (item.action === "DOCUMENT_<TARGET_STATUS>" && /^DOCUMENT_[A-Z_]+$/.test(action) || item.action === "PURCHASE_ORDER_<TARGET_STATUS>" && /^PURCHASE_ORDER_[A-Z_]+$/.test(action))) && item.entityType === entityType)?.mutation ?? null;
}

export function validateCriticalMutationAuditEvent(input: { mutation: string; action: string; entityType: string; beforeState: string | null; afterState: string | null }) {
  const contract = getCriticalMutationAuditContract(input.mutation);
  if (!contract) return { valid: false as const, reason: "UNKNOWN_MUTATION" };
  const actionMatches = contract.action === "DOCUMENT_<TARGET_STATUS>" ? /^DOCUMENT_[A-Z_]+$/.test(input.action) : contract.action === "PURCHASE_ORDER_<TARGET_STATUS>" ? /^PURCHASE_ORDER_[A-Z_]+$/.test(input.action) : input.action === contract.action;
  const valid = actionMatches && input.entityType === contract.entityType && input.beforeState !== undefined && input.afterState !== undefined;
  return { valid, reason: valid ? null : "AUDIT_CONTRACT_MISMATCH" };
}
