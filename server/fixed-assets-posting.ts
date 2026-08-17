export function buildDepreciationPosting(input: { assetId: number; periodId: number; depreciationAmount: number; expenseAccountId: number; accumulatedDepreciationAccountId: number; correlationId: string }) {
  if (input.assetId <= 0 || input.periodId <= 0 || input.depreciationAmount <= 0 || !input.correlationId.trim()) throw new Error("INVALID_DEPRECIATION_POSTING");
  return { source: "FIXED_ASSET_DEPRECIATION", sourceId: String(input.assetId), periodId: input.periodId, correlationId: input.correlationId, lines: [{ accountId: input.expenseAccountId, debit: input.depreciationAmount, credit: 0 }, { accountId: input.accumulatedDepreciationAccountId, debit: 0, credit: input.depreciationAmount }] };
}
