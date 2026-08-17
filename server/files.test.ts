import { describe, expect, it } from "vitest";
import { prepareTenantFile } from "./files";

describe("tenant file preparation", () => {
  it("creates an isolated key and integrity metadata", () => {
    const file = prepareTenantFile({ organizationId: 2, companyId: 7, userId: 11, filename: "factura cliente.pdf", mimeType: "application/pdf", data: "conteudo" });
    expect(file.key).toBe("org/2/company/7/documents/factura_cliente.pdf");
    expect(file.ownerUserId).toBe(11);
    expect(file.size).toBe(8);
    expect(file.sha256).toHaveLength(64);
  });

  it("rejects missing metadata", () => {
    expect(() => prepareTenantFile({ organizationId: 2, companyId: 7, userId: 11, filename: "", mimeType: "application/pdf", data: "x" })).toThrow("INVALID_FILE_METADATA");
  });
});
