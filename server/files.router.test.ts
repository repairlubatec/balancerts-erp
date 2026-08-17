import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as storage from "./storage";
import type { TrpcContext } from "./_core/context";

function context(role: "auditor" | "user"): TrpcContext {
  return { user: { id: 52, openId: role, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("files.downloadUrl", () => {
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
