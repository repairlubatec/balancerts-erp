export function trialBalanceRowKey(row: { accountCode: string; accountName: string }, index: number): string {
  return `${row.accountCode}-${row.accountName}-${index}`;
}
