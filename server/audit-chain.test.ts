import { describe, expect, it } from "vitest";
import { hashAuditEvent, validateAuditSnapshotShape, verifyAuditChain, type AuditEvent } from "./audit-chain";

describe("business audit chain", () => {
  it("verifies a valid append-only chain", () => {
    const first: AuditEvent = { id: 1, action: "ISSUE", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1" };
    const firstHash = hashAuditEvent(first);
    const second: AuditEvent = { id: 2, action: "ACCOUNT", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1", previousHash: firstHash };
    expect(verifyAuditChain([first, second], [firstHash, hashAuditEvent(second)])).toBe(true);
  });

  it("requires explicit audit metadata and snapshot keys", () => {
    expect(validateAuditSnapshotShape({ actorUserId: 4, action: "CREATE", entityType: "company", entityId: "1", correlationId: "c1", beforeState: null, afterState: JSON.stringify({ status: "PENDING" }) })).toBe(true);
    expect(() => validateAuditSnapshotShape({ actorUserId: 4, action: "CREATE", entityType: "company", entityId: "1", correlationId: "c1" })).toThrow("AUDIT_SNAPSHOTS_REQUIRED");
    expect(() => validateAuditSnapshotShape({ actorUserId: 0, action: "CREATE", entityType: "company", entityId: "1", correlationId: "c1", beforeState: null, afterState: null })).toThrow("AUDIT_ACTOR_REQUIRED");
  });

  it("detects a broken previous hash", () => {
    const first: AuditEvent = { id: 1, action: "ISSUE", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1" };
    const second: AuditEvent = { id: 2, action: "ACCOUNT", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1", previousHash: "wrong" };
    expect(verifyAuditChain([first, second], [hashAuditEvent(first), hashAuditEvent(second)])).toBe(false);
  });
});
