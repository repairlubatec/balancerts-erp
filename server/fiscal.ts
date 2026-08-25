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

export type FiscalValidationFinding = {
  code: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
};

export function validateFiscalInput(input: {
  netAmount: number;
  regime: IvaRegime;
  at: Date;
  rule?: FiscalRule;
}): FiscalValidationFinding[] {
  const findings: FiscalValidationFinding[] = [];
  if (!Number.isFinite(input.netAmount) || input.netAmount < 0) {
    findings.push({ code: "FISCAL_BASE_INVALID", severity: "ERROR", message: "A base tributável deve ser um valor numérico não negativo." });
  }
  if (!input.rule) {
    findings.push({ code: "FISCAL_RULE_MISSING", severity: "ERROR", message: "Não existe regra fiscal aplicável configurada." });
    return findings;
  }
  if (input.rule.regime !== input.regime) {
    findings.push({ code: "FISCAL_RULE_REGIME_MISMATCH", severity: "ERROR", message: "O regime da regra não corresponde ao regime da operação." });
  }
  if (input.rule.verificationStatus && input.rule.verificationStatus !== "ACTIVE") {
    findings.push({ code: "FISCAL_RULE_NOT_ACTIVE", severity: "ERROR", message: "A regra fiscal ainda não está activa." });
  }
  if (input.rule.validFrom > input.at || (input.rule.validTo && input.rule.validTo < input.at)) {
    findings.push({ code: "FISCAL_RULE_EXPIRED_OR_NOT_YET_VALID", severity: "ERROR", message: "A regra fiscal não está vigente na data da operação." });
  }
  if (input.regime !== "EXCLUSAO" && input.rule.rate === undefined) {
    findings.push({ code: "FISCAL_RULE_RATE_REQUIRED", severity: "ERROR", message: "A regra não tem taxa configurada para este regime." });
  }
  if (!input.rule.legalReference) {
    findings.push({ code: "FISCAL_RULE_LEGAL_REFERENCE_REQUIRED", severity: "WARNING", message: "A referência jurídica explícita da regra requer validação." });
  }
  if (input.regime === "EXCLUSAO" && input.rule.rate !== undefined) {
    findings.push({ code: "FISCAL_RATE_IGNORED_FOR_EXCLUSION", severity: "INFO", message: "A taxa configurada não é aplicada no regime de exclusão." });
  }
  return findings;
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


export type FiscalTaxCoverageStatus = "IMPLEMENTADO_PARCIAL" | "PERSISTENCIA_APENAS" | "NAO_CONFIGURADO";

export type FiscalTaxCoverage = {
  code: "IVA" | "INDUSTRIAL" | "IRT" | "IAC" | "IS" | "IP" | "SISA" | "IEC" | "IVM";
  name: string;
  status: FiscalTaxCoverageStatus;
  supportedOperations: string[];
  missingCapabilities: string[];
  sourceUrls: string[];
};

/**
 * Catálogo de cobertura técnica, deliberadamente sem taxas. A presença de um
 * código no schema de fiscalTaxRecords não significa que o respectivo imposto
 * esteja parametrizado ou apto a calcular/entregar declarações.
 */
export const fiscalTaxCoverage: readonly FiscalTaxCoverage[] = [
  {
    code: "IVA",
    name: "Imposto sobre o Valor Acrescentado",
    status: "IMPLEMENTADO_PARCIAL",
    supportedOperations: ["facturação", "compras", "registo fiscal documental", "reconciliação"],
    missingCapabilities: ["declaração/submissão oficial AGT", "cobertura integral de regimes e excepções"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-o-valor-acrescentado"],
  },
  {
    code: "INDUSTRIAL",
    name: "Imposto Industrial",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["matéria colectável por regime", "provisional sobre vendas", "declaração anual", "regras de isenção e taxas versionadas"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial"],
  },
  {
    code: "IRT",
    name: "Imposto Sobre os Rendimentos do Trabalho",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["folha salarial", "Grupos A/B/C", "deduções e não sujeição", "retenção e declaração"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho"],
  },
  {
    code: "IAC",
    name: "Imposto sobre a Aplicação de Capitais",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["Secções A/B", "rendimentos de capitais", "retenção/liquidação", "isenções e declaração"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-aplicacao-de-capitais"],
  },
  {
    code: "IS",
    name: "Imposto de Selo",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["tabela de actos e operações", "valores absolutos/percentuais", "sujeito passivo e interesse económico", "declaração anual"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo"],
  },
  {
    code: "IP",
    name: "Imposto Predial",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["cadastro e avaliação de imóveis", "detenção/renda/transmissão", "isenções", "liquidação e calendário próprios"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano"],
  },
  {
    code: "SISA",
    name: "Imposto sobre Sucessões e Doações",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["transmissões gratuitas", "beneficiário e grau de relação", "UCF e escalões", "processo de liquidação"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-sucessoes-e-doacoes"],
  },
  {
    code: "IEC",
    name: "Imposto Especial de Consumo",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["classificação de produtos", "incidência e taxas por produto", "importação/produção", "declaração"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-especial-de-consumo"],
  },
  {
    code: "IVM",
    name: "Impostos sobre os Veículos Motorizados",
    status: "NAO_CONFIGURADO",
    supportedOperations: [],
    missingCapabilities: ["cadastro de veículos", "liquidação e selo", "regras por veículo", "calendário e integração AGT"],
    sourceUrls: ["https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/impostos-sobre-veiculos-motorizados"],
  },
];

export function getFiscalTaxCoverage() {
  return fiscalTaxCoverage.map((tax) => ({
    ...tax,
    supportedOperations: [...tax.supportedOperations],
    missingCapabilities: [...tax.missingCapabilities],
    sourceUrls: [...tax.sourceUrls],
  }));
}
