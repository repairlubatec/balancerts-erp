import { and, eq } from "drizzle-orm";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getDb } from "./db";
import { validateVisualPgcEvidence } from "./pgc";
import { pgcAccounts } from "../drizzle/schema";

const manifest = JSON.parse(readFileSync("docs/normative-sources/pgca-visually-confirmed-accounts.json", "utf8")) as {
  source: { sha256: string; visualReviewPages: number[] };
  accounts: Array<{ code: string; name: string; parentCode: string | null; level: number; evidencePages: number[] }>;
};
const confirmedCodes = manifest.accounts.map((account) => account.code);

describe("PGCA visual confirmation", () => {
  it("rejects visual evidence without a primary source", () => {
    expect(() => validateVisualPgcEvidence({ sourceId: null, evidencePages: [49], sourceSha256: "a".repeat(64) })).toThrow("PGC_VISUAL_SOURCE_REQUIRED");
  });

  it("rejects malformed evidence", () => {
    expect(() => validateVisualPgcEvidence({ sourceId: 1, evidencePages: [], sourceSha256: "invalid" })).toThrow("PGC_VISUAL_EVIDENCE_INVALID");
  });
  it("keeps the visually confirmed batch unique, hierarchical and literal", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    if (!db) return;

    const accounts = await db
      .select()
      .from(pgcAccounts)
      .where(and(eq(pgcAccounts.organizationId, 1), eq(pgcAccounts.versionId, 1)));
    const byCode = new Map(accounts.map((account) => [account.code, account]));

    expect(manifest.source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.source.visualReviewPages).toContain(49);
    expect(manifest.source.visualReviewPages).toContain(50);
    expect(confirmedCodes.every((code) => byCode.has(code))).toBe(true);
    expect(new Set(confirmedCodes).size).toBe(confirmedCodes.length);

    for (const expected of manifest.accounts) {
      const account = byCode.get(expected.code);
      expect(account?.validationStatus).toBe("CONFIRMED");
      expect(account?.name).toBe(expected.name);
      expect(account?.parentCode ?? null).toBe(expected.parentCode);
      expect(account?.level).toBe(expected.level);
      expect(expected.evidencePages.length).toBeGreaterThan(0);
      expect(expected.evidencePages.every((page) => manifest.source.visualReviewPages.includes(page))).toBe(true);
      if (account?.parentCode) expect(byCode.has(account.parentCode)).toBe(true);
    }
  });
});
