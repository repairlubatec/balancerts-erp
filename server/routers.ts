import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { can, type BalancertsRole } from "./permissions";
import { z } from "zod";
import { activateCompanyForUser, appendAuditEvent, appendAuditEventForUser, assertAuditScopeForUser, assertClosedFiscalPeriodForUserCompany, createCompanyForUser, getAuditEventsForUserCompany, getExercisesForUserCompany, getBalanceSheetForUserCompany, getCompaniesForUser, getDocumentAccountingChainForUserCompany, getDocumentOriginReconciliationForUserCompany, getDocumentsForUserCompany, getFiscalRegisterForUserCompany, getAgingForUserCompany, getIncomeStatementForUserCompany, getJournalDocumentChainForUserCompany, getJournalForUserCompany, getLedgerForUserCompany, getPeriodsForUserCompany, getReportTraceForUserCompany, getReportsReconciliationForUserCompany, getSaftReadinessForUserCompany, getTrialBalanceForUserCompany, getVatSummaryForUserCompany, postJournalEntry, reconcileStockForUserCompany, reserveDocumentNumber, transitionBusinessDocument, createDraftBusinessDocumentForUser, updateCounterpartyForUser, updateDocumentItemForUser, updateDocumentTaxForUser, archiveBusinessDocumentForUser, updatePaymentForUser, getCounterpartiesForUserCompany, createCounterpartyForUser, getProductsForUserCompany, createProductForUser, getCashAccountsForUserCompany, createCashAccountForUser, getTreasuryTransactionsForUserCompany, createPaymentForUser, getNormativeRulesForUserCompany } from "./db";
import { validateBalancedEntry, validateDocumentTransition } from "./accounting";
import { calculateIva } from "./fiscal";
import { reconcileBankMovements } from "./reconciliation";
import { calculateWeightedAverage } from "./inventory";
import { calculateStraightLineDepreciation } from "./fixed-assets";
import { buildDepreciationAudit, buildDepreciationPosting } from "./fixed-assets-posting";
import { buildReopenAudit, evaluatePeriodClose, validateReopenReason } from "./closing";
import { buildDecree71Coverage, validateNormativeCoverage } from "./normative";
import { convertToFunctionalCurrency } from "./currency";
import { buildReversalLines, reversalDescription } from "./reversal";
import { createFileAsset, getFileAssetForUser, recordStockMovement } from "./db";
import { prepareTenantFile } from "./files";
import { storageGetSignedUrl, storagePut } from "./storage";
import { buildAgtComplianceCalendar, validateAgtFiscalRecord } from "./tax-compliance";

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
    activate: roleProcedure("companies", "create").input(z.object({ companyId: z.number().int().positive(), confirmation: z.literal("ACTIVATE_COMPANY") })).mutation(async ({ ctx, input }) => {
      try {
        return await activateCompanyForUser({ ...input, userId: ctx.user.id });
      } catch (error) {
        if (error instanceof Error && error.message === "ACTIVATION_CONFIRMATION_REQUIRED") throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        if (error instanceof Error && error.message === "COMPANY_CONFIGURATION_INCOMPLETE") throw new TRPCError({ code: "PRECONDITION_FAILED", message: error.message });
        throw error;
      }
    }),
    create: roleProcedure("companies", "create").input(z.object({ name: z.string().min(2), nif: z.string().min(5), functionalCurrency: z.string().length(3).default("AOA"), ivaRegime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), legalForm: z.string().min(2), address: z.string().min(3), municipality: z.string().min(2), province: z.string().min(2), phone: z.string().min(5), email: z.string().email(), activity: z.string().min(2), incorporationYear: z.number().int().min(1900).max(new Date().getFullYear()), legalRepresentatives: z.string().min(3) })).mutation(async ({ ctx, input }) => {
      try {
        return await createCompanyForUser({ ...input, userId: ctx.user.id });
      } catch (error) {
        if (error instanceof Error && error.message === "ORGANIZATION_REQUIRED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "ORGANIZATION_REQUIRED" });
        throw error;
      }
    }),
    exercises: roleProcedure("companies", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getExercisesForUserCompany(ctx.user.id, input.companyId)),
    periods: roleProcedure("companies", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getPeriodsForUserCompany(ctx.user.id, input.companyId)),
    documents: roleProcedure("documents", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getDocumentsForUserCompany(ctx.user.id, input.companyId)),
  }),
  counterparties: router({
    list: roleProcedure("customers", "read").input(z.object({ companyId: z.number().int().positive(), kind: z.enum(["CUSTOMER", "SUPPLIER"]).optional() })).query(({ ctx, input }) => getCounterpartiesForUserCompany(ctx.user.id, input.companyId, input.kind)),
    update: roleProcedure("customers", "create").input(z.object({ companyId: z.number().int().positive(), counterpartyId: z.number().int().positive(), name: z.string().min(2).optional(), email: z.string().email().optional(), phone: z.string().optional(), address: z.string().optional() })).mutation(({ ctx, input }) => updateCounterpartyForUser({ ...input, userId: ctx.user.id })),
    create: roleProcedure("customers", "create").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), kind: z.enum(["CUSTOMER", "SUPPLIER"]), taxId: z.string().optional(), name: z.string().min(2), email: z.string().email().optional(), phone: z.string().optional(), address: z.string().optional(), municipality: z.string().optional(), province: z.string().optional() })).mutation(({ ctx, input }) => createCounterpartyForUser({ ...input, userId: ctx.user.id })),
  }),
  catalog: router({
    list: roleProcedure("catalog", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getProductsForUserCompany(ctx.user.id, input.companyId)),
    create: roleProcedure("catalog", "create").input(z.object({ companyId: z.number().int().positive(), code: z.string().min(1), name: z.string().min(2), kind: z.enum(["GOOD", "SERVICE"]), unitCode: z.string().optional(), taxCode: z.string().optional() })).mutation(({ ctx, input }) => createProductForUser({ ...input, userId: ctx.user.id })),
  }),
  treasury: router({
    accounts: roleProcedure("treasury", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getCashAccountsForUserCompany(ctx.user.id, input.companyId)),
    createAccount: roleProcedure("treasury", "create").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), name: z.string().min(2), kind: z.enum(["CASH", "BANK"]), accountNumber: z.string().optional(), currency: z.string().length(3).optional() })).mutation(({ ctx, input }) => createCashAccountForUser({ ...input, userId: ctx.user.id })),
    transactions: roleProcedure("treasury", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getTreasuryTransactionsForUserCompany(ctx.user.id, input.companyId)),
    createPayment: roleProcedure("treasury", "create").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), documentId: z.number().int().positive().optional(), direction: z.enum(["RECEIPT", "PAYMENT"]), amount: z.number().positive(), currency: z.string().length(3).optional(), cashAccountId: z.number().int().positive().optional(), paidAt: z.coerce.date(), method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]), idempotencyKey: z.string().min(8), correlationId: z.string().min(1) })).mutation(({ ctx, input }) => createPaymentForUser({ ...input, userId: ctx.user.id })),
    updatePayment: roleProcedure("treasury", "create").input(z.object({ companyId: z.number().int().positive(), paymentId: z.number().int().positive(), amount: z.number().positive().optional(), method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]).optional(), status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional() })).mutation(({ ctx, input }) => updatePaymentForUser({ ...input, userId: ctx.user.id })),
  }),
  normative: router({
    list: roleProcedure("normative", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getNormativeRulesForUserCompany(ctx.user.id, input.companyId)),
    coverage: roleProcedure("normative", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => { void ctx; void input; return buildDecree71Coverage({}); }),
  }),
  accounting: router({
    validateEntry: roleProcedure("accounting", "validate").input(z.object({
      lines: z.array(z.object({ debit: z.number().nonnegative(), credit: z.number().nonnegative(), accountId: z.number().int().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional() })).min(2),
    })).mutation(({ input }) => validateBalancedEntry(input.lines)),
    post: roleProcedure("accounting", "post").input(z.object({ companyId: z.number().int().positive(), periodId: z.number().int().positive(), sourceDocumentId: z.number().int().positive().optional(), idempotencyKey: z.string().min(8), description: z.string().min(1), lines: z.array(z.object({ debit: z.number().nonnegative(), credit: z.number().nonnegative(), accountId: z.number().int().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional(), currency: z.string().length(3).optional(), exchangeRate: z.number().positive().optional() })).min(2) })).mutation(({ ctx, input }) => postJournalEntry({ ...input, createdBy: ctx.user.id })),
  }),
  fiscal: router({
    calculateIva: roleProcedure("fiscal", "validate").input(z.object({ netAmount: z.number().nonnegative(), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), rule: z.object({ code: z.string().min(1), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional(), rate: z.number().nonnegative().optional(), evidence: z.string().min(1) }) })).mutation(({ input }) => calculateIva(input)),
    validateNormative: roleProcedure("fiscal", "validate").input(z.object({ area: z.enum(["FISCAL_DOCUMENT", "ACCOUNTING"]), evidenceCodes: z.array(z.string().min(1)) })).query(({ input }) => validateNormativeCoverage(input)),
    complianceCalendar: roleProcedure("fiscal", "read").input(z.object({ year: z.number().int().min(2025).max(2100), regime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]).optional() })).query(({ input }) => buildAgtComplianceCalendar(input)),
  }),
  documents: router({
    validateTransition: roleProcedure("documents", "validate").input(z.object({ from: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]), to: z.string() })).query(({ input }) => ({ allowed: validateDocumentTransition(input.from, input.to) })),
    reserveNumber: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), series: z.string().min(1), documentType: z.string().min(1) })).mutation(({ ctx, input }) => reserveDocumentNumber({ ...input, userId: ctx.user.id })),
    createDraft: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), series: z.string().min(1), documentType: z.string().min(1), counterpartyId: z.number().int().positive(), counterpartyType: z.enum(["CUSTOMER", "SUPPLIER"]), ivaRegime: z.enum(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]), currency: z.string().length(3).optional(), dueDate: z.coerce.date().optional(), correctsDocumentId: z.number().int().positive().optional(), normativeRuleId: z.number().int().positive().optional(), items: z.array(z.object({ productId: z.number().int().positive().optional(), description: z.string().min(1), quantity: z.number().positive(), unitPrice: z.number().nonnegative(), netAmount: z.number().nonnegative(), taxAmount: z.number().nonnegative(), totalAmount: z.number().nonnegative(), taxType: z.string().optional(), taxRate: z.number().nonnegative().optional() })).min(1) })).mutation(({ ctx, input }) => createDraftBusinessDocumentForUser({ ...input, userId: ctx.user.id })),
    updateItem: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), itemId: z.number().int().positive(), description: z.string().optional(), quantity: z.number().positive().optional(), unitPrice: z.number().nonnegative().optional(), netAmount: z.number().nonnegative().optional(), taxAmount: z.number().nonnegative().optional(), totalAmount: z.number().nonnegative().optional() })).mutation(({ ctx, input }) => updateDocumentItemForUser({ ...input, userId: ctx.user.id })),
    updateTax: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), taxId: z.number().int().positive(), rate: z.number().nonnegative().optional(), baseAmount: z.number().nonnegative().optional(), taxAmount: z.number().nonnegative().optional() })).mutation(({ ctx, input }) => updateDocumentTaxForUser({ ...input, userId: ctx.user.id })),
    archive: roleProcedure("documents", "create").input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() })).mutation(({ ctx, input }) => archiveBusinessDocumentForUser({ ...input, userId: ctx.user.id })),
    transition: roleProcedure("documents", "issue").input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive(), to: z.enum(["DRAFT", "VALIDATED", "ISSUED", "ACCOUNTED", "CANCELLED"]), cancellationReason: z.string().min(3).optional(), correlationId: z.string().min(8).optional() })).mutation(({ ctx, input }) => transitionBusinessDocument({ ...input, userId: ctx.user.id })),
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
    post: roleProcedure("accounting", "reverse").input(z.object({ companyId: z.number().int().positive(), periodId: z.number().int().positive(), originalEntryId: z.number().int().positive(), reason: z.string().min(1), idempotencyKey: z.string().min(8), lines: z.array(z.object({ accountId: z.number().int().positive(), debit: z.number().nonnegative(), credit: z.number().nonnegative(), currency: z.string().length(3), exchangeRate: z.number().positive(), postable: z.boolean(), validFrom: z.coerce.date(), validTo: z.coerce.date().nullable().optional() })).min(2) })).mutation(({ ctx, input }) => postJournalEntry({ companyId: input.companyId, periodId: input.periodId, reversalOfEntryId: input.originalEntryId, idempotencyKey: input.idempotencyKey, description: reversalDescription(input.originalEntryId, input.reason), sourceDocumentId: undefined, createdBy: ctx.user.id, lines: buildReversalLines(input.lines).map((line) => ({ ...line, postable: true, validFrom: new Date() })) })),
  }),
  currency: router({
    convert: roleProcedure("accounting", "create").input(z.object({ amount: z.number().nonnegative(), operationCurrency: z.string().length(3), functionalCurrency: z.string().length(3), quote: z.object({ from: z.string().length(3), to: z.string().length(3), rate: z.number().positive(), source: z.string().min(1), date: z.string().min(1) }) })).mutation(({ input }) => convertToFunctionalCurrency(input.amount, input.operationCurrency, input.functionalCurrency, input.quote)),
  }),
  closing: router({
    evaluate: roleProcedure("close", "close").input(z.object({ checks: z.array(z.object({ code: z.string(), label: z.string(), passed: z.boolean(), blocking: z.boolean() })) })).mutation(({ input }) => evaluatePeriodClose(input.checks)),
    validateReopen: roleProcedure("close", "reopen").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), periodId: z.number().int().positive(), reason: z.string().optional(), correlationId: z.string().min(1) })).mutation(async ({ ctx, input }) => { const reason = validateReopenReason(input.reason); await assertAuditScopeForUser({ actorUserId: ctx.user.id, organizationId: input.organizationId, companyId: input.companyId }); await assertClosedFiscalPeriodForUserCompany({ actorUserId: ctx.user.id, companyId: input.companyId, periodId: input.periodId }); const audit = buildReopenAudit({ ...input, actorUserId: ctx.user.id, reason }); await appendAuditEventForUser({ ...audit, actorUserId: ctx.user.id }); return { reason, audited: true }; }),
  }),
  fixedAssets: router({
    depreciation: roleProcedure("accounting", "validate").input(z.object({ acquisitionCost: z.number().nonnegative(), residualValue: z.number().nonnegative(), usefulLifeMonths: z.number().int().positive(), elapsedMonths: z.number().int().nonnegative() })).mutation(({ input }) => calculateStraightLineDepreciation(input)),
    postDepreciation: roleProcedure("accounting", "post").input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive(), periodId: z.number().int().positive(), assetId: z.number().int().positive(), amount: z.number().positive(), expenseAccountId: z.number().int().positive(), accumulatedDepreciationAccountId: z.number().int().positive(), correlationId: z.string().min(1) })).mutation(async ({ ctx, input }) => { await assertAuditScopeForUser({ actorUserId: ctx.user.id, organizationId: input.organizationId, companyId: input.companyId }); const posting = buildDepreciationPosting({ ...input, depreciationAmount: input.amount }); const entry = await postJournalEntry({ companyId: input.companyId, periodId: input.periodId, idempotencyKey: input.correlationId, description: `Depreciação do imobilizado ${input.assetId}`, createdBy: ctx.user.id, lines: posting.lines.map((line) => ({ ...line, postable: true, validFrom: new Date() })) }); await appendAuditEventForUser(buildDepreciationAudit({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: ctx.user.id, assetId: input.assetId, amount: input.amount, entryId: Number(entry.entryId), correlationId: input.correlationId })); return { posting, entry, audited: true }; }),
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
    reconciliation: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getReportsReconciliationForUserCompany(ctx.user.id, input.companyId)),
    documentOriginReconciliation: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getDocumentOriginReconciliationForUserCompany(ctx.user.id, input.companyId)),
    saftReadiness: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getSaftReadinessForUserCompany(ctx.user.id, input.companyId)),
    saftExport: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const readiness = await getSaftReadinessForUserCompany(ctx.user.id, input.companyId);
      if (!readiness.submissionEligible) return { namespace: readiness.namespace, version: readiness.schemaVersion, submissionEligible: false as const, exportBlockedReason: readiness.exportBlockedReason, xml: null, contentType: "application/xml" as const };
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "SAFT_EXTERNAL_VALIDATION_REQUIRED" });
    }),
    documentChain: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() })).query(({ ctx, input }) => getDocumentAccountingChainForUserCompany(ctx.user.id, input.companyId, input.documentId)),
    entryChain: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), entryId: z.number().int().positive() })).query(({ ctx, input }) => getJournalDocumentChainForUserCompany(ctx.user.id, input.companyId, input.entryId)),
    trace: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), report: z.enum(["TRIAL_BALANCE", "INCOME_STATEMENT", "BALANCE_SHEET"]), accountCode: z.string().min(1).optional() })).query(({ ctx, input }) => getReportTraceForUserCompany(ctx.user.id, input.companyId, input.report, input.accountCode)),
    vatSummary: roleProcedure("fiscal", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getVatSummaryForUserCompany(ctx.user.id, input.companyId)),
    customerAging: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), asOf: z.coerce.date() })).query(({ ctx, input }) => getAgingForUserCompany(ctx.user.id, input.companyId, "CUSTOMER", input.asOf)),
    supplierAging: roleProcedure("reports", "read").input(z.object({ companyId: z.number().int().positive(), asOf: z.coerce.date() })).query(({ ctx, input }) => getAgingForUserCompany(ctx.user.id, input.companyId, "SUPPLIER", input.asOf)),
    fiscalRegister: roleProcedure("fiscal", "read").input(z.object({ companyId: z.number().int().positive() })).query(({ ctx, input }) => getFiscalRegisterForUserCompany(ctx.user.id, input.companyId)),
    agtValidation: roleProcedure("fiscal", "read").input(z.object({ companyId: z.number().int().positive(), year: z.number().int().min(2023).max(2100), month: z.number().int().min(1).max(12) })).query(async ({ ctx, input }) => {
      const companies = await getCompaniesForUser(ctx.user.id);
      const company = companies.find(({ company }) => company.id === input.companyId)?.company;
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "COMPANY_NOT_FOUND_OR_FORBIDDEN" });
      const register = await getFiscalRegisterForUserCompany(ctx.user.id, input.companyId);
      return { companyId: input.companyId, period: { year: input.year, month: input.month }, regime: company.ivaRegime, validation: validateAgtFiscalRecord({ companyId: input.companyId, period: { year: input.year, month: input.month }, regime: company.ivaRegime, sourceDocumentCount: register.entries.length, netAmount: register.totals.netAmount, taxAmount: register.totals.taxAmount, totalAmount: register.totals.totalAmount }) };
    }),
  }),
  audit: router({
    list: roleProcedure("audit", "read").input(z.object({ companyId: z.number().int().positive(), entityType: z.string().min(1).optional(), entityId: z.string().min(1).optional() })).query(({ ctx, input }) => getAuditEventsForUserCompany(ctx.user.id, input.companyId, input.entityType, input.entityId)),
    append: adminProcedure.input(z.object({ organizationId: z.number().int().positive(), companyId: z.number().int().positive().nullable().optional(), action: z.string().min(1), entityType: z.string().min(1), entityId: z.string().min(1), beforeState: z.string().nullable().optional(), afterState: z.string().nullable().optional(), correlationId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      try {
        return await appendAuditEventForUser({ ...input, actorUserId: ctx.user.id, beforeState: input.beforeState ?? null, afterState: input.afterState ?? null });
      } catch (error) {
        if (error instanceof Error && error.message === "AUDIT_SCOPE_FORBIDDEN") throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        throw error;
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
