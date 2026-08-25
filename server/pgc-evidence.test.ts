import { describe, expect, it } from "vitest";
import { buildPgcMovementSimulation, requirePgcSimulationAccounts, validateAccountingRuleDraft, validatePgcBatchAccountStatuses, validatePgcBatchReviewSelection, validatePgcEvidenceReviewDecision, validatePgcEvidenceSubmissionMetadata, validatePgcMovementSimulationInput } from "./pgc";

const validInput = {
  classCode: "2",
  targetCodes: ["32", " 33 ", "32"],
  size: 1024,
  sha256: "a".repeat(64),
  mimeType: "APPLICATION/PDF",
  filename: "decreto-82-01.pdf",
  pageFrom: 44,
  pageTo: 47,
};

describe("validação de submissão de evidência PGCA", () => {
  it("normaliza MIME, deduplica códigos e aceita páginas válidas", () => {
    expect(validatePgcEvidenceSubmissionMetadata(validInput)).toEqual({
      codes: ["32", "33"],
      normalizedMime: "application/pdf",
      safeFilename: "decreto-82-01.pdf",
    });
  });

  it("recusa uma classe fora do catálogo PGCA", () => {
    expect(() => validatePgcEvidenceSubmissionMetadata({ ...validInput, classCode: "10" })).toThrow("PGC_EVIDENCE_CLASS_INVALID");
  });

  it("recusa ficheiros não suportados, hashes inválidos e tamanho excessivo", () => {
    expect(() => validatePgcEvidenceSubmissionMetadata({ ...validInput, mimeType: "text/plain" })).toThrow("PGC_EVIDENCE_MIME_INVALID");
    expect(() => validatePgcEvidenceSubmissionMetadata({ ...validInput, sha256: "não-é-hash" })).toThrow("PGC_EVIDENCE_HASH_INVALID");
    expect(() => validatePgcEvidenceSubmissionMetadata({ ...validInput, size: 25 * 1024 * 1024 + 1 })).toThrow("PGC_EVIDENCE_FILE_SIZE_INVALID");
  });

  it("recusa páginas invertidas e uma submissão sem códigos", () => {
    expect(() => validatePgcEvidenceSubmissionMetadata({ ...validInput, pageFrom: 47, pageTo: 44 })).toThrow("PGC_EVIDENCE_PAGES_INVALID");
    expect(() => validatePgcEvidenceSubmissionMetadata({ ...validInput, targetCodes: [] })).toThrow("PGC_EVIDENCE_TARGET_CODES_INVALID");
  });
});

describe("decisões da fila de revisão humana PGCA", () => {
  it("aceita evidência apenas quando há metadados primários completos", () => {
    expect(validatePgcEvidenceReviewDecision({ status: "UNDER_REVIEW", decision: "CONFIRM", hasPrimaryMetadata: true })).toBe("ACCEPTED");
    expect(() => validatePgcEvidenceReviewDecision({ status: "UNDER_REVIEW", decision: "CONFIRM", hasPrimaryMetadata: false })).toThrow("PGC_EVIDENCE_PRIMARY_METADATA_REQUIRED");
  });

  it("mantém pendente ou rejeita apenas com nota explicativa", () => {
    expect(() => validatePgcEvidenceReviewDecision({ status: "UNDER_REVIEW", decision: "KEEP_PENDING", hasPrimaryMetadata: true })).toThrow("PGC_EVIDENCE_REVIEW_NOTE_REQUIRED");
    expect(validatePgcEvidenceReviewDecision({ status: "UNDER_REVIEW", decision: "KEEP_PENDING", reviewNote: "Página ilegível", hasPrimaryMetadata: true })).toBe("PENDING_REVIEW");
    expect(validatePgcEvidenceReviewDecision({ status: "UNDER_REVIEW", decision: "REJECT", reviewNote: "Fonte não corresponde ao diploma", hasPrimaryMetadata: true })).toBe("REJECTED");
  });

  it("recusa qualquer decisão fora do estado em revisão", () => {
    expect(() => validatePgcEvidenceReviewDecision({ status: "PENDING_REVIEW", decision: "CONFIRM", hasPrimaryMetadata: true })).toThrow("PGC_EVIDENCE_REVIEW_REQUIRED");
  });
});

describe("revisão em lote de contas PGCA", () => {
  it("deduplica selecção válida e limita o lote a 100 contas", () => {
    expect(validatePgcBatchReviewSelection({ accountIds: [4, 4, 7], validationStatus: "CONFIRMED" })).toEqual({ accountIds: [4, 7], notes: null });
    expect(() => validatePgcBatchReviewSelection({ accountIds: Array.from({ length: 101 }, (_, index) => index + 1), validationStatus: "CONFIRMED" })).toThrow("PGC_BATCH_ACCOUNT_SELECTION_INVALID");
  });

  it("exige nota para decisões negativas e aceita confirmação sem nota", () => {
    expect(validatePgcBatchReviewSelection({ accountIds: [4], validationStatus: "CONFIRMED" }).notes).toBeNull();
    expect(() => validatePgcBatchReviewSelection({ accountIds: [4], validationStatus: "INVALID" })).toThrow("PGC_ACCOUNT_REVIEW_NOTE_REQUIRED");
    expect(validatePgcBatchReviewSelection({ accountIds: [4], validationStatus: "MISSING_PARENT", notes: "Pai não localizado na fonte primária" }).notes).toBe("Pai não localizado na fonte primária");
  });

  it("bloqueia contas que já tenham decisão final", () => {
    expect(validatePgcBatchAccountStatuses(["NEEDS_NORMATIVE_VALIDATION", "NEEDS_NORMATIVE_VALIDATION"])).toBe(true);
    expect(validatePgcBatchAccountStatuses(["CONFIRMED"])).toBe(false);
    expect(validatePgcBatchAccountStatuses(["INVALID", "NEEDS_NORMATIVE_VALIDATION"])).toBe(false);
  });

  it("recusa selecção vazia ou identificadores inválidos", () => {
    expect(() => validatePgcBatchReviewSelection({ accountIds: [], validationStatus: "CONFIRMED" })).toThrow("PGC_BATCH_ACCOUNT_SELECTION_INVALID");
    expect(() => validatePgcBatchReviewSelection({ accountIds: [0], validationStatus: "CONFIRMED" })).toThrow("PGC_BATCH_ACCOUNT_SELECTION_INVALID");
  });
});

