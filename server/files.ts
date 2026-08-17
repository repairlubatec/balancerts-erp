import { sha256, type FileMetadata } from "./file-integrity";

export function prepareTenantFile(input: { organizationId: number; companyId: number; userId: number; filename: string; mimeType: string; data: string | Uint8Array; allowedUserIds?: number[] }): FileMetadata {
  if (!input.filename.trim() || !input.mimeType.trim()) throw new Error("INVALID_FILE_METADATA");
  const key = `org/${input.organizationId}/company/${input.companyId}/documents/${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const size = typeof input.data === "string" ? Buffer.byteLength(input.data) : input.data.byteLength;
  return { key, filename: input.filename, mimeType: input.mimeType, size, sha256: sha256(input.data), ownerUserId: input.userId, allowedUserIds: input.allowedUserIds ?? [] };
}
