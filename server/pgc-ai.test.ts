import { describe, expect, it, vi } from "vitest";
import { invokeLLM } from "./_core/llm";
import { suggestPgcBlockerResolution } from "./pgc-ai";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
const mockedInvoke = vi.mocked(invokeLLM);
const input = { blocker: "PGC_VERSION_HAS_UNCONFIRMED_SOURCES", blockers: ["PGC_VERSION_HAS_UNCONFIRMED_SOURCES"], status: "UNDER_REVIEW", accountCount: 10, confirmedAccountCount: 9, sourceCount: 1, confirmedSourceCount: 0, accountingRuleCount: 2, missingOperations: [] };
const response = (value: unknown) => ({ choices: [{ index: 0, message: { role: "assistant" as const, content: JSON.stringify(value) }, finish_reason: "stop" }], id: "test", created: 1, model: "test" });

describe("sugestão IA dos bloqueios PGCA", () => {
  it("devolve uma recomendação consultiva estruturada", async () => {
    mockedInvoke.mockResolvedValueOnce(response({ title: "Confirmar fonte", diagnosis: "A fonte ainda não foi confirmada.", recommendedSteps: ["Rever o PDF oficial"], evidenceRequired: ["Página legível e hash"], warnings: ["Não activar sem decisão humana"], confidence: "HIGH", humanApprovalRequired: true }));
    await expect(suggestPgcBlockerResolution(input)).resolves.toMatchObject({ humanApprovalRequired: true, recommendedSteps: ["Rever o PDF oficial"] });
  });

  it("rejeita resposta IA que tenta remover a aprovação humana", async () => {
    mockedInvoke.mockResolvedValueOnce(response({ title: "Activar", diagnosis: "Pode activar.", recommendedSteps: ["Activar"], evidenceRequired: [], warnings: [], confidence: "HIGH", humanApprovalRequired: false }));
    await expect(suggestPgcBlockerResolution({ ...input, blocker: "PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS" })).rejects.toThrow("PGC_AI_SUGGESTION_INVALID");
  });
});
