import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normativeBatches } from "../client/src/data/normativeBatches";

type ManifestBatch = {
  batchId: string;
  domain: "PGCA" | "IVA";
  scope: string;
  count: number;
  confirmed: number;
};

describe("catálogo de lotes normativos da interface", () => {
  it("mantém os metadados da interface iguais ao manifesto oficial", () => {
    const manifest = JSON.parse(readFileSync("docs/normative-human-confirmation-batches.json", "utf8")) as { batches: ManifestBatch[] };
    const expected = manifest.batches.map(({ batchId, domain, scope, count, confirmed }) => ({ batchId, domain, scope, count, confirmed }));
    expect(normativeBatches).toEqual(expected);
    expect(normativeBatches).toHaveLength(17);
  });
});
