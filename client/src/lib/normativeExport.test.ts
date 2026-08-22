import { describe, expect, it } from "vitest";
import { buildPgcAccountsCsv, pgcAccountsExportFilename } from "./normativeExport";

describe("exportação CSV das contas PGCA", () => {
  it("exporta natureza, saldo, estado e apresentação com BOM e separador europeu", () => {
    const csv = buildPgcAccountsCsv([
      { code: "4511", name: "Caixa Kwanza", classCode: "4", parentCode: "451", nature: "DEBIT", balanceType: "DEBIT", accountType: "MOVEMENT", acceptsEntries: 1, validationStatus: "CONFIRMED", balanceSheet: 1, incomeStatement: 0 },
      { code: "6131", name: "Mercado nacional", classCode: "6", parentCode: "613", nature: "CREDIT", balanceType: "CREDIT", accountType: "MOVEMENT", acceptsEntries: 0, validationStatus: "PENDING", balanceSheet: 0, incomeStatement: 1 },
    ]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Código";"Designação";"Classe";"Conta-pai";"Natureza"');
    expect(csv).toContain('"4511";"Caixa Kwanza";"4";"451";"Devedora";"Saldo devedor";"Movimento";"Sim";"Confirmada";"Balanço"');
    expect(csv).toContain('"6131";"Mercado nacional";"6";"613";"Credora";"Saldo credor";"Movimento";"Não";"Pendente";"Resultados"');
  });

  it("escapa aspas e valores ausentes sem quebrar as colunas", () => {
    const csv = buildPgcAccountsCsv([{ code: "5", name: 'Capital "social"', parentCode: null, acceptsEntries: 0, validationStatus: "NEEDS_REVIEW" }]);
    expect(csv).toContain('"5";"Capital ""social""";"5";"";"Não informado";"Não informado";"Não informado";"Não";"Requer revisão";"Não definida"');
  });

  it("gera nome de ficheiro seguro e com data ISO", () => {
    expect(pgcAccountsExportFilename("PGCA-82/01")).toMatch(/^contas-pgca-PGCA-82-01-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
