import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "./db";
import { pgcAccounts } from "../drizzle/schema";

const confirmedCodes = ["4", "45", "451", "4511", "6", "61", "613", "6131"];

describe("PGCA visual confirmation", () => {
  it("keeps the visually confirmed batch unique, hierarchical and literal", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    if (!db) return;

    const accounts = await db
      .select()
      .from(pgcAccounts)
      .where(and(eq(pgcAccounts.organizationId, 1), eq(pgcAccounts.versionId, 1)));
    const byCode = new Map(accounts.map((account) => [account.code, account]));

    expect(confirmedCodes.every((code) => byCode.has(code))).toBe(true);
    expect(new Set(confirmedCodes).size).toBe(confirmedCodes.length);

    for (const code of confirmedCodes) {
      const account = byCode.get(code);
      expect(account?.validationStatus).toBe("CONFIRMED");
      if (account?.parentCode) {
        expect(byCode.has(account.parentCode)).toBe(true);
        expect(account.level).toBe(account.parentCode.length + 1);
      } else {
        expect(account?.level).toBe(1);
      }
    }

    expect(byCode.get("4511")?.name).toBe("Caixa");
    expect(byCode.get("6131")?.name).toBe("Mercado nacional");
  });
});
