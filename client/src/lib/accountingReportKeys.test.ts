import { describe, expect, it } from "vitest";
import { trialBalanceRowKey } from "./accountingReportKeys";

describe("trialBalanceRowKey", () => {
  it("mantém chaves únicas quando o mesmo código de conta aparece em várias linhas", () => {
    const rows = [
      { accountCode: "3420001", accountName: "Conta 3420001" },
      { accountCode: "3420001", accountName: "Conta 3420001" },
    ];
    const keys = rows.map((row, index) => trialBalanceRowKey(row, index));
    expect(new Set(keys).size).toBe(rows.length);
    expect(keys).toEqual(["3420001-Conta 3420001-0", "3420001-Conta 3420001-1"]);
  });
});
