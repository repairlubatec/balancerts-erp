import { describe, expect, it } from "vitest";
import { buildExternalReadinessReport } from "./external-preflight.mjs";

describe("preflight de dependências externas", () => {
  it("mantém o restauro bloqueado sem destino isolado completo", () => {
    const report = buildExternalReadinessReport({
      RESTORE_TARGET: "teste-isolado",
      RESTORE_APPROVED: "false",
      RESTORE_DATABASE_URL: "mysql://utilizador:segredo@teste.example/restore",
    });

    expect(report.safeMode).toBe(true);
    expect(report.restore.status).toBe("PENDENTE_EXTERNO");
    expect(report.restore.safeToRun).toBe(false);
    expect(report.restore.missing).toContain("RESTORE_ALLOWED_HOSTS");
    expect(report.restore.invalid).toContain("RESTORE_APPROVED=true");
    expect(JSON.stringify(report)).not.toContain("segredo");
    expect(report.restore.networkContacted).toBe(false);
  });

  it("reconhece configuração local de empacotamento sem declarar assinatura validada", () => {
    const report = buildExternalReadinessReport({
      BALANCERTS_DESKTOP_URL: "https://erp.example",
    });

    expect(report.desktop.packageReady).toBe(true);
    expect(report.desktop.status).toBe("PRONTO_PARA_EMPACOTAMENTO");
    expect(report.desktop.signingStatus).toBe("ASSINATURA_PENDENTE");
    expect(report.desktop.networkContacted).toBe(false);
  });

  it("mantém AGT, banca e aceitação explicitamente dependentes de evidência externa", () => {
    const report = buildExternalReadinessReport({});

    expect(report.agt.status).toBe("PENDENTE_HOMOLOGACAO_EXTERNA");
    expect(report.banking.status).toBe("PENDENTE_AMBIENTE_EXTERNO");
    expect(report.acceptance.status).toBe("PENDENTE_SESSAO_REPAIR_LUBATEC");
    expect(report.agt.networkContacted).toBe(false);
    expect(report.banking.networkContacted).toBe(false);
    expect(report.acceptance.networkContacted).toBe(false);
  });
});
