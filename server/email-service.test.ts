import { describe, expect, it } from "vitest";
import { assertEmailAddresses, assertSmtpConfigured } from "./email-service";

describe("serviço de email", () => {
  it("aceita endereços válidos", () => expect(() => assertEmailAddresses(["cliente@exemplo.com", "conta@exemplo.com"])).not.toThrow());
  it("bloqueia destinatários inválidos", () => expect(() => assertEmailAddresses(["cliente-sem-email"])).toThrow("DESTINATARIO_EMAIL_INVALIDO"));
  it("bloqueia SMTP sem credenciais", () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) expect(() => assertSmtpConfigured()).not.toThrow();
    else expect(() => assertSmtpConfigured()).toThrow("CONFIGURACAO_SMTP_PENDENTE");
  });
});
