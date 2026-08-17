const REPORT_TO_ENTRY: Record<string, string> = {
  "Balancete analítico": "FT 2026/00482",
  "Demonstração de Resultados": "NC 2026/00017",
  "Mapa de IVA": "LCT 2026/01109",
};

const ENTRY_TO_REPORT: Record<string, string> = {
  "FT 2026/00482": "Balancete analítico",
  "NC 2026/00017": "Demonstração de Resultados",
  "LCT 2026/01109": "Mapa de IVA",
};

export function getReportEntryKey(selected: string) {
  return REPORT_TO_ENTRY[selected] ?? selected;
}

export function getEntryReportKey(selected: string) {
  return ENTRY_TO_REPORT[selected] ?? "Balancete analítico";
}

export function getReportTraceRoutes(selected: string) {
  const encodedReport = encodeURIComponent(selected);
  const encodedEntry = encodeURIComponent(getReportEntryKey(selected));
  return { account: `/contabilidade?focus=${encodedEntry}`, journal: `/contabilidade?entry=${encodedEntry}`, document: `/documentos?focus=${encodedReport}`, audit: `/auditoria?focus=${encodedReport}` };
}

export function getDocumentTraceRoutes(selected: string) {
  const encodedDocument = encodeURIComponent(selected);
  const entry = getReportEntryKey(getEntryReportKey(selected));
  const encodedEntry = encodeURIComponent(entry);
  const encodedReport = encodeURIComponent(getEntryReportKey(entry));
  return { report: `/relatorios?focus=${encodedReport}`, account: `/contabilidade?focus=${encodedEntry}`, journal: `/contabilidade?entry=${encodedEntry}`, audit: `/auditoria?focus=${encodedDocument}` };
}

export function getAccountTraceRoutes(selected: string) {
  const encodedEntry = encodeURIComponent(selected);
  const encodedReport = encodeURIComponent(getEntryReportKey(selected));
  return { report: `/relatorios?focus=${encodedReport}`, journal: `/contabilidade?entry=${encodedEntry}`, document: `/documentos?focus=${encodedEntry}`, audit: `/auditoria?focus=${encodedEntry}` };
}
