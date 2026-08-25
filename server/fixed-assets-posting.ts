export function buildDepreciationPosting(input: { assetId: number; periodId: number; depreciationAmount: number; expenseAccountId: number; accumulatedDepreciationAccountId: number; correlationId: string }) {
  if (input.assetId <= 0 || input.periodId <= 0 || input.depreciationAmount <= 0 || !input.correlationId.trim()) throw new Error("INVALID_DEPRECIATION_POSTING");
  return { source: "FIXED_ASSET_DEPRECIATION", sourceId: String(input.assetId), periodId: input.periodId, correlationId: input.correlationId, lines: [{ accountId: input.expenseAccountId, debit: input.depreciationAmount, credit: 0 }, { accountId: input.accumulatedDepreciationAccountId, debit: 0, credit: input.depreciationAmount }] };
}

export function validateDepreciationPostingReferences(input: {
  assetFound: boolean;
  assetIsActive: boolean;
  assetIsInService: boolean;
  periodIsOpen: boolean;
  expenseAccountFound: boolean;
  accumulatedAccountFound: boolean;
  accountsAreDistinct: boolean;
  amountWithinRemaining: boolean;
}) {
  if (!input.assetFound) throw new Error("FIXED_ASSET_NOT_FOUND_OR_FORBIDDEN");
  if (!input.assetIsActive) throw new Error("FIXED_ASSET_NOT_ACTIVE");
  if (!input.assetIsInService) throw new Error("FIXED_ASSET_NOT_IN_SERVICE");
  if (!input.periodIsOpen) throw new Error("FIXED_ASSET_PERIOD_NOT_OPEN");
  if (!input.expenseAccountFound || !input.accumulatedAccountFound)
    throw new Error("FIXED_ASSET_DEPRECIATION_ACCOUNTS_NOT_FOUND_OR_FORBIDDEN");
  if (!input.accountsAreDistinct)
    throw new Error("FIXED_ASSET_DEPRECIATION_ACCOUNTS_MUST_DIFFER");
  if (!input.amountWithinRemaining)
    throw new Error("FIXED_ASSET_DEPRECIATION_EXCEEDS_REMAINING_VALUE");
  return true as const;
}

export function buildDepreciationAudit(input: { assetId: number; amount: number; entryId: number; organizationId: number; companyId: number; actorUserId: number; correlationId: string }) {
  return {
    organizationId: input.organizationId,
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: "FIXED_ASSET_DEPRECIATION_POST",
    entityType: "FIXED_ASSET",
    entityId: String(input.assetId),
    beforeState: JSON.stringify({ state: "CALCULATED", assetId: input.assetId, amount: input.amount }),
    afterState: JSON.stringify({ state: "POSTED", entryId: input.entryId, assetId: input.assetId, amount: input.amount }),
    correlationId: input.correlationId,
  };
}
