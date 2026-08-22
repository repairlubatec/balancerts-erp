import { describe, expect, it } from "vitest";
import { validatePgcEvidenceReviewDecision, validatePgcEvidenceSubmissionMetadata } from "./pgc";

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
