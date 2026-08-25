import { invokeLLM } from "./_core/llm";

export type PgcBlockerSuggestionInput = {
  blocker: string;
  blockers: string[];
  status: string;
  accountCount: number;
  confirmedAccountCount: number;
  sourceCount: number;
  confirmedSourceCount: number;
  accountingRuleCount: number;
  missingOperations: string[];
};

export type PgcBlockerSuggestion = {
  title: string;
  diagnosis: string;
  recommendedSteps: string[];
  evidenceRequired: string[];
  warnings: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  humanApprovalRequired: true;
};

export async function suggestPgcBlockerResolution(input: PgcBlockerSuggestionInput): Promise<PgcBlockerSuggestion> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "És um assistente técnico de conformidade contabilística angolana. Responde exclusivamente em português europeu. Analisa bloqueios do workflow PGCA, sem inventar códigos, leis, contas ou evidências. A sugestão é consultiva: nunca autorizes activação, importação ou alteração de dados; indica sempre que a decisão humana e a fonte primária são obrigatórias.",
      },
      {
        role: "user",
        content: JSON.stringify({ tarefa: "Sugerir resolução segura para um bloqueio PGCA", contexto: input }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "pgc_blocker_suggestion",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 1, maxLength: 180 },
            diagnosis: { type: "string", minLength: 1, maxLength: 1200 },
            recommendedSteps: { type: "array", items: { type: "string", minLength: 1, maxLength: 500 }, minItems: 1, maxItems: 6 },
            evidenceRequired: { type: "array", items: { type: "string", minLength: 1, maxLength: 400 }, maxItems: 6 },
            warnings: { type: "array", items: { type: "string", minLength: 1, maxLength: 400 }, maxItems: 6 },
            confidence: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            humanApprovalRequired: { type: "boolean", enum: [true] },
          },
          required: ["title", "diagnosis", "recommendedSteps", "evidenceRequired", "warnings", "confidence", "humanApprovalRequired"],
          additionalProperties: false,
        },
      },
    },
    maxTokens: 1400,
  });
  const content = response.choices[0]?.message.content;
  const text = typeof content === "string" ? content : content.filter(part => part.type === "text").map(part => part.text).join("\n");
  const parsed = JSON.parse(text) as PgcBlockerSuggestion;
  if (parsed.humanApprovalRequired !== true || !parsed.title || !parsed.diagnosis || parsed.recommendedSteps.length === 0) throw new Error("PGC_AI_SUGGESTION_INVALID");
  return parsed;
}
