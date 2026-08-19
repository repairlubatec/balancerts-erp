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

  it("traduz estados e entidade de Compras", () => {
    expect(presentationLabel("SUBMITTED")).toBe("Submetida");
    expect(presentationLabel("APPROVED")).toBe("Aprovada");
    expect(presentationLabel("RECEIVED")).toBe("Recebida");
    expect(presentationLabel("purchaseOrder")).toBe("Encomenda de compra");
    expect(presentationLabel("PURCHASE_ORDER_CREATED")).toBe("Encomenda de compra criada");
  });

  it("traduz tipos e direcções técnicas conhecidas", () => {
    expect(presentationLabel("SERVICE")).toBe("Serviço");
    expect(presentationLabel("CUSTOMER")).toBe("Cliente");
    expect(presentationLabel("BANK")).toBe("Banco");
    expect(presentationLabel("IN")).toBe("Entrada");
    expect(presentationLabel("PAYMENT_CREATED")).toBe("Pagamento Criado");
    expect(presentationLabel("treasuryTransaction")).toBe("Movimento de tesouraria");
    expect(presentationLabel("ui-payment-1-1787119815771")).toBe("Movimento de tesouraria");
    expect(presentationLabel("treasury-reconciliation:42")).toBe("Reconciliação de tesouraria");
    expect(presentationLabel("documentSeries")).toBe("Série documental");
    expect(presentationLabel("stockMovement")).toBe("Movimento de stock");
    expect(presentationLabel("counterparty")).toBe("Contraparte");
    expect(presentationLabel("cashAccount")).toBe("Conta de caixa");
    expect(presentationLabel("document:2310001:archive")).toBe("Documento operacional");
    expect(presentationLabel("company:1:activation")).toBe("Empresa");
    expect(presentationLabel("counterparty:2070001")).toBe("Contraparte");
    expect(presentationLabel("cash-account:2070001")).toBe("Conta de caixa");
    expect(presentationLabel("1:FT:2")).toBe("Reserva de numeração");
  });
});
