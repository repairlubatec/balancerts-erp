import { describe, expect, it } from "vitest";
import { buildSimpleSimulationPdf, buildSimulationCsv } from "./reportSimulationExport";

describe("exportação das simulações PGCA", () => {
  it("escapa correctamente valores CSV com separadores, aspas e novas linhas", () => {
    const csv = buildSimulationCsv({ title: "Balancete", versionCode: "PGCA-82-01", rows: [{ code: "18.1", label: "Conta; com \"nota\"\nlegal", debit: 10, credit: 2 }] });
    expect(csv).toContain('"Conta; com ""nota""\nlegal"');
    expect(csv).toContain("18.1;\"Conta;");
    expect(csv).toContain("10,00");
  });

  it("gera um PDF válido e identifica a simulação como read-only", async () => {
    const blob = buildSimpleSimulationPdf(["BALANCERTS.ERP", "Simulação de balancete", "Documento read-only"]);
    expect(blob.type).toBe("application/pdf");
    expect(await blob.text()).toContain("%PDF-1.4");
    expect(await blob.text()).toContain("Documento read-only");
  });
});
