import { createSign } from "node:crypto";

export const AGT_SIGT_FE_NAMESPACE = "http://sifp.minfin.gov.ao/sigt/fe/ws/v1";
export const AGT_JWS_ALGORITHM = "RS256" as const;

export type AgtSoftwareInfo = {
  productId: string;
  productVersion: string;
  softwareValidationNumber?: string;
  jwsSoftwareSignature?: string;
};

export type AgtIssuerSignatureInput = {
  taxRegistrationNumber: string;
  queryStartDate?: string;
  queryEndDate?: string;
  submissionUUID?: string;
  invoiceNo?: string;
  submissionTimeStamp?: string;
};

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
}

export function createCompactJws(payload: Record<string, unknown>, privateKeyPem: string) {
  if (!privateKeyPem.includes("BEGIN PRIVATE KEY") && !privateKeyPem.includes("BEGIN RSA PRIVATE KEY")) throw new Error("AGT_PRIVATE_KEY_PEM_REQUIRED");
  const encodedHeader = base64Url(stableJson({ alg: AGT_JWS_ALGORITHM, typ: "JWT" }));
  const encodedPayload = base64Url(stableJson(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${signer.sign(privateKeyPem).toString("base64url")}`;
}

export function buildSoftwareInfo(input: { productId: string; productVersion: string; softwareValidationNumber?: string; privateKeyPem?: string }): AgtSoftwareInfo {
  if (!input.productId.trim() || !input.productVersion.trim()) throw new Error("AGT_SOFTWARE_INFO_INCOMPLETE");
  const detail: Record<string, string> = { productId: input.productId.trim(), productVersion: input.productVersion.trim() };
  if (input.softwareValidationNumber?.trim()) detail.softwareValidationNumber = input.softwareValidationNumber.trim();
  return { productId: detail.productId, productVersion: detail.productVersion, ...(detail.softwareValidationNumber ? { softwareValidationNumber: detail.softwareValidationNumber } : {}), ...(input.privateKeyPem ? { jwsSoftwareSignature: createCompactJws(detail, input.privateKeyPem) } : {}) };
}

export function buildIssuerSignature(input: AgtIssuerSignatureInput, privateKeyPem?: string) {
  if (!input.taxRegistrationNumber.trim()) throw new Error("AGT_TAX_REGISTRATION_NUMBER_REQUIRED");
  if (!privateKeyPem) return undefined;
  const fields = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== ""));
  return createCompactJws(fields, privateKeyPem);
}

export type AgtPortalOperation = "RegistarFactura" | "ObterEstado" | "ListarFacturas" | "ConsultarFactura" | "SolicitarSerie" | "ListarSeries" | "ValidarDocumento";

export function buildAgtPortalEnvelope(input: {
  operation: AgtPortalOperation;
  schemaVersion: string;
  softwareInfo: AgtSoftwareInfo;
  payload: Record<string, unknown>;
  issuerSignature?: string;
}) {
  if (!input.schemaVersion.trim()) throw new Error("AGT_SCHEMA_VERSION_REQUIRED");
  return {
    namespace: AGT_SIGT_FE_NAMESPACE,
    operation: input.operation,
    schemaVersion: input.schemaVersion,
    softwareInfo: input.softwareInfo,
    ...(input.issuerSignature ? { jwsSignature: input.issuerSignature } : {}),
    payload: input.payload,
  };
}

export function buildSoapAction(operation: AgtPortalOperation) {
  return `${AGT_SIGT_FE_NAMESPACE}/${operation}`;
}

export function classifyAgtResponse(input: { httpStatus: number; documentStatus?: string; responseCode?: string; message?: string }) {
  if (input.httpStatus >= 500) return { state: "RETRY" as const, retryable: true, code: input.responseCode ?? "AGT_HTTP_5XX" };
  if (input.httpStatus === 429) return { state: "RETRY" as const, retryable: true, code: input.responseCode ?? "AGT_RATE_LIMIT" };
  if (input.httpStatus >= 400) return { state: "FAILED" as const, retryable: false, code: input.responseCode ?? "AGT_HTTP_4XX" };
  if (input.documentStatus && ["REJECTED", "ERROR", "INVALID"].includes(input.documentStatus.toUpperCase())) return { state: "FAILED" as const, retryable: false, code: input.responseCode ?? input.documentStatus };
  return { state: "COMPLETED" as const, retryable: false, code: input.responseCode ?? "AGT_ACCEPTED" };
}


export type AgtTaxLine = {
  taxType: string;
  taxCountryRegion?: string;
  taxCode?: string;
  taxBase?: string;
  taxPercentage?: string;
  taxAmount?: string;
  taxContribution?: string;
  taxExemptionCode?: string;
};

export type AgtInvoiceLine = {
  lineNumber: string;
  productCode: string;
  productDescription: string;
  quantity: string;
  unitOfMeasure?: string;
  unitPrice?: string;
  unitPriceBase?: string;
  referenceInfo?: { reference?: string; referenceItemLineNo?: string; reason?: string };
  debitAmount?: string;
  creditAmount?: string;
  taxes?: AgtTaxLine[];
  settlementAmount?: string;
};

export type AgtInvoiceDocument = {
  documentNo: string;
  documentStatus: string;
  jwsDocumentSignature?: string;
  documentDate: string;
  documentType: string;
  eacCode?: string;
  systemEntryDate?: string;
  customerTaxID?: string;
  customerCountry?: string;
  companyName: string;
  lines?: AgtInvoiceLine[];
  documentTotals: { taxPayable: string; netTotal: string; grossTotal: string; currency?: { currencyCode: string; currencyAmount?: string; exchangeRate?: string } };
  withholdingTaxList?: Array<{ withholdingTaxType: string; withholdingTaxDescription?: string; withholdingTaxAmount: string }>;
};

export type AgtRegisterInvoiceRequest = {
  schemaVersion: string;
  submissionUUID: string;
  taxRegistrationNumber: string;
  submissionTimeStamp: string;
  softwareInfo: { softwareInfoDetail: { productId: string; productVersion: string; softwareValidationNumber?: string }; jwsSoftwareSignature?: string };
  numberOfEntries: string;
  documents: AgtInvoiceDocument[];
  jwsSignature?: string;
};

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRegistarFacturaRequest(input: AgtRegisterInvoiceRequest) {
  const errors: string[] = [];
  if (!input.schemaVersion.trim()) errors.push("schemaVersion");
  if (!UUID_V4.test(input.submissionUUID)) errors.push("submissionUUID");
  if (!input.taxRegistrationNumber.trim()) errors.push("taxRegistrationNumber");
  if (!input.submissionTimeStamp.trim()) errors.push("submissionTimeStamp");
  if (!input.softwareInfo?.softwareInfoDetail?.productId) errors.push("softwareInfo.productId");
  if (!input.softwareInfo?.softwareInfoDetail?.productVersion) errors.push("softwareInfo.productVersion");
  if (!input.numberOfEntries || Number(input.numberOfEntries) !== input.documents.length) errors.push("numberOfEntries");
  input.documents.forEach((document, index) => {
    if (!document.documentNo) errors.push(`documents[${index}].documentNo`);
    if (!document.documentStatus) errors.push(`documents[${index}].documentStatus`);
    if (!document.documentDate) errors.push(`documents[${index}].documentDate`);
    if (!document.documentType) errors.push(`documents[${index}].documentType`);
    if (!document.companyName) errors.push(`documents[${index}].companyName`);
    if (!document.documentTotals) errors.push(`documents[${index}].documentTotals`);
    const receiptType = ["AR", "RC", "RG"].includes(document.documentType);
    if (!receiptType && (!document.lines || document.lines.length === 0)) errors.push(`documents[${index}].lines`);
    document.lines?.forEach((line, lineIndex) => {
      if (line.lineNumber !== String(lineIndex + 1)) errors.push(`documents[${index}].lines[${lineIndex}].lineNumber`);
      if (!line.productCode) errors.push(`documents[${index}].lines[${lineIndex}].productCode`);
      if (!line.productDescription) errors.push(`documents[${index}].lines[${lineIndex}].productDescription`);
      if (!line.quantity) errors.push(`documents[${index}].lines[${lineIndex}].quantity`);
    });
  });
  return { valid: errors.length === 0, errors };
}


export const AGT_REST_HOMOLOGATION_PATHS: Record<AgtPortalOperation, string> = {
  RegistarFactura: "/registarFactura",
  ObterEstado: "/obterEstado",
  ListarFacturas: "/listarFacturas",
  ConsultarFactura: "/consultarFactura",
  SolicitarSerie: "/solicitarSerie",
  ListarSeries: "/listarSeries",
  ValidarDocumento: "/validarDocumento",
};

export function buildAgtRestUrl(baseUrl: string, operation: AgtPortalOperation) {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${AGT_REST_HOMOLOGATION_PATHS[operation]}`;
}

export function buildAgtHeaders(input: { username: string; passwordToken: string; accept?: "application/json" | "application/xml" }) {
  if (!input.username.trim() || !input.passwordToken.trim()) throw new Error("AGT_AUTH_HEADERS_REQUIRED");
  return { Username: input.username, Password: input.passwordToken, Accept: input.accept ?? "application/json", "Content-Type": "application/json" };
}

export function buildAgtQueryRequest(input: {
  operation: Exclude<AgtPortalOperation, "RegistarFactura">;
  schemaVersion: string;
  taxRegistrationNumber: string;
  softwareInfo: AgtSoftwareInfo;
  parameters?: Record<string, string | number | undefined>;
  issuerPrivateKeyPem?: string;
}) {
  if (!input.schemaVersion.trim()) throw new Error("AGT_SCHEMA_VERSION_REQUIRED");
  if (!input.taxRegistrationNumber.trim()) throw new Error("AGT_TAX_REGISTRATION_NUMBER_REQUIRED");
  const parameters = Object.fromEntries(Object.entries(input.parameters ?? {}).filter(([, value]) => value !== undefined && value !== ""));
  const issuerSignature = buildIssuerSignature({ taxRegistrationNumber: input.taxRegistrationNumber, ...parameters }, input.issuerPrivateKeyPem);
  return { schemaVersion: input.schemaVersion, taxRegistrationNumber: input.taxRegistrationNumber, ...parameters, softwareInfo: { softwareInfoDetail: { productId: input.softwareInfo.productId, productVersion: input.softwareInfo.productVersion, ...(input.softwareInfo.softwareValidationNumber ? { softwareValidationNumber: input.softwareInfo.softwareValidationNumber } : {}) }, ...(input.softwareInfo.jwsSoftwareSignature ? { jwsSoftwareSignature: input.softwareInfo.jwsSoftwareSignature } : {}) }, ...(issuerSignature ? { jwsSignature: issuerSignature } : {}) };
}
