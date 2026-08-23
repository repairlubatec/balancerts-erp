import * as XLSX from "xlsx";
import { presentationLabel } from "./presentationLabels";

export type AuditExportEvent = {
  id: number;
  createdAt: Date | string;
  action: string;
  entityType: string;
  entityId: number | string;
  actorUserId: number;
  correlationId?: string | null;
  beforeState?: string | null;
  afterState?: string | null;
};

export function buildAuditXlsx(events: AuditExportEvent[]) {
  const rows = events.map((event) => ({
    Data: new Date(event.createdAt).toLocaleString("pt-PT"),
    Acção: presentationLabel(event.action),
    Entidade: `${presentationLabel(event.entityType)} #${String(event.entityId)}`,
    Utilizador: `#${event.actorUserId}`,
    Correlação: presentationLabel(event.correlationId ?? ""),
    "Estado anterior": event.beforeState ?? "Sem estado anterior",
    "Estado posterior": event.afterState ?? "Sem estado posterior",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ["Data", "Acção", "Entidade", "Utilizador", "Correlação", "Estado anterior", "Estado posterior"] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Auditoria");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

export function auditExcelFilename(companyId?: number) {
  const date = new Date().toISOString().slice(0, 10);
  return `auditoria-${companyId ?? "empresa"}-${date}.xlsx`;
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildAuditCsv(events: AuditExportEvent[]) {
  const header = ["Data", "Acção", "Entidade", "Utilizador", "Correlação", "Estado anterior", "Estado posterior"];
  const rows = events.map((event) => [
    new Date(event.createdAt).toLocaleString("pt-PT"),
    presentationLabel(event.action),
    `${presentationLabel(event.entityType)} #${String(event.entityId)}`,
    `#${event.actorUserId}`,
    presentationLabel(event.correlationId ?? ""),
    event.beforeState ?? "Sem estado anterior",
    event.afterState ?? "Sem estado posterior",
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;
}

export function auditCsvFilename(companyId?: number) {
  const date = new Date().toISOString().slice(0, 10);
  return `auditoria-${companyId ?? "empresa"}-${date}.csv`;
}

export function auditEventCsvFilename(eventId: number, companyId?: number) {
  return `auditoria-alerta-${companyId ?? "empresa"}-evento-${eventId}.csv`;
}
