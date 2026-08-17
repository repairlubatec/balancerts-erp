import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as storage from "./storage";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "auditor" | "user"): TrpcContext {
  return { user: { id: 52, openId: role, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("files router", () => {
  it("registers a tenant file through storage before persisting metadata", async () => {
    vi.spyOn(storage, "storagePut").mockResolvedValue({ key: "org/1/company/2/documents/test.txt", url: "/manus-storage/org/1/company/2/documents/test.txt" });
    const asset = vi.spyOn(db, "createFileAsset").mockResolvedValue({ id: 8, storageKey: "org/1/company/2/documents/test.txt" } as never);
    const result = await appRouter.createCaller(context("admin")).files.register({ organizationId: 1, companyId: 2, filename: "test.txt", mimeType: "text/plain", dataBase64: Buffer.from("hello").toString("base64"), allowedUserIds: [52] });
    expect(result).toEqual({ id: 8, storageKey: "org/1/company/2/documents/test.txt" });
    expect(storage.storagePut).toHaveBeenCalledWith(expect.stringContaining("org/1/company/2/documents/"), expect.any(Buffer), "text/plain");
    expect(asset).toHaveBeenCalledWith(expect.objectContaining({ userId: 52, organizationId: 1, companyId: 2, storageKey: "org/1/company/2/documents/test.txt", filename: "test.txt", mimeType: "text/plain", size: 5 }));
  });

  it("returns a signed URL after ACL metadata lookup", async () => {
    vi.spyOn(db, "getFileAssetForUser").mockResolvedValue({ id: 7, storageKey: "org/1/company/2/file.pdf", filename: "file.pdf", mimeType: "application/pdf", size: 10, sha256: "a".repeat(64) } as never);
    vi.spyOn(storage, "storageGetSignedUrl").mockResolvedValue("https://signed.example/file.pdf");
    const result = await appRouter.createCaller(context("auditor")).files.downloadUrl({ companyId: 2, fileId: 7 });
    expect(result.url).toBe("https://signed.example/file.pdf");
    expect(db.getFileAssetForUser).toHaveBeenCalledWith({ userId: 52, companyId: 2, fileId: 7 });
  });

  it("rejects a user without document read permission before ACL access", async () => {
    const lookup = vi.spyOn(db, "getFileAssetForUser");
    await expect(appRouter.createCaller(context("user")).files.downloadUrl({ companyId: 2, fileId: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("rejects an authenticated reader when file ACL denies access", async () => {
    vi.spyOn(db, "getFileAssetForUser").mockRejectedValue(new Error("FILE_ACL_FORBIDDEN"));
    const signed = vi.spyOn(storage, "storageGetSignedUrl");
    await expect(appRouter.createCaller(context("auditor")).files.downloadUrl({ companyId: 2, fileId: 7 })).rejects.toThrow("FILE_ACL_FORBIDDEN");
    expect(signed).not.toHaveBeenCalled();
  });
});
