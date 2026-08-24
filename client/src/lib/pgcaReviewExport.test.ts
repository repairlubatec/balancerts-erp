import { describe, expect, it } from "vitest";
import { buildPgcaReviewCsv } from "./pgcaReviewExport";

describe("buildPgcaReviewCsv", () => {
  it("exporta contas e pendências externas no mesmo CSV", () => {
    const csv = buildPgcaReviewCsv(
      [{ code: "18.1", name: "Conta, com vírgula", accountType: "GROUP", validationStatus: "PENDING", acceptsEntries: 0 }],
      [{ label: "Restauro isolado", count: 9, reason: "Destino MySQL/TiDB em espera" }],
    );
    expect(csv).toContain("SECÇÃO");
    expect(csv).toContain('"CONTA_PGCA","18.1","Conta, com vírgula"');
    expect(csv).toContain('"PENDÊNCIA_EXTERNA","","","","EM ESPERA"');
    expect(csv).toContain("Destino MySQL/TiDB em espera");
  });

  it("não altera a lista de entrada e conserva valores vazios", () => {
    const accounts = [{ code: "2", name: "Caixa", validationStatus: "CONFIRMED" }];
    const csv = buildPgcaReviewCsv(accounts, []);
    expect(accounts).toHaveLength(1);
    expect(csv).toContain('"CONTA_PGCA","2","Caixa","","CONFIRMED","Não"');
  });
});
