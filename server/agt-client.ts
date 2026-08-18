import { AGT_REST_HOMOLOGATION_PATHS, type AgtPortalOperation, buildAgtHeaders, buildAgtRestUrl, classifyAgtResponse } from "./agt-portal";

export type AgtHttpResult = {
  httpStatus: number;
  operation: AgtPortalOperation;
  url: string;
  body: unknown;
  rawBody: string;
  classification: ReturnType<typeof classifyAgtResponse>;
};

export async function callAgtPortal(input: {
  baseUrl: string;
  operation: AgtPortalOperation;
  payload: Record<string, unknown>;
  username: string;
  passwordToken: string;
  accept?: "application/json" | "application/xml";
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<AgtHttpResult> {
  const url = buildAgtRestUrl(input.baseUrl, input.operation);
  if (!url.startsWith("https://")) throw new Error("AGT_HTTPS_REQUIRED");
  const headers = buildAgtHeaders({ username: input.username, passwordToken: input.passwordToken, accept: input.accept });
  const controller = new AbortController();
  const timeoutMs = input.timeoutMs ?? 15000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await (input.fetchImpl ?? fetch)(url, { method: "POST", headers, body: JSON.stringify(input.payload), signal: controller.signal });
    const rawBody = await response.text();
    let body: unknown = rawBody;
    try { body = JSON.parse(rawBody); } catch { /* XML or plain text response */ }
    const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const documentStatus = typeof record.documentStatus === "string" ? record.documentStatus : typeof record.documentStatusCode === "string" ? record.documentStatusCode : undefined;
    const responseCode = typeof record.responseCode === "string" ? record.responseCode : typeof record.code === "string" ? record.code : undefined;
    return { httpStatus: response.status, operation: input.operation, url, body, rawBody, classification: classifyAgtResponse({ httpStatus: response.status, documentStatus, responseCode, message: typeof record.message === "string" ? record.message : undefined }) };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("AGT_REQUEST_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function getDocumentedAgtPath(operation: AgtPortalOperation) {
  return AGT_REST_HOMOLOGATION_PATHS[operation];
}
