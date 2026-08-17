import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextWithRole(role: "financeiro" | "contabilista"): TrpcContext {
  return {
    user: { id: 8, openId: `test-${role}`, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("protected accounting procedures", () => {
  it("rejects direct API posting for Financeiro", async () => {
    const caller = appRouter.createCaller(contextWithRole("financeiro"));
    await expect(caller.accounting.post({
      companyId: 1,
      periodId: 1,
      idempotencyKey: "permission-test-1",
      description: "Teste",
      lines: [
        { accountId: 1, debit: 100, credit: 0, postable: true, validFrom: new Date("2020-01-01") },
        { accountId: 2, debit: 0, credit: 100, postable: true, validFrom: new Date("2020-01-01") },
      ],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
