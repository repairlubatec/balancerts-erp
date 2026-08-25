export const pgcaV2Preflight = {
  sourceFile: "pasted_content_2.txt",
  lineCount: 855,
  accountCount: 714,
  duplicateCodes: ["18.1", "18.2", "18.3", "34.5", "34.6"],
  reservedExtensions: 86,
  sourceShape: "SINGLE_DOCUMENT",
  documentEndLine: null,
  safeForNormativeImport: false,
  safeForActivation: false,
} as const;

export type PgcaV2Preflight = typeof pgcaV2Preflight;

export type PgcaV2PreflightBlocker = "DUPLICATE_CODES" | "RESERVED_EXTENSIONS" | "SOURCE_DOCUMENT_INCOMPLETE" | "NORMATIVE_IMPORT_NOT_SAFE" | "ACTIVATION_NOT_SAFE";

export function getPgcaV2PreflightBlockers(preflight: PgcaV2Preflight = pgcaV2Preflight): PgcaV2PreflightBlocker[] {
  const blockers: PgcaV2PreflightBlocker[] = [];
  if (preflight.duplicateCodes.length > 0) blockers.push("DUPLICATE_CODES");
  if (preflight.reservedExtensions > 0) blockers.push("RESERVED_EXTENSIONS");
  if (preflight.sourceShape !== "SINGLE_DOCUMENT" || preflight.documentEndLine === null) blockers.push("SOURCE_DOCUMENT_INCOMPLETE");
  if (!preflight.safeForNormativeImport) blockers.push("NORMATIVE_IMPORT_NOT_SAFE");
  if (!preflight.safeForActivation) blockers.push("ACTIVATION_NOT_SAFE");
  return blockers;
}

export function pgcaV2Decision(preflight: PgcaV2Preflight = pgcaV2Preflight) {
  if (!preflight.safeForActivation) return "STAGING_ONLY_NOT_ACTIVATED" as const;
  return "READY_FOR_HUMAN_REVIEW" as const;
}
