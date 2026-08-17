import { createHash } from "node:crypto";

export type FileMetadata = { key: string; filename: string; mimeType: string; size: number; sha256: string; ownerUserId: number; allowedUserIds: number[] };

export function sha256(data: string | Uint8Array) {
  return createHash("sha256").update(data).digest("hex");
}

export function canDownloadFile(file: FileMetadata, userId: number) {
  return file.ownerUserId === userId || file.allowedUserIds.includes(userId);
}

export function verifyFileIntegrity(file: FileMetadata, data: string | Uint8Array) {
  return sha256(data) === file.sha256;
}
