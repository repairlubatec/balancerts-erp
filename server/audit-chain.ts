import { createHash } from "node:crypto";

export type AuditEvent = { id: number; action: string; entityType: string; entityId: string; actorUserId: number; beforeState?: string; afterState?: string; correlationId: string; previousHash?: string };

export function hashAuditEvent(event: AuditEvent) {
  return createHash("sha256").update(JSON.stringify(event)).digest("hex");
}

export function verifyAuditChain(events: AuditEvent[], hashes: string[]) {
  if (events.length !== hashes.length) return false;
  return events.every((event, index) => hashAuditEvent(event) === hashes[index] && (index === 0 || event.previousHash === hashes[index - 1]));
}
