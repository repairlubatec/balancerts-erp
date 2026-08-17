import { describe, expect, it } from "vitest";
import { normativeEvidence } from "./normative";

describe("Angola normative evidence", () => {
  it("resolves the Presidential Decree 71/25 evidence", () => {
    expect(normativeEvidence("DP-71-25")).toMatchObject({ title: "Decreto Presidencial n.º 71/25, de 20 de Março" });
  });

  it("does not fabricate unknown normative rules", () => {
    expect(normativeEvidence("UNKNOWN")).toBeUndefined();
  });
});
