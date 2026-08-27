import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("validate-pgca-plan", () => {
  it("percorre classes/accounts do plano hierárquico sem inventar naturezas", () => {
    const source = path.resolve("docs/normative-sources/pgc-angola-main-2025/pgc_chart_of_accounts.json");
    const output = path.join(os.tmpdir(), `pgca-validation-${process.pid}.json`);
    try {
      execFileSync(process.execPath, ["scripts/validate-pgca-plan.mjs", source, "--output", output], { stdio: "ignore" });
      const result = JSON.parse(fs.readFileSync(output, "utf8"));
      expect(result.accountCount).toBe(776);
      expect(result.errorCount).toBe(0);
      expect(result.activationEligible).toBe(false);
      expect(result.decision).toBe("REVISÃO_HUMANA");
      expect(result.warnings.some((warning) => warning.code === "ACCOUNT_NATURE_INVALID")).toBe(true);
    } finally {
      fs.rmSync(output, { force: true });
    }
  });
});
