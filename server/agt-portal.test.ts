import { describe, expect, it, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { AGT_SIGT_FE_NAMESPACE, AGT_REST_HOMOLOGATION_PATHS, buildAgtHeaders, buildAgtPortalEnvelope, buildAgtQueryRequest, buildAgtRestUrl, buildIssuerSignature, buildSoapAction, buildSoftwareInfo, classifyAgtResponse, validateRegistarFacturaRequest } from "./agt-portal";
import { callAgtPortal } from "./agt-client";

describe("AGT Portal do Parceiro — contratos SIGT/FE", () => {
  it("builds software info without requiring a production key", () => {
    expect(buildSoftwareInfo({ productId: "BALANCERTS.ERP", productVersion: "1.0.0", softwareValidationNumber: "PENDING" })).toEqual({ productId: "BALANCERTS.ERP", productVersion: "1.0.0", softwareValidationNumber: "PENDING" });
  });

  it("creates compact RS256 JWS with an ephemeral test key", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const signature = buildIssuerSignature({ taxRegistrationNumber: "5001121871", submissionUUID: "test-uuid" }, pem)!;
    expect(signature.split(".")).toHaveLength(3);
    expect(buildSoftwareInfo({ productId: "BALANCERTS.ERP", productVersion: "1.0.0", privateKeyPem: pem }).jwsSoftwareSignature).toBeTruthy();
  });

  it("builds every operation documented by the Portal namespace", () => {
    const operations = ["RegistarFactura", "ObterEstado", "ListarFacturas", "ConsultarFactura", "SolicitarSerie", "ListarSeries", "ValidarDocumento"] as const;
    const softwareInfo = buildSoftwareInfo({ productId: "BALANCERTS.ERP", productVersion: "1.0.0" });
    for (const operation of operations) {
      const envelope = buildAgtPortalEnvelope({ operation, schemaVersion: "1.0", softwareInfo, payload: { taxRegistrationNumber: "5001121871" } });
      expect(envelope.namespace).toBe(AGT_SIGT_FE_NAMESPACE);
      expect(envelope.operation).toBe(operation);
      expect(buildSoapAction(operation)).toContain(operation);
    }
  });

  it("calls the documented REST adapter with simulated responses and timeout policy", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ documentStatus: "ACCEPTED" }), { status: 200 }));
    const accepted = await callAgtPortal({ baseUrl: "https://sifphml.minfin.gov.ao/sigt/fe/v1", operation: "ValidarDocumento", payload: { documentNo: "FT 2026/1" }, username: "test-user", passwordToken: "test-token", fetchImpl });
    expect(accepted.classification).toMatchObject({ state: "COMPLETED", code: "AGT_ACCEPTED" });
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining("/validarDocumento"), expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Username: "test-user", Password: "test-token" }) }));
    const retryFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response("busy", { status: 503 }));
    const retry = await callAgtPortal({ baseUrl: "https://sifphml.minfin.gov.ao/sigt/fe/v1", operation: "ObterEstado", payload: {}, username: "u", passwordToken: "p", fetchImpl: retryFetch });
    expect(retry.classification).toMatchObject({ state: "RETRY", retryable: true });
    await expect(callAgtPortal({ baseUrl: "http://insecure.invalid", operation: "ObterEstado", payload: {}, username: "u", passwordToken: "p", fetchImpl })).rejects.toThrow("AGT_HTTPS_REQUIRED");
  });

  it("builds documented REST paths and query requests without production secrets", () => {
    expect(AGT_REST_HOMOLOGATION_PATHS.ValidarDocumento).toBe("/validarDocumento");
    expect(buildAgtRestUrl("https://sifphml.minfin.gov.ao/sigt/fe/v1/", "RegistarFactura")).toBe("https://sifphml.minfin.gov.ao/sigt/fe/v1/registarFactura");
    expect(buildAgtHeaders({ username: "test-user", passwordToken: "test-token" })).toMatchObject({ Username: "test-user", Password: "test-token", Accept: "application/json" });
    const request = buildAgtQueryRequest({ operation: "ListarFacturas", schemaVersion: "1.0", taxRegistrationNumber: "5001121871", softwareInfo: buildSoftwareInfo({ productId: "BALANCERTS.ERP", productVersion: "1.0.0" }), parameters: { queryStartDate: "2026-01-01", queryEndDate: "2026-01-31" } });
    expect(request).toMatchObject({ schemaVersion: "1.0", taxRegistrationNumber: "5001121871", queryStartDate: "2026-01-01", queryEndDate: "2026-01-31", softwareInfo: { softwareInfoDetail: { productId: "BALANCERTS.ERP" } } });
    expect(request.jwsSignature).toBeUndefined();
  });

  it("validates RegistarFactura fields and sequential lines", () => {
    const valid = validateRegistarFacturaRequest({
      schemaVersion: "1.0",
      submissionUUID: "550e8400-e29b-41d4-a716-446655440000",
      taxRegistrationNumber: "5001121871",
      submissionTimeStamp: "2026-08-18T08:00:00",
      softwareInfo: { softwareInfoDetail: { productId: "BALANCERTS.ERP", productVersion: "1.0.0" } },
      numberOfEntries: "1",
      documents: [{ documentNo: "FT 2026/1", documentStatus: "N", documentDate: "2026-08-18", documentType: "FT", companyName: "Repair Lubatec", lines: [{ lineNumber: "1", productCode: "SERV-1", productDescription: "Serviço", quantity: "1" }], documentTotals: { taxPayable: "0", netTotal: "100", grossTotal: "100" } }],
    });
    expect(valid).toEqual({ valid: true, errors: [] });
    const invalid = validateRegistarFacturaRequest({
      schemaVersion: "1.0", submissionUUID: "not-a-uuid", taxRegistrationNumber: "", submissionTimeStamp: "", softwareInfo: { softwareInfoDetail: { productId: "", productVersion: "" } }, numberOfEntries: "2", documents: [],
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual(expect.arrayContaining(["submissionUUID", "taxRegistrationNumber", "softwareInfo.productId", "numberOfEntries"]));
  });

  it("classifies AGT responses conservatively for retry and failure", () => {
    expect(classifyAgtResponse({ httpStatus: 503 })).toMatchObject({ state: "RETRY", retryable: true });
    expect(classifyAgtResponse({ httpStatus: 400, responseCode: "INVALID_DOCUMENT" })).toMatchObject({ state: "FAILED", retryable: false, code: "INVALID_DOCUMENT" });
    expect(classifyAgtResponse({ httpStatus: 200, documentStatus: "ACCEPTED" })).toMatchObject({ state: "COMPLETED", retryable: false });
  });
});
