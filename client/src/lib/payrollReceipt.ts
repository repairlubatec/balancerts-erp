export type ReceiptPeriod = { year: number; month: number };

export function formatInternalReceiptPeriod(run?: ReceiptPeriod | null) {
  if (!run) return "—";
  return `${String(run.month).padStart(2, "0")}/${run.year}`;
}

export function formatPayrollActor(actor: { name?: string | null; email?: string | null } | null | undefined, date: Date | string | null | undefined, emptyLabel: string) {
  if (!actor || !date) return emptyLabel;
  return `${actor.name || actor.email || "Utilizador"} · ${new Date(date).toLocaleString("pt-PT")}`;
}

export function formatReceiptMode(selectedEmployeeId: string, itemCount: number) {
  return selectedEmployeeId ? "Recibo individual" : `Mapa colectivo (${itemCount})`;
}

export function buildReceiptExportRows(items: Array<{ employee: { fullName: string; employeeNumber: string }; item: { grossAmount: string | number; socialEmployeeAmount: string | number; irtAmount: string | number; netAmount: string | number } }>) {
  const rows = items.map(({ employee, item }) => ({
    Colaborador: employee.fullName,
    Numero: employee.employeeNumber,
    Bruto_AOA: Number(item.grossAmount),
    Seguranca_Social_AOA: Number(item.socialEmployeeAmount),
    IRT_AOA: Number(item.irtAmount),
    Liquido_AOA: Number(item.netAmount),
  }));
  const totals = calculateReceiptTotals(items.map(({ item }) => item));
  return { rows, totals };
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
