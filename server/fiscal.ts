export type IvaRegime = "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";

export type FiscalRule = {
  code: string;
  regime: IvaRegime;
  validFrom: Date;
  validTo?: Date | null;
  rate?: number;
  evidence: string;
};

export function activeFiscalRule(rules: FiscalRule[], regime: IvaRegime, at: Date) {
  return rules.find((rule) => rule.regime === regime && rule.validFrom <= at && (!rule.validTo || rule.validTo >= at));
}

export function calculateIva(input: { netAmount: number; regime: IvaRegime; rule: FiscalRule }) {
  if (input.rule.regime !== input.regime) throw new Error("FISCAL_RULE_REGIME_MISMATCH");
  if (input.regime === "EXCLUSAO") return { netAmount: input.netAmount, taxAmount: 0, totalAmount: input.netAmount };
  if (input.rule.rate === undefined) throw new Error("FISCAL_RULE_RATE_REQUIRED");
  const taxAmount = Math.round(input.netAmount * input.rule.rate * 100) / 100;
  return { netAmount: input.netAmount, taxAmount, totalAmount: input.netAmount + taxAmount };
}
