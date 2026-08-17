import { describe, expect, it } from "vitest";
import { normativeEvidence, validateNormativeCoverage } from "./normative";

describe("Angola normative evidence", () => {
  it("resolves the Presidential Decree 71/25 evidence", () => {
    expect(normativeEvidence("DP-71-25")).toMatchObject({ title: "Decreto Presidencial n.º 71/25, de 20 de Março" });
  });

  it("does not fabricate unknown normative rules", () => {
    expect(normativeEvidence("UNKNOWN")).toBeUndefined();
  });

  it("requires the appropriate evidence set by operational area", () => {
    expect(validateNormativeCoverage({ area: "FISCAL_DOCUMENT", evidenceCodes: ["DP-71-25", "AGT-FAT-DOC"] }).valid).toBe(true);
    expect(validateNormativeCoverage({ area: "ACCOUNTING", evidenceCodes: [] })).toMatchObject({ valid: false, missing: ["PGC-AO-82-01"] });
  });
});
