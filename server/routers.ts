import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { can, type BalancertsRole } from "./permissions";
import { z } from "zod";
import { appendAuditEvent, getAuditEventsForUserCompany, getBalanceSheetForUserCompany, getCompaniesForUser, getDocumentAccountingChainForUserCompany, getDocumentsForUserCompany, getIncomeStatementForUserCompany, getJournalDocumentChainForUserCompany, getJournalForUserCompany, getLedgerForUserCompany, getPeriodsForUserCompany, getTrialBalanceForUserCompany, getVatSummaryForUserCompany, postJournalEntry, reconcileStockForUserCompany, reserveDocumentNumber, transitionBusinessDocument } from "./db";
import { validateBalancedEntry, validateDocumentTransition } from "./accounting";
import { calculateIva } from "./fiscal";
import { reconcileBankMovements } from "./reconciliation";
import { calculateWeightedAverage } from "./inventory";
import { calculateStraightLineDepreciation } from "./fixed-assets";
import { buildDepreciationPosting } from "./fixed-assets-posting";
import { buildReopenAudit, evaluatePeriodClose, validateReopenReason } from "./closing";
import { convertToFunctionalCurrency } from "./currency";
import { buildReversalLines, reversalDescription } from "./reversal";
import { createFileAsset, getFileAssetForUser, recordStockMovement } from "./db";
import { prepareTenantFile } from "./files";
import { storageGetSignedUrl, storagePut } from "./storage";

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
    list: roleProcedure("companies", "read").query(({ ctx }) => getCompaniesForUser(ctx.user.id)),
    periods: roleProcedure("companies", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getPeriodsForUserCompany(ctx.user.id, input.companyId)),
    documents: roleProcedure("documents", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getDocumentsForUserCompany(ctx.user.id, input.companyId)),
  }),
  accounting: router({
    validateEntry: roleProcedure("accounting", "validate").input(z.object({
      lines: z.array(z.object({ debit: z.number().nonnegative(), credit: z.number().nonnegative(), accountId: z.number().int().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional() })).min(2),
    })).mutation(({ input }) => validateBalancedEntry(input.lines)),
    post: roleProcedure("accounting", "post").input(z.object({ companyId: z.number().int().positive(), periodId: z.number().int().positive(), sourceDocumentId: z.number().int().positive().optional(), idempotencyKey: z.string().min(8), description: z.string().min(1), lines: z.array(z.object({ debit: z.number().nonnegative(), credit: z.number().nonnegative(), accountId: z.number().int().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional(), currency: z.string().length(3).optional(), exchangeRate: z.number().positive().optional() })).min(2) })).mutation(({ ctx, input }) => postJournalEntry({ ...input, createdBy: ctx.user.id })),
  }),
  fiscal: router({
    calculateIva: roleProcedure("fiscal", "validate").input(z.object({ netAmount: z.number().nonnegative(), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), rule: z.object({ code: z.string().min(1), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional(), rate: z.number().nonnegative().optional(), evidence: z.string().min(1) }) })).mutation(({ input }) => calculateIva(input)),
  }),
  documents: router({
    validateTransition: roleProcedure("documents", "validate").input(z.object({ from: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]), to: z.string() })).query(({ input }) => ({ allowed: validateDocumentTransition(input.from, input.to) })),
    reserveNumber: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), series: z.string().min(1), documentType: z.string().min(1) })).mutation(({ ctx, input }) => reserveDocumentNumber({ ...input, userId: ctx.user.id })),
    transition: roleProcedure("documents", "issue").input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive(), to: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]) })).mutation(({ ctx, input }) => transitionBusinessDocument({ ...input, userId: ctx.user.id })),
  }),
  files: router({
    register: roleProcedure("documents", "create").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), filename: z.string().min(1), mimeType: z.string().min(1), dataBase64: z.string().min(1), allowedUserIds: z.array(z.number().int().positive()).optional() })).mutation(async ({ ctx, input }) => {
      const data = Buffer.from(input.dataBase64, "base64");
      const prepared = prepareTenantFile({ ...input, userId: ctx.user.id, data });
      const uploaded = await storagePut(prepared.key, data, prepared.mimeType);
      return createFileAsset({ ...prepared, userId: ctx.user.id, organizationId: input.organizationId, companyId: input.companyId, storageKey: uploaded.key });
    }),
    metadata: roleProcedure("documents", "read").input(z.object({ companyId: z.number().int().positive(), fileId: z.number().int().positive() })).query(({ ctx, input }) => getFileAssetForUser({ ...input, userId: ctx.user.id })),
    downloadUrl: roleProcedure("documents", "read").input(z.object({ companyId: z.number().int().positive(), fileId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const file = await getFileAssetForUser({ ...input, userId: ctx.user.id });
      return { ...file, url: await storageGetSignedUrl(file.storageKey) };
    }),
  }),
  reversal: router({
    preview: roleProcedure("accounting", "reverse").input(z.object({ originalEntryId: z.number().int().positive(), reason: z.string().min(1), lines: z.array(z.object({ accountId: z.number().int().positive(), debit: z.number().nonnegative(), credit: z.number().nonnegative(), currency: z.string().length(3), exchangeRate: z.number().positive() })) })).mutation(({ input }) => ({ description: reversalDescription(input.originalEntryId, input.reason), lines: buildReversalLines(input.lines) })),
    post: roleProcedure("accounting", "reverse").input(z.object({ companyId: z.number().int().positive(), periodId: z.number().int().positive(), originalEntryId: z.number().int().positive(), reason: z.string().min(1), idempotencyKey: z.string().min(8), lines: z.array(z.object({ accountId: z.number().int().positive(), debit: z.number().nonnegative(), credit: z.number().nonnegative(), currency: z.string().length(3), exchangeRate: z.number().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional() })).min(2) })).mutation(({ ctx, input }) => postJournalEntry({ companyId: input.companyId, periodId: input.periodId, idempotencyKey: input.idempotencyKey, description: reversalDescription(input.originalEntryId, input.reason), sourceDocumentId: undefined, createdBy: ctx.user.id, lines: buildReversalLines(input.lines).map((line) => ({ ...line, postable: true, validFrom: new Date() })) })),
  }),
  currency: router({
    convert: roleProcedure("accounting", "create").input(z.object({ amount: z.number().nonnegative(), operationCurrency: z.string().length(3), functionalCurrency: z.string().length(3), quote: z.object({ from: z.string().length(3), to: z.string().length(3), rate: z.number().positive(), source: z.string().min(1), date: z.string().min(1) }) })).mutation(({ input }) => convertToFunctionalCurrency(input.amount, input.operationCurrency, input.functionalCurrency, input.quote)),
  }),
  closing: router({
    evaluate: roleProcedure("close", "close").input(z.object({ checks: z.array(z.object({ code: z.string(), label: z.string(), passed: z.boolean(), blocking: z.boolean() })) })).mutation(({ input }) => evaluatePeriodClose(input.checks)),
    validateReopen: roleProcedure("close", "reopen").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), periodId: z.number().int().positive(), reason: z.string().optional(), correlationId: z.string().min(1) })).mutation(async ({ ctx, input }) => { const reason = validateReopenReason(input.reason); const audit = buildReopenAudit({ ...input, actorUserId: ctx.user.id, reason }); await appendAuditEvent(audit); return { reason, audited: true }; }),
  }),
  fixedAssets: router({
    depreciation: roleProcedure("accounting", "validate").input(z.object({ acquisitionCost: z.number().nonnegative(), residualValue: z.number().nonnegative(), usefulLifeMonths: z.number().int().positive(), elapsedMonths: z.number().int().nonnegative() })).mutation(({ input }) => calculateStraightLineDepreciation(input)),
    postDepreciation: roleProcedure("accounting", "post").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), periodId: z.number().int().positive(), assetId: z.number().int().positive(), amount: z.number().positive(), expenseAccountId: z.number().int().positive(), accumulatedDepreciationAccountId: z.number().int().positive(), correlationId: z.string().min(1) })).mutation(async ({ ctx, input }) => { const posting = buildDepreciationPosting({ ...input, depreciationAmount: input.amount }); const entry = await postJournalEntry({ companyId: input.companyId, periodId: input.periodId, idempotencyKey: input.correlationId, description: `Depreciação do imobilizado ${input.assetId}`, createdBy: ctx.user.id, lines: posting.lines.map((line) => ({ ...line, postable: true, validFrom: new Date() })) }); await appendAuditEvent({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: ctx.user.id, action: "FIXED_ASSET_DEPRECIATION_POST", entityType: "FIXED_ASSET", entityId: String(input.assetId), afterState: "POSTED", correlationId: input.correlationId }); return { posting, entry, audited: true }; }),
  }),
  inventory: router({
    valuation: roleProcedure("stock", "validate").input(z.object({ movements: z.array(z.object({ type: z.enum(["IN", "OUT"]), quantity: z.number().positive(), unitCost: z.number().nonnegative() })) })).mutation(({ input }) => calculateWeightedAverage(input.movements)),
    record: roleProcedure("stock", "create").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), periodId: z.number().int().positive(), productCode: z.string().min(1), type: z.enum(["IN", "OUT"]), quantity: z.number().positive(), unitCost: z.number().nonnegative(), sourceDocumentId: z.number().int().positive().optional(), journalEntryId: z.number().int().positive().optional(), correlationId: z.string().min(1) })).mutation(({ ctx, input }) => recordStockMovement({ ...input, userId: ctx.user.id })),
    reconcile: roleProcedure("stock", "validate").input(z.object({ companyId: z.number().int().positive(), inventoryAccountId: z.number().int().positive() })).query(({ ctx, input }) => reconcileStockForUserCompany({ ...input, userId: ctx.user.id })),
  }),
  reconciliation: router({
    bank: roleProcedure("treasury", "validate").input(z.object({ bank: z.array(z.object({ id: z.string(), reference: z.string().optional(), amount: z.number(), date: z.string() })), ledger: z.array(z.object({ id: z.string(), reference: z.string().optional(), amount: z.number(), date: z.string() })), tolerance: z.number().nonnegative().optional() })).mutation(({ input }) => reconcileBankMovements(input.bank, input.ledger, input.tolerance)),
  }),
  reports: router({
    trialBalance: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getTrialBalanceForUserCompany(ctx.user.id, input.companyId)),
    journal: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getJournalForUserCompany(ctx.user.id, input.companyId)),
    ledger: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), accountCode: z.string().min(1).optional() })).query(({ ctx, input }) => getLedgerForUserCompany(ctx.user.id, input.companyId, input.accountCode)),
    incomeStatement: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getIncomeStatementForUserCompany(ctx.user.id, input.companyId)),
    balanceSheet: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getBalanceSheetForUserCompany(ctx.user.id, input.companyId)),
    documentChain: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() })).query(({ ctx, input }) => getDocumentAccountingChainForUserCompany(ctx.user.id, input.companyId, input.documentId)),
    entryChain: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), entryId: z.number().int().positive() })).query(({ ctx, input }) => getJournalDocumentChainForUserCompany(ctx.user.id, input.companyId, input.entryId)),
    vatSummary: roleProcedure("fiscal", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getVatSummaryForUserCompany(ctx.user.id, input.companyId)),
  }),
  audit: router({
    list: roleProcedure("audit", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getAuditEventsForUserCompany(ctx.user.id, input.companyId)),
    append: adminProcedure.input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive().nullable().optional(), action: z.string().min(1), entityType: z.string().min(1), entityId: z.string().min(1), beforeState: z.string().nullable().optional(), afterState: z.string().nullable().optional(), correlationId: z.string().min(1) })).mutation(({ ctx, input }) => appendAuditEvent({ ...input, actorUserId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
