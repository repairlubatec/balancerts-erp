import { describe, expect, it } from "vitest";
import { assertReadyConfiguration } from "./db";

describe("company operational configuration guards", () => {
  it("allows only READY companies to enter operational mutations", () => {
    expect(assertReadyConfiguration("READY")).toBe(true);
    expect(() => assertReadyConfiguration("PENDING")).toThrow("COMPANY_CONFIGURATION_PENDING");
    expect(() => assertReadyConfiguration("BLOCKED")).toThrow("COMPANY_CONFIGURATION_PENDING");
  });
});