describe("simulador seguro de regras de movimentação PGCA", () => {
  const input = { debitAccountId: 1, creditAccountId: 2, amount: 1000, operation: "COMPRA", transactionDate: new Date("2026-08-22T00:00:00.000Z"), ivaRate: 14, ivaAmount: 140 };
  const account = (id: number, nature: string, validationStatus = "CONFIRMED") => ({ id, code: id === 1 ? "32" : "41", name: id === 1 ? "Mercadorias" : "Fornecedores", nature, validationStatus, acceptsEntries: 1, active: 1 });

  it("valida regras contabilísticas antes da persistência", () => {
    expect(validateAccountingRuleDraft({ operation: "Compra", debitAccountId: 1, creditAccountId: 2, effectiveFrom: new Date("2026-01-01"), sourceId: 4 })).toBe(true);
    expect(() => validateAccountingRuleDraft({ operation: "", debitAccountId: 1, creditAccountId: 2, effectiveFrom: new Date("2026-01-01"), sourceId: 4 })).toThrow("PGC_RULE_OPERATION_REQUIRED");
    expect(() => validateAccountingRuleDraft({ operation: "Compra", debitAccountId: 1, creditAccountId: 1, effectiveFrom: new Date("2026-01-01"), sourceId: 4 })).toThrow("PGC_RULE_ACCOUNTS_INVALID");
    expect(() => validateAccountingRuleDraft({ operation: "Compra", debitAccountId: 1, creditAccountId: 2, effectiveFrom: new Date("2026-01-01") })).toThrow("PGC_RULE_SOURCE_REQUIRED");
    expect(() => validateAccountingRuleDraft({ operation: "Compra", debitAccountId: 1, creditAccountId: 2, effectiveFrom: new Date("2026-02-01"), effectiveTo: new Date("2026-01-01"), sourceId: 4 })).toThrow("PGC_RULE_EFFECTIVE_DATES_INVALID");
  });

  it("valida os três níveis e mantém canPost sempre falso", () => {
    const result = buildPgcMovementSimulation({ debitAccount: account(1, "DEBIT"), creditAccount: account(2, "CREDIT"), rule: { id: 7, operation: "COMPRA", documentType: null, priority: 10 }, versionStatus: "ACTIVE", periodStatus: "OPEN", input: { ...input, userId: 1, organizationId: 1, companyId: 1, versionId: 1 } });
    expect(result.simulationOnly).toBe(true);
    expect(result.canPost).toBe(false);
    expect(result.levels.map((level) => level.status)).toEqual(["PASS", "PASS", "PASS"]);
  });

  it("bloqueia normativamente contas pendentes sem impedir a visualização da simulação", () => {
    const result = buildPgcMovementSimulation({ debitAccount: account(1, "DEBIT", "NEEDS_NORMATIVE_VALIDATION"), creditAccount: account(2, "CREDIT"), rule: null, versionStatus: "ACTIVE", periodStatus: "OPEN", input: { ...input, userId: 1, organizationId: 1, companyId: 1, versionId: 1 } });
    expect(result.levels[1].status).toBe("BLOCKED");
    expect(result.canPost).toBe(false);
    expect(result.levels[1].checks.some((check) => check.code === "DEBIT_CONFIRMED" && check.status === "BLOCKED")).toBe(true);
  });

  it("rejeita contas ausentes sem criar fallback sintético", () => {
    expect(() => requirePgcSimulationAccounts({ id: 1 }, undefined)).toThrow("PGC_SIMULATION_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
    expect(() => requirePgcSimulationAccounts(undefined, { id: 2 })).toThrow("PGC_SIMULATION_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
    expect(requirePgcSimulationAccounts({ id: 1 }, { id: 2 })).toEqual({ debitAccount: { id: 1 }, creditAccount: { id: 2 } });
  });

  it("recusa contas iguais, valor inválido e taxa IVA fora do intervalo", () => {
    expect(() => validatePgcMovementSimulationInput({ ...input, creditAccountId: 1 })).toThrow("PGC_SIMULATION_ACCOUNTS_MUST_DIFFER");
    expect(() => validatePgcMovementSimulationInput({ ...input, amount: 0 })).toThrow("PGC_SIMULATION_AMOUNT_INVALID");
    expect(() => validatePgcMovementSimulationInput({ ...input, ivaRate: 101 })).toThrow("PGC_SIMULATION_IVA_RATE_INVALID");
  });
});
