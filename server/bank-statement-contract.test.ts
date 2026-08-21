import { describe, expect, it } from "vitest";
import { BANK_STATEMENT_CONTRACT_VERSION, normalizeBankStatement, semanticBankStatementSchema, statementImportFingerprint } from "./bank-statement-contract";

const line = { bookingDate: "2026-08-21", valueDate: "2026-08-21", description: "Transferência recebida", externalReference: "EXT-1", direction: "IN" as const, amount: 100, balance: 100 };

function input() {
  return { sourceFormat: "CSV" as const, originalFilename: "extracto.csv", statementDate: "2026-08-21", currency: "aoa", openingBalance: 0, closingBalance: 100, rows: [line] };
}

describe("D3 — contrato semântico de extractos bancários", () => {
  it("normaliza moeda, cria hash e chave idempotente determinística", () => {
    const statement = normalizeBankStatement(input());
    expect(statement.contractVersion).toBe(BANK_STATEMENT_CONTRACT_VERSION);
    expect(statement.currency).toBe("AOA");
    expect(statement.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(statement.idempotencyKey).toBe(`bank-statement:${statement.sourceHash}`);
    expect(statementImportFingerprint(statement)).toMatch(/^[a-f0-9]{64}$/);
    expect(normalizeBankStatement(input()).sourceHash).toBe(statement.sourceHash);
  });

  it("rejeita saldo final que não reconcilia com os movimentos", () => {
    expect(() => normalizeBankStatement({ ...input(), closingBalance: 101 })).toThrow("CLOSING_BALANCE_DOES_NOT_RECONCILE");
  });

  it("rejeita hash fornecido fora do formato SHA-256", () => {
    expect(() => normalizeBankStatement({ ...input(), sourceHash: "nao-e-sha256" })).toThrow();
  });

  it("impõe limite de 5.000 linhas no contrato semântico", () => {
    const rows = Array.from({ length: 5001 }, (_, index) => ({ ...line, externalReference: `EXT-${index}`, balance: index + 1 }));
    expect(() => semanticBankStatementSchema.parse({ ...normalizeBankStatement(input()), rows })).toThrow();
  });
});
