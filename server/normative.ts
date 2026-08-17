export const angolaNormativeSources = [
  { code: "DP-71-25", title: "Decreto Presidencial n.º 71/25, de 20 de Março", scope: "Emissão, rectificação, anulação, conservação e arquivamento de facturas e documentos fiscalmente relevantes", url: "https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391" },
  { code: "AGT-FAT-DOC", title: "AGT — Regime Jurídico das Facturas e Documentos Equivalentes", scope: "Requisitos de facturação, identificação fiscal, numeração sequencial e documentação comercial", url: "https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3" },
  { code: "PGC-AO-82-01", title: "Decreto n.º 82/01 — PGC Angola", scope: "Referência contabilística do plano de contas", url: "https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391" },
] as const;

export function normativeEvidence(code: string) {
  return angolaNormativeSources.find((source) => source.code === code);
}

export const decree71OperationalRequirements = [
  { code: "DP71-ISSUANCE", area: "ISSUANCE", status: "INTERNAL" as const, evidence: "DP-71-25" },
  { code: "DP71-RECTIFICATION", area: "RECTIFICATION", status: "INTERNAL" as const, evidence: "DP-71-25" },
  { code: "DP71-CANCELLATION", area: "CANCELLATION", status: "INTERNAL" as const, evidence: "DP-71-25" },
  { code: "DP71-RECEIPT", area: "RECEIPT", status: "EXTERNAL_PENDING" as const, evidence: "AGT-FAT-DOC" },
  { code: "DP71-ARCHIVE", area: "ARCHIVE", status: "INTERNAL" as const, evidence: "DP-71-25" },
  { code: "DP71-CERTIFICATION", area: "CERTIFICATION", status: "EXTERNAL_PENDING" as const, evidence: "AGT-FAT-DOC" },
] as const;

export function buildDecree71Coverage(input: { externallyVerifiedCodes?: string[] }) {
  const externallyVerified = new Set(input.externallyVerifiedCodes ?? []);
  const requirements = decree71OperationalRequirements.map((requirement) => ({ ...requirement, status: externallyVerified.has(requirement.code) ? "EXTERNALLY_VERIFIED" as const : requirement.status }));
  return { instrument: "DP-71-25", requirements, eligibleForCertification: requirements.every((requirement) => requirement.status === "EXTERNALLY_VERIFIED") };
}

export function validateNormativeCoverage(input: { area: "FISCAL_DOCUMENT" | "ACCOUNTING"; evidenceCodes: string[] }) {
  const required = input.area === "FISCAL_DOCUMENT" ? ["DP-71-25", "AGT-FAT-DOC"] : ["PGC-AO-82-01"];
  const missing = required.filter((code) => !input.evidenceCodes.includes(code) || !normativeEvidence(code));
  return { valid: missing.length === 0, required, missing, evidence: input.evidenceCodes.map(normativeEvidence).filter(Boolean) };
}
