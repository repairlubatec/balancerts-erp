import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";

export function isUnauthorizedTRPCError(error: unknown) {
  if (!(error instanceof TRPCClientError)) return false;
  return error.data?.code === "UNAUTHORIZED" || error.message === UNAUTHED_ERR_MSG;
}
