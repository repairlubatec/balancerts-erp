export const angolaNormativeSources = [
  { code: "DP-71-25", title: "Decreto Presidencial n.º 71/25, de 20 de Março", scope: "Emissão, rectificação, anulação, conservação e arquivamento de facturas e documentos fiscalmente relevantes", url: "https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391" },
  { code: "AGT-FAT-DOC", title: "AGT — Regime Jurídico das Facturas e Documentos Equivalentes", scope: "Requisitos de facturação, identificação fiscal, numeração sequencial e documentação comercial", url: "https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3" },
  { code: "PGC-AO-82-01", title: "Decreto n.º 82/01 — PGC Angola", scope: "Referência contabilística do plano de contas", url: "https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391" },
] as const;

export function normativeEvidence(code: string) {
  return angolaNormativeSources.find((source) => source.code === code);
}
