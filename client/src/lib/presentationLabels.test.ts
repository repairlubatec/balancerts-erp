import { describe, expect, it } from "vitest";
import { presentationLabel, statusLabel } from "./presentationLabels";

describe("rótulos de apresentação em português", () => {
  it("traduz estados operacionais e de reconciliação", () => {
    expect(statusLabel("UNRECONCILED")).toBe("Por reconciliar");
    expect(statusLabel("PENDING")).toBe("Pendente");
    expect(statusLabel("ACCOUNTED")).toBe("Contabilizado");
    expect(statusLabel("payment")).toBe("Pagamento");
    expect(statusLabel("READY_TO_CONFIRM")).toBe("Pronto para confirmar");
    expect(statusLabel("DOCUMENT_ARCHIVED")).toBe("Documento Arquivado");
  });

  it("traduz tipos e direcções técnicas conhecidas", () => {
    expect(presentationLabel("SERVICE")).toBe("Serviço");
    expect(presentationLabel("CUSTOMER")).toBe("Cliente");
    expect(presentationLabel("BANK")).toBe("Banco");
    expect(presentationLabel("IN")).toBe("Entrada");
    expect(presentationLabel("PAYMENT_CREATED")).toBe("Pagamento Criado");
    expect(presentationLabel("treasuryTransaction")).toBe("Tesouraria Movimento");
  });
});
