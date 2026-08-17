import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { appendAuditEvent, getCompaniesForUser, getDocumentsForUserCompany, getPeriodsForUserCompany } from "./db";
import { validateBalancedEntry, validateDocumentTransition } from "./accounting";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  companies: router({
    list: protectedProcedure.query(({ ctx }) => getCompaniesForUser(ctx.user.id)),
    periods: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getPeriodsForUserCompany(ctx.user.id, input.companyId)),
    documents: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getDocumentsForUserCompany(ctx.user.id, input.companyId)),
  }),
  accounting: router({
    validateEntry: protectedProcedure.input(z.object({
      lines: z.array(z.object({ debit: z.number().nonnegative(), credit: z.number().nonnegative(), accountId: z.number().int().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional() })).min(2),
    })).mutation(({ input }) => validateBalancedEntry(input.lines)),
  }),
  documents: router({
    validateTransition: protectedProcedure.input(z.object({ from: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]), to: z.string() })).query(({ input }) => ({ allowed: validateDocumentTransition(input.from, input.to) })),
  }),
  audit: router({
    append: adminProcedure.input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive().nullable().optional(), action: z.string().min(1), entityType: z.string().min(1), entityId: z.string().min(1), beforeState: z.string().nullable().optional(), afterState: z.string().nullable().optional(), correlationId: z.string().min(1) })).mutation(({ ctx, input }) => appendAuditEvent({ ...input, actorUserId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
