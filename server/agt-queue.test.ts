import { describe, expect, it } from "vitest";
import { canPollAgtSubmission, classifyAgtResult, getAgtNextPollAt } from "./agt-queue";

describe("AGT persistent queue policy", () => {
  it("uses bounded backoff", () => {
    const now = new Date("2026-08-18T09:00:00Z");
    expect(getAgtNextPollAt(0, now).toISOString()).toBe("2026-08-18T09:01:00.000Z");
    expect(getAgtNextPollAt(7, now).toISOString()).toBe("2026-08-18T11:00:00.000Z");
  });

  it("stops polling after the attempt limit", () => {
    expect(canPollAgtSubmission("PROCESSING", 7)).toBe(true);
    expect(canPollAgtSubmission("PROCESSING", 8)).toBe(false);
    expect(canPollAgtSubmission("FAILED", 0)).toBe(false);
  });

  it("classifies official-style result codes conservatively", () => {
    expect(classifyAgtResult("0")).toBe("SUCCESS");
    expect(classifyAgtResult("10")).toBe("REJECTED");
    expect(classifyAgtResult("99")).toBe("RETRYABLE");
    expect(classifyAgtResult()).toBe("UNKNOWN");
  });
});
