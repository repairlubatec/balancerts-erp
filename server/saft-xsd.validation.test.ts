import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSaftAoXml, validateSaftAoXmlAgainstXsd } from "./reports";

const xsdPath = join(process.cwd(), "docs/SAFTAO1.01_01.xsd");
const validatorPath = join(process.cwd(), "scripts/validate-saft-xsd.py");

const validInput = {
  companyName: "Empresa Teste",
  nif: "5001121871",
  address: "Rua Teste",
  municipality: "Lubango",
  province: "Huíla",
  functionalCurrency: "AOA",
  periodStart: new Date("2025-01-01T00:00:00Z"),
  periodEnd: new Date("2025-12-31T00:00:00Z"),
  accounts: [
    { id: 1, code: "11", description: "Caixa", postable: true },
    { id: 2, code: "71", description: "Serviços", postable: true },
  ],
  journalEntries: [{ id: 1, transactionDate: new Date("2025-01-01T00:00:00Z"), description: "Teste", lines: [{ accountCode: "11", debit: 100, credit: 0 }, { accountCode: "71", debit: 0, credit: 100 }] }],
  sourceDocuments: [{ id: 1, documentNumber: "FT S001/1", documentType: "FT", status: "ISSUED", issueDate: new Date("2025-01-01T00:00:00Z"), customerName: "Cliente", customerNif: "5001121872", netAmount: 100, taxAmount: 0, totalAmount: 100, ivaRegime: "EXCLUSAO" }],
};

describe("SAF-T AO official XSD validation", () => {
  it("accepts the deterministic builder output against SAFTAO1.01_01.xsd", () => {
    const dir = mkdtempSync(join(tmpdir(), "balancerts-saft-"));
    const xmlPath = join(dir, "valid.xml");
    writeFileSync(xmlPath, buildSaftAoXml(validInput));
    expect(execFileSync("python3", [validatorPath, xmlPath, xsdPath], { encoding: "utf8" })).toContain("VALID");
  });

  it("accepts the builder output through xsd-schema-validator", async () => {
    const validation = await validateSaftAoXmlAgainstXsd(buildSaftAoXml(validInput));
    expect(validation.valid).toBe(true);
    expect(validation.validator).toBe("xsd-schema-validator");
  });

  it("rejects structurally incomplete XML through xsd-schema-validator", async () => {
    const validation = await validateSaftAoXmlAgainstXsd(`<?xml version="1.0"?><AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01"><Header/></AuditFile>`);
    expect(validation.valid).toBe(false);
    expect(validation.messages.length).toBeGreaterThan(0);
  });

  it("rejects structurally incomplete XML", () => {
    const dir = mkdtempSync(join(tmpdir(), "balancerts-saft-"));
    const xmlPath = join(dir, "invalid.xml");
    writeFileSync(xmlPath, `<?xml version="1.0"?><AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01"><Header/></AuditFile>`);
    expect(() => execFileSync("python3", [validatorPath, xmlPath, xsdPath], { encoding: "utf8", stdio: "pipe" })).toThrow();
  });
});
