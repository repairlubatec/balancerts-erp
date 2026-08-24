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

export function pgcaV2Decision(preflight: PgcaV2Preflight = pgcaV2Preflight) {
  if (!preflight.safeForActivation) return "STAGING_ONLY_NOT_ACTIVATED" as const;
  return "READY_FOR_HUMAN_REVIEW" as const;
}
