import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const auditorContext: TrpcContext = {
  user: {
    id: 63,
    openId: "p2-export-auditor",
    name: "Auditor P2",
    email: "auditor-p2@example.invalid",
    loginMethod: "test",
    role: "auditor",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};

afterEach(() => vi.restoreAllMocks());

describe("exportações fiscais com escopo P2", () => {
  it("gera CSV apenas para a empresa pertencente à organização", async () => {
    vi.spyOn(db, "getCompaniesForUser").mockResolvedValue([
      { company: { id: 12, organizationId: 7 } },
    ] as never);

    const result = await appRouter.createCaller(auditorContext).exports.csv({
      organizationId: 7,
      companyId: 12,
      kind: "documents",
      rows: [{ numero: "FT 1", total: 100 }],
    });

    expect(result.filename).toBe("documents.csv");
    expect(result.data).toContain("numero");
    expect(db.getCompaniesForUser).toHaveBeenCalledWith(63);
  });

  it("recusa exportação quando a empresa não pertence ao contexto solicitado", async () => {
    vi.spyOn(db, "getCompaniesForUser").mockResolvedValue([]);

    await expect(
      appRouter.createCaller(auditorContext).exports.csv({
        organizationId: 7,
        companyId: 999,
        kind: "documents",
        rows: [{ numero: "não deve ser exportado" }],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("aplica o mesmo escopo ao Excel", async () => {
    vi.spyOn(db, "getCompaniesForUser").mockResolvedValue([
      { company: { id: 12, organizationId: 7 } },
    ] as never);

    const result = await appRouter.createCaller(auditorContext).exports.xlsx({
      organizationId: 7,
      companyId: 12,
      kind: "counterparties",
      rows: [{ nome: "Cliente" }],
    });

    expect(result.filename).toBe("counterparties.xlsx");
    expect(result.dataBase64.length).toBeGreaterThan(20);
  });
});
