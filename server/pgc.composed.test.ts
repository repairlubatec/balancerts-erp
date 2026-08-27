import { describe, expect, it } from "vitest";
import { getComposedPgcCatalogForUser } from "./pgc";

describe("catálogo composto PGCA + camadas IVA", () => {
  it("expõe a estrutura global staged e as cinco camadas IVA por vigência", async () => {
    const result = await getComposedPgcCatalogForUser({ userId: 1, organizationId: 1, versionId: 1, asOf: new Date("2026-08-26T00:00:00.000Z") });
    expect(result.baseVersion.code).toBe("PGCA-82-01");
    expect(result.accounts.length).toBeGreaterThanOrEqual(776);
    expect(result.layers).toHaveLength(5);
    expect(result.activeLayerCount).toBe(5);
    expect(result.pendingLayerCount).toBe(0);
    expect(result.accounts.some((account) => account.validationStatus === "NEEDS_NORMATIVE_VALIDATION")).toBe(false);
    expect(result.postingReady).toBe(false);
  });

  it("não aplica as camadas IVA antes das respectivas vigências", async () => {
    const result = await getComposedPgcCatalogForUser({ userId: 1, organizationId: 1, versionId: 1, asOf: new Date("2018-12-31T23:59:59.000Z") });
    expect(result.layers).toHaveLength(0);
    expect(result.activeLayerCount).toBe(0);
    expect(result.postingReady).toBe(false);
  });
});
