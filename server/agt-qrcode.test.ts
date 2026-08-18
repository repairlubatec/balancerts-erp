import { describe, expect, it } from "vitest";
import { buildAgtQrUrl, generateAgtQrCodeDataUrl, validateAgtQrPayload } from "./agt-qrcode";

describe("AGT QR Code", () => {
  it("builds the official kiosk URL with UTF-8 URL encoding", () => {
    const url = buildAgtQrUrl({ issuerNif: "5001121871", documentNo: "FT FT2025S1/000001" });
    expect(url).toBe("https://quiosqueagt.minfin.gov.ao/facturacao-eletronica/consultar-fe?emissor=5001121871&document=FT%20FT2025S1%2F000001");
  });

  it("returns the official image constraints for the payload", () => {
    const result = validateAgtQrPayload({ issuerNif: "5001121871", documentNo: "FT FT2025S1/000001" });
    expect(result.valid).toBe(true);
    expect(result.image).toMatchObject({ format: "PNG", width: 350, height: 350, errorCorrectionLevel: "M", encoding: "UTF-8" });
    expect(result.logo.requiredBySpecification).toBe(true);
  });

  it("generates a PNG data URL", async () => {
    const dataUrl = await generateAgtQrCodeDataUrl({ issuerNif: "5001121871", documentNo: "FT FT2025S1/000001" });
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("rejects invalid issuer and document values", () => {
    expect(() => buildAgtQrUrl({ issuerNif: "AO", documentNo: "FT 1" })).toThrow("AGT_QR_ISSUER_NIF_INVALID");
    expect(() => buildAgtQrUrl({ issuerNif: "5001121871", documentNo: " " })).toThrow("AGT_QR_DOCUMENT_NUMBER_REQUIRED");
  });
});
