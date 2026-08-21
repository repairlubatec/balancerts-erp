import { createHash } from "node:crypto";
import { z } from "zod";

export const BANK_STATEMENT_CONTRACT_VERSION = "D3.1" as const;

export const semanticBankStatementLineSchema = z.object({
  bookingDate: z.coerce.date(),
  valueDate: z.coerce.date(),
  description: z.string().trim().min(1).max(500),
  externalReference: z.string().trim().max(160).optional(),
  counterparty: z.string().trim().max(180).optional(),
  direction: z.enum(["IN", "OUT"]),
  amount: z.number().finite().positive(),
  balance: z.number().finite().optional(),
});

export const semanticBankStatementSchema = z.object({
  contractVersion: z.literal(BANK_STATEMENT_CONTRACT_VERSION),
  sourceFormat: z.enum(["CSV", "MT940", "CAMT.053", "API", "MANUAL"]),
  originalFilename: z.string().trim().min(1).max(255),
  statementDate: z.coerce.date(),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()),
  openingBalance: z.number().finite(),
  closingBalance: z.number().finite(),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  idempotencyKey: z.string().regex(/^bank-statement:[a-f0-9]{64}$/),
  rows: z.array(semanticBankStatementLineSchema).min(1).max(5000),
}).superRefine((statement, context) => {
  const movement = statement.rows.reduce((total, row) => total + (row.direction === "IN" ? row.amount : -row.amount), 0);
  const expectedClosing = Number((statement.openingBalance + movement).toFixed(2));
  if (statement.closingBalance !== expectedClosing) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["closingBalance"], message: "CLOSING_BALANCE_DOES_NOT_RECONCILE" });
  }
});

export type SemanticBankStatement = z.infer<typeof semanticBankStatementSchema>;

function canonicalize(value: unknown): string {
  return JSON.stringify(value, (_key, nested) => nested instanceof Date ? nested.toISOString() : nested);
}

function hashCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

export function normalizeBankStatement(input: Omit<SemanticBankStatement, "contractVersion" | "sourceHash" | "idempotencyKey"> & { sourceHash?: string }): SemanticBankStatement {
  const rows = input.rows.map(row => semanticBankStatementLineSchema.parse(row));
  const sourcePayload = {
    sourceFormat: input.sourceFormat,
    originalFilename: input.originalFilename.trim(),
    statementDate: new Date(input.statementDate).toISOString(),
    currency: input.currency.trim().toUpperCase(),
    openingBalance: input.openingBalance,
    closingBalance: input.closingBalance,
    rows,
  };
  const sourceHash = input.sourceHash ?? hashCanonical(sourcePayload);
  return semanticBankStatementSchema.parse({
    ...input,
    ...sourcePayload,
    contractVersion: BANK_STATEMENT_CONTRACT_VERSION,
    sourceHash,
    idempotencyKey: `bank-statement:${sourceHash}`,
  });
}

export function statementImportFingerprint(statement: Pick<SemanticBankStatement, "sourceHash" | "currency" | "statementDate">): string {
  return hashCanonical({ sourceHash: statement.sourceHash, currency: statement.currency, statementDate: new Date(statement.statementDate).toISOString() });
}
