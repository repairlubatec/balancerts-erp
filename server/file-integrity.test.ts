import { describe, expect, it } from "vitest";
import { canDownloadFile, sha256, verifyFileIntegrity } from "./file-integrity";

describe("file integrity and ACL", () => {
  it("verifies SHA-256 content integrity", () => {
    const digest = sha256("BALANCERTS");
    const file = { key: "docs/a.txt", filename: "a.txt", mimeType: "text/plain", size: 10, sha256: digest, ownerUserId: 1, allowedUserIds: [2] };
    expect(verifyFileIntegrity(file, "BALANCERTS")).toBe(true);
    expect(verifyFileIntegrity(file, "alterado")).toBe(false);
  });

  it("enforces owner and allow-list access", () => {
    const file = { key: "docs/a.txt", filename: "a.txt", mimeType: "text/plain", size: 10, sha256: sha256("x"), ownerUserId: 1, allowedUserIds: [2] };
    expect(canDownloadFile(file, 1)).toBe(true);
    expect(canDownloadFile(file, 2)).toBe(true);
    expect(canDownloadFile(file, 3)).toBe(false);
  });
});
