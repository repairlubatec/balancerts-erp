import { describe, expect, it } from "vitest";
import { buildAgtRegisterFacturaRequest, validateRegistarFacturaRequest, type AgtRegisterInvoiceRequest } from "./agt-portal";

const baseDocument = {
  documentNo: "FT FT2026S1/000001",
  documentStatus: "N" as const,
  documentDate: "2026-08-18",
  documentType: "FT",
  companyName: "Repair Lubatec",
  lines: [{ lineNumber: "1", operationType: "SS" as const, productCode: "SERV-001", productDescription: "Serviço", quantity: "1" }],
  documentTotals: { taxPayable: "0.00", netTotal: "100.00", grossTotal: "100.00" },
};

const baseRequest = (documents = [baseDocument]): AgtRegisterInvoiceRequest => ({
  schemaVersion: "1.01_01",
  submissionUUID: "123e4567-e89b-42d3-a456-426614174000",
  taxRegistrationNumber: "5001121871",
  submissionTimeStamp: "2026-08-18T09:00:00Z",
  softwareInfo: { softwareInfoDetail: { productId: "BALANCERTS.ERP", productVersion: "1.0.0", softwareValidationNumber: "PENDING", signatureVersion: 1 } },
  numberOfEntries: String(documents.length),
  documents,
});

describe("RegistarFactura validator", () => {
  it("accepts a normal invoice with versioned signature metadata", () => {
    expect(validateRegistarFacturaRequest(baseRequest()).valid).toBe(true);
  });

  it("rejects more than 30 documents in one submission", () => {
    const documents = Array.from({ length: 31 }, (_, index) => ({ ...baseDocument, documentNo: `FT FT2026S1/${String(index + 1).padStart(6, "0")}` }));
    expect(validateRegistarFacturaRequest(baseRequest(documents)).errors).toContain("numberOfEntries");
  });

  it("serializes the official RegistarFactura envelope fields", () => {
    const result = buildAgtRegisterFacturaRequest({ schemaVersion: "1.01_01", submissionUUID: "123e4567-e89b-42d3-a456-426614174000", taxRegistrationNumber: "5001121871", submissionTimeStamp: "2026-08-18T09:00:00Z", establishmentNumber: "001", softwareInfo: { productId: "BALANCERTS.ERP", productVersion: "1.0.0", softwareValidationNumber: "PENDING", signatureVersion: 2 }, documents: [baseDocument] });
    expect(result.numberOfEntries).toBe("1");
    expect(result.establishmentNumber).toBe("001");
    expect(result.softwareInfo.softwareInfoDetail.signatureVersion).toBe(2);
  });

  it("requires the originating document for cancellation and receipt structure for AR", () => {
    const cancelled = { ...baseDocument, documentStatus: "C" as const };
    const receipt = { ...baseDocument, documentType: "AR", lines: undefined };
    const result = validateRegistarFacturaRequest(baseRequest([cancelled, receipt]));
    expect(result.errors).toContain("documents[0].rejectedDocumentNo");
    expect(result.errors).toContain("documents[1].paymentReceipt");
  });
});
