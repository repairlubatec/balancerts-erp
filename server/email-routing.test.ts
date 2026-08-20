import { describe, expect, it } from "vitest";
import { resolveEmailSender } from "./email-routing";

describe("resolução do remetente de email", () => {
  it("prefere o email da empresa", () => expect(resolveEmailSender({ companyEmail: "  Empresa@Exemplo.com ", accountantEmail: "contabilista@exemplo.com", accountEmail: "conta@exemplo.com" })).toEqual({ address: "empresa@exemplo.com", source: "EMPRESA" }));
  it("usa o contabilista quando a empresa não tem email", () => expect(resolveEmailSender({ accountantEmail: "contabilista@exemplo.com", accountEmail: "conta@exemplo.com" })).toEqual({ address: "contabilista@exemplo.com", source: "CONTABILISTA" }));
  it("usa a conta autorizada como último recurso", () => expect(resolveEmailSender({ accountEmail: "conta@exemplo.com" })).toEqual({ address: "conta@exemplo.com", source: "CONTA_AUTORIZADA" }));
  it("bloqueia quando não existe remetente", () => expect(resolveEmailSender({ companyEmail: " ", accountantEmail: null, accountEmail: undefined })).toBeNull());
});
