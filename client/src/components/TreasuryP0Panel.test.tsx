import { describe, expect, it } from "vitest";
import { parseCsv } from "./TreasuryP0Panel";

describe("parser de extractos bancários", () => {
  it("converte linhas de entrada e saída com cabeçalho português", () => {
    const rows = parseCsv("Data;Data Valor;Descrição;Sentido;Valor;Referência\n2026-08-19;2026-08-19;Transferência cliente;Entrada;1250000;REF-001\n2026-08-20;2026-08-20;Pagamento fornecedor;Saída;430000;REF-002");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ direction: "IN", amount: 1250000, description: "Transferência cliente", externalReference: "REF-001" });
    expect(rows[1]).toMatchObject({ direction: "OUT", amount: 430000, description: "Pagamento fornecedor", externalReference: "REF-002" });
  });

  it("rejeita cabeçalho incompleto e montante inválido", () => {
    expect(() => parseCsv("Data;Descrição\n2026-08-19;Sem valor")).toThrow("cabeçalho");
    expect(() => parseCsv("Data;Descrição;Sentido;Valor\n2026-08-19;Movimento;Entrada;abc")).toThrow("Valor inválido");
  });
});
