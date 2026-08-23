import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { auditCsvFilename, auditEventCsvFilename, auditReviewHistoryCsvFilename, auditExcelFilename, buildAuditCsv, buildAuditXlsx } from "./auditExport";

describe("exportação Excel da auditoria", () => {
  it("preserva rastreabilidade e cabeçalhos em português", () => {
    const data = buildAuditXlsx([{ id: 1, createdAt: "2026-08-20T10:00:00.000Z", action: "DOCUMENT_CREATED", entityType: "DOCUMENT", entityId: 8, actorUserId: 2, correlationId: "corr-1", beforeState: null, afterState: "Criado" }]);
    const workbook = XLSX.read(data, { type: "array" });
    expect(workbook.SheetNames).toEqual(["Auditoria"]);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Auditoria) as Array<Record<string, string>>;
    expect(rows[0]).toMatchObject({ Entidade: "Documento #8", Utilizador: "#2", Correlação: "corr-1", "Estado anterior": "Sem estado anterior", "Estado posterior": "Criado" });
  });

  it("gera nome por empresa e data", () => {
    expect(auditExcelFilename(4)).toMatch(/^auditoria-4-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});


describe("exportação CSV dos logs de auditoria", () => {
  it("gera BOM, cabeçalhos em português e escapa aspas/linhas", () => {
    const csv = buildAuditCsv([{ id: 2, createdAt: "2026-08-20T10:00:00.000Z", action: "PGC_EVIDENCE_REVIEW_DECIDED", entityType: "pgcEvidenceSubmission", entityId: 9, actorUserId: 8, correlationId: "corr;2", beforeState: "{\"status\":\"PENDING\"}", afterState: "Decisão: \"CONFIRM\"\nRevisto" }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Data";"Acção";"Entidade";"Utilizador";"Correlação";"Estado anterior";"Estado posterior"');
    expect(csv).toContain('"corr;2"');
    expect(csv).toContain('"Decisão: ""CONFIRM""\nRevisto"');
  });

  it("gera nome CSV por empresa e data", () => {
    expect(auditCsvFilename(4)).toMatch(/^auditoria-4-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("gera nome CSV específico para o evento seleccionado", () => {
    expect(auditEventCsvFilename(27, 4)).toBe("auditoria-alerta-4-evento-27.csv");
  });

  it("gera nome específico para o histórico de estados do alerta", () => {
    expect(auditReviewHistoryCsvFilename(27, 4)).toBe("historico-auditoria-alerta-4-evento-27.csv");
  });

  it("preserva a sequência das transições no CSV do histórico", () => {
    const csv = buildAuditCsv([
      { id: 101, createdAt: "2026-08-23T10:00:00.000Z", action: "AUDIT_ALERT_REVIEWED", entityType: "auditEvent", entityId: "27", actorUserId: 8, correlationId: "audit-alert-status:27:REVIEWED", beforeState: "OPEN", afterState: "REVIEWED" },
      { id: 102, createdAt: "2026-08-23T10:01:00.000Z", action: "AUDIT_ALERT_RESOLVED", entityType: "auditEvent", entityId: "27", actorUserId: 8, correlationId: "audit-alert-status:27:RESOLVED", beforeState: "REVIEWED", afterState: "RESOLVED" },
    ]);
    expect(csv.indexOf("OPEN")).toBeLessThan(csv.indexOf("RESOLVED"));
    expect(csv).toContain("audit-alert-status:27:REVIEWED");
    expect(csv).toContain("audit-alert-status:27:RESOLVED");
  });
});
