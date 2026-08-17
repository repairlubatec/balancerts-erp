import { createHash } from "node:crypto";

export type AuditEvent = { id: number; action: string; entityType: string; entityId: string; actorUserId: number; beforeState?: string; afterState?: string; correlationId: string; previousHash?: string };

export function hashAuditEvent(event: AuditEvent) {
  return createHash("sha256").update(JSON.stringify(event)).digest("hex");
}

export function validateAuditSnapshotShape(input: { actorUserId: number; action: string; entityType: string; entityId: string; correlationId: string; beforeState?: string | null; afterState?: string | null }) {
  if (!Number.isInteger(input.actorUserId) || input.actorUserId <= 0) throw new Error("AUDIT_ACTOR_REQUIRED");
  if (!input.action.trim() || !input.entityType.trim() || !input.entityId.trim() || !input.correlationId.trim()) throw new Error("AUDIT_METADATA_REQUIRED");
  if (input.beforeState === undefined || input.afterState === undefined) throw new Error("AUDIT_SNAPSHOTS_REQUIRED");
  return true as const;
}

export function verifyAuditChain(events: AuditEvent[], hashes: string[]) {
  if (events.length !== hashes.length) return false;
  return events.every((event, index) => hashAuditEvent(event) === hashes[index] && (index === 0 || event.previousHash === hashes[index - 1]));
}
