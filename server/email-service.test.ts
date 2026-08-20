import { describe, expect, it } from "vitest";
import { assertEmailAddresses, assertSmtpConfigured, classifyEmailFailure, emailFailureMessage } from "./email-service";

describe("serviço de email", () => {
  it("aceita endereços válidos", () => expect(() => assertEmailAddresses(["cliente@exemplo.com", "conta@exemplo.com"])).not.toThrow());
  it("bloqueia destinatários inválidos", () => expect(() => assertEmailAddresses(["cliente-sem-email"])).toThrow("DESTINATARIO_EMAIL_INVALIDO"));
  it("bloqueia SMTP sem credenciais", () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) expect(() => assertSmtpConfigured()).not.toThrow();
    else expect(() => assertSmtpConfigured()).toThrow("CONFIGURACAO_SMTP_PENDENTE");
  });
  it("classifica autenticação Gmail sem expor a mensagem técnica", () => {
    const code = classifyEmailFailure(new Error("Invalid login: 535-5.7.8 Username and Password not accepted"));
    expect(code).toBe("AUTENTICACAO_SMTP_FALHOU");
    expect(emailFailureMessage(code)).toContain("autenticação");
    expect(emailFailureMessage(code)).not.toContain("535");
  });
  it("mantém configuração SMTP pendente como estado accionável", () => {
    const code = classifyEmailFailure(new Error("CONFIGURACAO_SMTP_PENDENTE"));
    expect(code).toBe("CONFIGURACAO_SMTP_PENDENTE");
    expect(emailFailureMessage(code)).toContain("não está configurado");
  });
});
