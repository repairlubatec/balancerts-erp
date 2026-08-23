export const requiredOperationalAccountingRuleOperations = ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] as const;

export function normalizeAccountingRuleOperation(operation: string) {
  const normalized = operation.trim().toUpperCase();
  if (["COMPRA", "COMPRAS"].includes(normalized)) return "COMPRAS";
  if (["VENDA", "VENDAS"].includes(normalized)) return "VENDAS";
  if (["STOCK", "ESTOQUE", "INVENTARIO"].includes(normalized)) return "STOCK";
  if (["TESOURARIA", "PAGAMENTO", "PAGAMENTOS", "RECEBIMENTO", "RECEBIMENTOS"].includes(normalized)) return "TESOURARIA";
  if (["SALARIO", "SALARIOS", "FOLHA"].includes(normalized)) return "SALARIOS";
  if (["IMOBILIZADO", "DEPRECIACAO", "DEPRECIAÇÃO"].includes(normalized)) return "IMOBILIZADO";
  return normalized;
}

export function accountingRuleOperationCandidates(operation: string) {
  const raw = operation.trim();
  return Array.from(new Set([raw, normalizeAccountingRuleOperation(raw)]));
}
