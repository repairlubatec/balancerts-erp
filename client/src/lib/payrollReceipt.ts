export type ReceiptPeriod = { year: number; month: number };

export function formatInternalReceiptPeriod(run?: ReceiptPeriod | null) {
  if (!run) return "—";
  return `${String(run.month).padStart(2, "0")}/${run.year}`;
}

export function calculateReceiptTotals(items: Array<{ grossAmount: string | number; socialEmployeeAmount: string | number; irtAmount: string | number; netAmount: string | number }>) {
  return items.reduce(
    (totals, item) => ({
      gross: totals.gross + Number(item.grossAmount),
      socialSecurity: totals.socialSecurity + Number(item.socialEmployeeAmount),
      irt: totals.irt + Number(item.irtAmount),
      net: totals.net + Number(item.netAmount),
    }),
    { gross: 0, socialSecurity: 0, irt: 0, net: 0 },
  );
}
