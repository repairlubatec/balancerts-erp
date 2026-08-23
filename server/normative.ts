export const angolaNormativeSources = [
  {
    code: "DP-71-25",
    title: "Decreto Presidencial n.º 71/25, de 20 de Março",
    scope:
      "Emissão, rectificação, anulação, conservação e arquivamento de facturas e documentos fiscalmente relevantes",
    url: "https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391",
    verificationStatus: "PENDING" as const,
  },
  {
    code: "AGT-FAT-DOC",
    title: "AGT — Regime Jurídico das Facturas e Documentos Equivalentes",
    scope:
      "Requisitos de facturação, identificação fiscal, numeração sequencial e documentação comercial",
    url: "https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3",
    verificationStatus: "PENDING" as const,
  },
  {
    code: "PGC-AO-82-01",
    title: "Decreto n.º 82/01 — PGC Angola",
    scope: "Referência contabilística do plano de contas",
    url: "https://cnnca.minfin.gov.ao/legislacao/sector-empresarial",
    verificationStatus: "CONFIRMED" as const,
  },
  {
    code: "LAW-14-23",
    title: "Lei n.º 14/23 — Alteração ao Código do IVA",
    scope:
      "Alterações ao Código do IVA, incidência, isenções, obrigações e demais regras fiscais",
    url: "https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/",
    verificationStatus: "CONFIRMED" as const,
  },
  {
    code: "AGT-IVA-SAF-T-2025",
    title: "AGT — Submissão automática da Declaração Periódica do IVA",
    scope:
      "SAF-T, pré-preenchimento, submissão automática, validação de ficheiros e campos ainda manuais",
    url: "https://agt.minfin.gov.ao/PortalAGT/#!/sala-de-imprensa/noticias/14131/iva-submissao-automatica-da-declaracao-periodica-implementada-a-partir-de-maio",
    verificationStatus: "PENDING" as const,
  },
  {
    code: "IVA-LAW-7-19",
    title: "Lei n.º 7/19, de 24 de Abril — aprovação do Código do IVA",
    scope:
      "Fonte histórica originária do Código do IVA; vigência do regime inicial desde 1 de Julho de 2019",
    url: "https://portaldocontribuinte.minfin.gov.ao/legislacao",
    verificationStatus: "CONFIRMED" as const,
  },
  {
    code: "IVA-LAW-17-19",
    title: "Lei n.º 17/19, de 13 de Agosto — alteração ao Código do IVA",
    scope:
      "Alterações ao regime original com vigência desde 1 de Outubro de 2019",
    url: "https://portaldocontribuinte.minfin.gov.ao/legislacao",
    verificationStatus: "CONFIRMED" as const,
  },
  {
    code: "IVA-DP-180-19",
    title:
      "Decreto Presidencial n.º 180/19, de 24 de Maio — Regulamento do Código do IVA",
    scope:
      "Regulamento do Código do IVA, conta 34.5-IVA, subcontas e regras contabilísticas",
    url: "https://portaldocontribuinte.minfin.gov.ao/legislacao",
    verificationStatus: "CONFIRMED" as const,
  },
  {
    code: "IVA-DE-134-19",
    title:
      "Decreto Executivo n.º 134/19, de 10 de Junho — modelos declarativos do IVA",
    scope:
      "Modelos, anexos e formulários declarativos; não é fonte autónoma de taxas materiais",
    url: "https://portaldocontribuinte.minfin.gov.ao/legislacao",
    verificationStatus: "CONFIRMED" as const,
  },
  {
    code: "IVA-LAW-14-23",
    title:
      "Lei n.º 14/23, de 28 de Dezembro — alteração e republicação do Código do IVA",
    scope:
      "Fonte central da versão consolidada actual, incluindo taxas, anexos e revogações",
    url: "https://portaldocontribuinte.minfin.gov.ao/legislacao",
    verificationStatus: "CONFIRMED" as const,
  },
] as const;

export function normativeEvidence(code: string) {
  return angolaNormativeSources.find(source => source.code === code);
}

