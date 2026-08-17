import { describe, expect, it } from "vitest";
import { hashAuditEvent, verifyAuditChain, type AuditEvent } from "./audit-chain";

describe("business audit chain", () => {
  it("verifies a valid append-only chain", () => {
    const first: AuditEvent = { id: 1, action: "ISSUE", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1" };
    const firstHash = hashAuditEvent(first);
    const second: AuditEvent = { id: 2, action: "ACCOUNT", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1", previousHash: firstHash };
    expect(verifyAuditChain([first, second], [firstHash, hashAuditEvent(second)])).toBe(true);
  });

  it("detects a broken previous hash", () => {
    const first: AuditEvent = { id: 1, action: "ISSUE", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1" };
    const second: AuditEvent = { id: 2, action: "ACCOUNT", entityType: "DOCUMENT", entityId: "FT/1", actorUserId: 1, correlationId: "c1", previousHash: "wrong" };
    expect(verifyAuditChain([first, second], [hashAuditEvent(first), hashAuditEvent(second)])).toBe(false);
  });
});
