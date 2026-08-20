import { z } from "zod";

const positiveId = z.number().int().positive();
const isoDateTime = z.string().datetime({ offset: true });
const nonEmpty = z.string().trim().min(1);

export const saadiValueOriginSchema = z.enum(["REALIZADO", "IMPORTADO", "MANUAL", "ESTIMADO", "PROJECTADO"]);
export const saadiRunStatusSchema = z.enum(["PENDENTE", "EM_PROCESSAMENTO", "CONCLUIDA", "RETRY", "FALHADA", "RECONCILIACAO_NECESSARIA"]);
export const saadiVersionStatusSchema = z.enum(["RASCUNHO", "EM_REVISAO", "APROVADA", "ARQUIVADA"]);

export const saadiSnapshotRequestSchema = z.object({
  organizationId: positiveId,
  companyId: positiveId,
  fiscalExerciseId: positiveId.optional(),
  periodIds: z.array(positiveId).min(1).max(120),
  currency: z.string().trim().length(3).default("AOA"),
  purpose: nonEmpty.max(240),
  contractVersion: z.string().trim().regex(/^v\d+\.\d+$/),
  correlationId: nonEmpty.max(120),
  includeHrDetails: z.boolean().default(false),
});

export const saadiProvenanceSchema = z.object({
  sourceSystem: z.literal("BALANCERTS.ERP"),
  sourceContract: nonEmpty.max(160),
  sourceEntity: nonEmpty.max(160),
  sourceEntityId: z.string().trim().min(1).max(120).optional(),
  organizationId: positiveId,
  companyId: positiveId,
  periodIds: z.array(positiveId).min(1).max(120),
  extractedAt: isoDateTime,
  contractVersion: z.string().trim().regex(/^v\d+\.\d+$/),
  transformation: z.string().trim().max(500).default("LEITURA_DIRECTA"),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const saadiAssumptionSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_.-]{1,80}$/),
  label: nonEmpty.max(180),
  value: z.number().finite(),
  unit: nonEmpty.max(40),
  origin: saadiValueOriginSchema,
  source: nonEmpty.max(240),
  confidence: z.number().min(0).max(1),
  validFrom: z.string().date(),
  validTo: z.string().date().optional(),
});

export const saadiProjectionSchema = z.object({
  metric: nonEmpty.max(160),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  value: z.number().finite(),
  currency: z.string().trim().length(3),
  origin: saadiValueOriginSchema,
  method: nonEmpty.max(240),
  provenance: saadiProvenanceSchema,
});

export const saadiVersionSchema = z.object({
  studyId: positiveId,
  versionNumber: z.number().int().positive(),
  status: saadiVersionStatusSchema,
  authorUserId: positiveId,
  createdAt: isoDateTime,
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  assumptions: z.array(saadiAssumptionSchema),
  projections: z.array(saadiProjectionSchema),
  sourceSnapshotIds: z.array(positiveId),
});

export const saadiSnapshotSchema = z.object({
  request: saadiSnapshotRequestSchema,
  status: saadiRunStatusSchema,
  capturedAt: isoDateTime.optional(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  provenance: z.array(saadiProvenanceSchema),
  metrics: z.record(z.string().trim().min(1), z.number().finite()),
});

export type SaadiSnapshotRequest = z.infer<typeof saadiSnapshotRequestSchema>;
export type SaadiProvenance = z.infer<typeof saadiProvenanceSchema>;
export type SaadiAssumption = z.infer<typeof saadiAssumptionSchema>;
export type SaadiProjection = z.infer<typeof saadiProjectionSchema>;
export type SaadiVersion = z.infer<typeof saadiVersionSchema>;
export type SaadiSnapshot = z.infer<typeof saadiSnapshotSchema>;
