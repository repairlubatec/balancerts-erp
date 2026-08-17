import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { can, type BalancertsRole } from "./permissions";
import { z } from "zod";
import { appendAuditEvent, getCompaniesForUser, getDocumentsForUserCompany, getPeriodsForUserCompany, getTrialBalanceForUserCompany, postJournalEntry, reserveDocumentNumber, transitionBusinessDocument } from "./db";
import { validateBalancedEntry, validateDocumentTransition } from "./accounting";
import { calculateIva } from "./fiscal";
import { reconcileBankMovements } from "./reconciliation";
import { calculateWeightedAverage } from "./inventory";
import { calculateStraightLineDepreciation } from "./fixed-assets";

const roleProcedure = (module: string, permission: Parameters<typeof can>[2]) => protectedProcedure.use(({ ctx, next }) => {
  if (!can(ctx.user.role as BalancertsRole, module, permission)) throw new TRPCError({ code: "FORBIDDEN", message: "PERMISSION_DENIED" });
  return next();
});

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
    post: roleProcedure("accounting", "post").input(z.object({ companyId: z.number().int().positive(), periodId: z.number().int().positive(), sourceDocumentId: z.number().int().positive().optional(), idempotencyKey: z.string().min(8), description: z.string().min(1), lines: z.array(z.object({ debit: z.number().nonnegative(), credit: z.number().nonnegative(), accountId: z.number().int().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional(), currency: z.string().length(3).optional(), exchangeRate: z.number().positive().optional() })).min(2) })).mutation(({ ctx, input }) => postJournalEntry({ ...input, createdBy: ctx.user.id })),
  }),
  fiscal: router({
    calculateIva: roleProcedure("fiscal", "validate").input(z.object({ netAmount: z.number().nonnegative(), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), rule: z.object({ code: z.string().min(1), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional(), rate: z.number().nonnegative().optional(), evidence: z.string().min(1) }) })).mutation(({ input }) => calculateIva(input)),
  }),
  documents: router({
    validateTransition: protectedProcedure.input(z.object({ from: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]), to: z.string() })).query(({ input }) => ({ allowed: validateDocumentTransition(input.from, input.to) })),
    reserveNumber: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), series: z.string().min(1), documentType: z.string().min(1) })).mutation(({ ctx, input }) => reserveDocumentNumber({ ...input, userId: ctx.user.id })),
    transition: roleProcedure("documents", "issue").input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive(), to: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]) })).mutation(({ ctx, input }) => transitionBusinessDocument({ ...input, userId: ctx.user.id })),
  }),
  fixedAssets: router({
    depreciation: roleProcedure("accounting", "validate").input(z.object({ acquisitionCost: z.number().nonnegative(), residualValue: z.number().nonnegative(), usefulLifeMonths: z.number().int().positive(), elapsedMonths: z.number().int().nonnegative() })).mutation(({ input }) => calculateStraightLineDepreciation(input)),
  }),
  inventory: router({
    valuation: roleProcedure("stock", "validate").input(z.object({ movements: z.array(z.object({ type: z.enum(["IN", "OUT"]), quantity: z.number().positive(), unitCost: z.number().nonnegative() })) })).mutation(({ input }) => calculateWeightedAverage(input.movements)),
  }),
  reconciliation: router({
    bank: roleProcedure("treasury", "validate").input(z.object({ bank: z.array(z.object({ id: z.string(), reference: z.string().optional(), amount: z.number(), date: z.string() })), ledger: z.array(z.object({ id: z.string(), reference: z.string().optional(), amount: z.number(), date: z.string() })), tolerance: z.number().nonnegative().optional() })).mutation(({ input }) => reconcileBankMovements(input.bank, input.ledger, input.tolerance)),
  }),
  reports: router({
    trialBalance: protectedProcedure.input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getTrialBalanceForUserCompany(ctx.user.id, input.companyId)),
  }),
  audit: router({
    append: adminProcedure.input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive().nullable().optional(), action: z.string().min(1), entityType: z.string().min(1), entityId: z.string().min(1), beforeState: z.string().nullable().optional(), afterState: z.string().nullable().optional(), correlationId: z.string().min(1) })).mutation(({ ctx, input }) => appendAuditEvent({ ...input, actorUserId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
