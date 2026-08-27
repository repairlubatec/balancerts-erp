import { describe, expect, it } from "vitest";
import { validateAgtPrivateKeyReference } from "./agt-key-security";

describe("segurança das referências de chave privada AGT", () => {
  it("aceita apenas referência de secret store e normaliza espaços", () => {
    expect(validateAgtPrivateKeyReference("  secret://agt/repair-lubatec/v1  ")).toBe("secret://agt/repair-lubatec/v1");
    expect(validateAgtPrivateKeyReference(undefined)).toBeUndefined();
  });

  it("rejeita material PEM e credenciais brutas", () => {
    expect(() => validateAgtPrivateKeyReference("-----BEGIN PRIVATE KEY-----\nabc")).toThrow("AGT_PRIVATE_KEY_MATERIAL_FORBIDDEN");
    expect(() => validateAgtPrivateKeyReference("secret://agt/key?password=raw")).toThrow("AGT_PRIVATE_KEY_CREDENTIAL_FORBIDDEN");
  });

  it("rejeita caminhos locais e referências sem esquema permitido", () => {
    expect(() => validateAgtPrivateKeyReference("C:\\keys\\agt.pfx")).toThrow("AGT_PRIVATE_KEY_LOCAL_PATH_FORBIDDEN");
    expect(() => validateAgtPrivateKeyReference("/var/secrets/agt-key")).toThrow("AGT_PRIVATE_KEY_LOCAL_PATH_FORBIDDEN");
    expect(() => validateAgtPrivateKeyReference("agt-key-reference")).toThrow("AGT_PRIVATE_KEY_REFERENCE_INVALID");
  });
});
