export type IvaRegime = "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";

export type FiscalRule = {
  code: string;
  regime: IvaRegime;
  validFrom: Date;
  validTo?: Date | null;
  rate?: number;
  evidence: string;
  legalReference?: string;
  version?: string;
  verificationStatus?: "PENDING" | "HUMAN_APPROVED" | "ACTIVE" | "SUPERSEDED" | "REJECTED";
};

export function activeFiscalRule(rules: FiscalRule[], regime: IvaRegime, at: Date) {
  return rules
    .filter(
      (rule) =>
        rule.regime === regime &&
        rule.validFrom <= at &&
        (!rule.validTo || rule.validTo >= at) &&
        (!rule.verificationStatus || rule.verificationStatus === "ACTIVE")
    )
    .sort((left, right) => right.validFrom.getTime() - left.validFrom.getTime())[0];
}

export function validateFiscalRuleSet(rules: FiscalRule[]) {
  const errors: string[] = [];
  const byCode = new Map<string, FiscalRule[]>();
  for (const rule of rules) {
    if (!rule.code.trim()) errors.push("FISCAL_RULE_CODE_REQUIRED");
    if (!rule.evidence.trim()) errors.push(`FISCAL_RULE_EVIDENCE_REQUIRED:${rule.code}`);
    if (rule.validTo && rule.validTo < rule.validFrom) {
      errors.push(`FISCAL_RULE_INVALID_VIGENCY:${rule.code}`);
    }
    const bucket = byCode.get(`${rule.code}:${rule.regime}`) ?? [];
    bucket.push(rule);
    byCode.set(`${rule.code}:${rule.regime}`, bucket);
  }
  for (const [key, versions] of Array.from(byCode.entries())) {
    const ordered = [...versions].sort((left, right) => left.validFrom.getTime() - right.validFrom.getTime());
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      if (!previous.validTo || current.validFrom <= previous.validTo) {
        errors.push(`FISCAL_RULE_OVERLAP:${key}`);
      }
    }
  }
  return { valid: errors.length === 0, errors: Array.from(new Set(errors)) };
}

export type FiscalCalculationResult = {
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxType: "IVA";
  taxBase: number;
  ruleId: string;
  ruleVersion: string;
  legalReference: string | null;
  warnings: string[];
  validationErrors: string[];
};

export function calculateIva(input: { netAmount: number; regime: IvaRegime; rule: FiscalRule }) {
  if (input.rule.verificationStatus && input.rule.verificationStatus !== "ACTIVE") throw new Error("FISCAL_RULE_NOT_ACTIVE");
  if (input.rule.regime !== input.regime) throw new Error("FISCAL_RULE_REGIME_MISMATCH");
  if (input.regime === "EXCLUSAO") return { netAmount: input.netAmount, taxAmount: 0, totalAmount: input.netAmount };
  if (input.rule.rate === undefined) throw new Error("FISCAL_RULE_RATE_REQUIRED");
  const taxAmount = Math.round(input.netAmount * input.rule.rate * 100) / 100;
  return { netAmount: input.netAmount, taxAmount, totalAmount: input.netAmount + taxAmount };
}

export function calculateFiscalResult(input: { netAmount: number; regime: IvaRegime; rule: FiscalRule }): FiscalCalculationResult {
  const calculation = calculateIva(input);
  const warnings = input.rule.legalReference ? [] : ["FISCAL_RULE_LEGAL_REFERENCE_REQUIRED"];
  return {
    ...calculation,
    taxType: "IVA",
    taxBase: input.netAmount,
    ruleId: input.rule.code,
    ruleVersion: input.rule.version ?? input.rule.validFrom.toISOString().slice(0, 10),
    legalReference: input.rule.legalReference ?? null,
    warnings,
    validationErrors: [],
  };
}