export const decree71OperationalRequirements = [
  {
    code: "DP71-ISSUANCE",
    area: "ISSUANCE",
    status: "INTERNAL" as const,
    evidence: "DP-71-25",
  },
  {
    code: "DP71-RECTIFICATION",
    area: "RECTIFICATION",
    status: "INTERNAL" as const,
    evidence: "DP-71-25",
  },
  {
    code: "DP71-CANCELLATION",
    area: "CANCELLATION",
    status: "INTERNAL" as const,
    evidence: "DP-71-25",
  },
  {
    code: "DP71-RECEIPT",
    area: "RECEIPT",
    status: "EXTERNAL_PENDING" as const,
    evidence: "AGT-FAT-DOC",
  },
  {
    code: "DP71-ARCHIVE",
    area: "ARCHIVE",
    status: "INTERNAL" as const,
    evidence: "DP-71-25",
  },
  {
    code: "DP71-CERTIFICATION",
    area: "CERTIFICATION",
    status: "EXTERNAL_PENDING" as const,
    evidence: "AGT-FAT-DOC",
  },
] as const;

export function buildDecree71Coverage(input: {
  externallyVerifiedCodes?: string[];
}) {
  const externallyVerified = new Set(input.externallyVerifiedCodes ?? []);
  const requirements = decree71OperationalRequirements.map(requirement => ({
    ...requirement,
    status: externallyVerified.has(requirement.code)
      ? ("EXTERNALLY_VERIFIED" as const)
      : requirement.status,
  }));
  return {
    instrument: "DP-71-25",
    requirements,
    eligibleForCertification: requirements.every(
      requirement => requirement.status === "EXTERNALLY_VERIFIED"
    ),
  };
}

export function validateNormativeCoverage(input: {
  area: "FISCAL_DOCUMENT" | "ACCOUNTING";
  evidenceCodes: string[];
}) {
  const required =
    input.area === "FISCAL_DOCUMENT"
      ? ["DP-71-25", "AGT-FAT-DOC"]
      : ["PGC-AO-82-01"];
  const missing = required.filter(
    code => !input.evidenceCodes.includes(code) || !normativeEvidence(code)
  );
  return {
    valid: missing.length === 0,
    required,
    missing,
    evidence: input.evidenceCodes.map(normativeEvidence).filter(Boolean),
  };
}

export const IVA_NORMATIVE_CHAIN_SOURCE_CODES = [
  "IVA-LAW-7-19",
  "IVA-DP-180-19",
  "IVA-DE-134-19",
  "IVA-LAW-17-19",
  "IVA-LAW-14-23",
] as const;

export function evaluateIvaReadiness(input: {
  rules: Array<{ verificationStatus: string; regime: string }>;
  mappings: Array<{ verificationStatus: string }>;
  sources: Array<{ verificationStatus: string; code?: string }>;
}) {
  const activeRules = input.rules.filter(
    row => row.verificationStatus === "ACTIVE"
  );
  const activeMappings = input.mappings.filter(
    row => row.verificationStatus === "ACTIVE"
  );
  const confirmedSources = input.sources.filter(row =>
    ["CONFIRMED", "VISUALLY_CONFIRMED", "HUMAN_APPROVED", "ACTIVE"].includes(
      row.verificationStatus
    )
  );
  const confirmedSourceCodes = new Set(
    confirmedSources
      .map(row => row.code)
      .filter((code): code is string => Boolean(code))
  );
  const missingChainSources = IVA_NORMATIVE_CHAIN_SOURCE_CODES.filter(
    code => !confirmedSourceCodes.has(code)
  );
  const regimes = ["GERAL", "SIMPLIFICADO", "EXCLUSAO"] as const;
  const activeByRegime = Object.fromEntries(
    regimes.map(regime => [
      regime,
      activeRules.filter(row => row.regime === regime).length,
    ])
  ) as Record<(typeof regimes)[number], number>;
  const blockers: string[] = [];
  if (!activeRules.length) blockers.push("IVA_SEM_REGRA_ACTIVE");
  if (!activeMappings.length) blockers.push("IVA_SEM_MAPEAMENTO_34_5_ACTIVE");
  if (!confirmedSources.length) blockers.push("IVA_SEM_FONTE_CONFIRMADA");
  if (missingChainSources.length)
    blockers.push("IVA_CADEIA_NORMATIVA_INCOMPLETA");
  return {
    ready: blockers.length === 0,
    activeRules: activeRules.length,
    activeMappings: activeMappings.length,
    confirmedSources: confirmedSources.length,
    missingChainSources,
    activeByRegime,
    blockers,
  };
}
