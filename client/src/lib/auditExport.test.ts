import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { auditExcelFilename, buildAuditXlsx } from "./auditExport";

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
