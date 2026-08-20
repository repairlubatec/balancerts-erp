import { describe, expect, it } from "vitest";
import { BALANCERTS_COPYRIGHT, buildFiscalDocumentPdf } from "./fiscal-document-pdf";

describe("fiscal preparation PDF", () => {
  it("builds a PDF with hash, official QR URL and non-certification notice", async () => {
    const result = await buildFiscalDocumentPdf({
      company: { name: "Repair Lubatec", nif: "5001121871", address: "Shopping Millennium Loja 141, Lubango Huila", email: "repairlubatec@gmail.com" },
      document: { documentNumber: "FT FT2026S1/000001", documentType: "FT", status: "ISSUED", currency: "AOA", ivaRegime: "EXCLUSAO", netAmount: "100.00", taxAmount: "0.00", totalAmount: "100.00", issuedAt: "2026-08-18T10:00:00Z" },
      counterparty: { name: "Cliente teste", taxId: "500000001", address: "Lubango" },
      lines: [{ description: "Prestação de serviço", quantity: 1, unitPrice: 100, netAmount: 100, taxAmount: 0, totalAmount: 100 }],
    });
    expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.qrUrl).toContain("document=FT%20FT2026S1%2F000001");
    expect(result.certified).toBe(false);
    expect(result.mimeType).toBe("application/pdf");
    expect(BALANCERTS_COPYRIGHT).toBe("Copyright © Repair Lubatec");
    const imageCount = (result.buffer.toString("latin1").match(/\/Subtype \/Image/g) ?? []).length;
    expect(imageCount).toBeGreaterThanOrEqual(2);
  });
});
