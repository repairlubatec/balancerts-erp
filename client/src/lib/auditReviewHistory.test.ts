import { describe, expect, it } from "vitest";
import { paginateAuditReviewHistory } from "./auditReviewHistory";

describe("paginação do histórico de estados", () => {
  it("divide os eventos em páginas de cinco e expõe os limites", () => {
    const result = paginateAuditReviewHistory([1, 2, 3, 4, 5, 6, 7], 1);
    expect(result).toMatchObject({ page: 1, pageSize: 5, pageCount: 2, hasPrevious: false, hasNext: true, items: [1, 2, 3, 4, 5] });
    expect(paginateAuditReviewHistory([1, 2, 3, 4, 5, 6, 7], 2).items).toEqual([6, 7]);
  });

  it("normaliza páginas inválidas para a primeira ou última página", () => {
    expect(paginateAuditReviewHistory([1, 2, 3], 0).page).toBe(1);
    expect(paginateAuditReviewHistory([1, 2, 3], 99).page).toBe(1);
    expect(paginateAuditReviewHistory(Array.from({ length: 6 }, (_, index) => index), 99).items).toEqual([5]);
  });

  it("limita o tamanho de página para evitar listas excessivas no modal", () => {
    const result = paginateAuditReviewHistory([1, 2, 3], 1, 500);
    expect(result.pageSize).toBe(50);
    expect(result.items).toEqual([1, 2, 3]);
  });
});
