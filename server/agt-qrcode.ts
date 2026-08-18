import QRCode from "qrcode";

export const AGT_FE_QR_BASE_URL = "https://quiosqueagt.minfin.gov.ao/facturacao-eletronica/consultar-fe";
export const AGT_FE_QR_SIZE = 350;
export const AGT_FE_QR_ERROR_CORRECTION = "M" as const;

export type AgtQrCodeInput = {
  issuerNif: string;
  documentNo: string;
};

export function buildAgtQrUrl(input: AgtQrCodeInput) {
  const issuerNif = input.issuerNif.trim();
  const documentNo = input.documentNo.trim();
  if (!/^\d{9,15}$/.test(issuerNif)) throw new Error("AGT_QR_ISSUER_NIF_INVALID");
  if (!documentNo) throw new Error("AGT_QR_DOCUMENT_NUMBER_REQUIRED");
  const encodedDocumentNo = encodeURIComponent(documentNo).replace(/%2F/gi, "%2F");
  return `${AGT_FE_QR_BASE_URL}?emissor=${encodeURIComponent(issuerNif)}&document=${encodedDocumentNo}`;
}

export async function generateAgtQrCodeDataUrl(input: AgtQrCodeInput) {
  const url = buildAgtQrUrl(input);
  return QRCode.toDataURL(url, {
    type: "image/png",
    width: AGT_FE_QR_SIZE,
    margin: 1,
    errorCorrectionLevel: AGT_FE_QR_ERROR_CORRECTION,
    color: { dark: "#111827", light: "#ffffff" },
  });
}

export function validateAgtQrPayload(input: AgtQrCodeInput) {
  const url = buildAgtQrUrl(input);
  return {
    valid: url.startsWith(`${AGT_FE_QR_BASE_URL}?`),
    url,
    image: { format: "PNG" as const, width: AGT_FE_QR_SIZE, height: AGT_FE_QR_SIZE, errorCorrectionLevel: AGT_FE_QR_ERROR_CORRECTION, encoding: "UTF-8" as const },
    logo: { requiredBySpecification: true, configured: false, maxCoveragePercent: 20 },
  };
}
