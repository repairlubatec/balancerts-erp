import { TRPCClientError } from "@trpc/client";
import { describe, expect, it } from "vitest";
import { isUnauthorizedTRPCError } from "./trpcErrors";

describe("tRPC authentication errors", () => {
  it("recognises the structured UNAUTHORIZED code", () => {
    const error = TRPCClientError.from({
      error: {
        code: -32001,
        message: "Please login (10001)",
        data: { code: "UNAUTHORIZED", httpStatus: 401 },
      },
    });

    expect(isUnauthorizedTRPCError(error)).toBe(true);
  });

  it("recognises the legacy authentication message", () => {
    const error = new TRPCClientError("Please login (10001)");
    expect(isUnauthorizedTRPCError(error)).toBe(true);
  });

  it("does not hide unrelated errors", () => {
    expect(isUnauthorizedTRPCError(new Error("Falha de validação fiscal"))).toBe(false);
  });
});
