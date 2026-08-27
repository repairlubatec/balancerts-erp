import { describe, expect, it } from "vitest";
import { assertSaftExportReady, buildBalanceSheet, buildCompleteReportReconciliation, buildDocumentOriginReconciliation, buildFiscalRegister, buildIncomeStatement, buildJournal, buildLedger, buildReportReconciliation, buildSaftAoXml, buildSaftReadiness, buildTrialBalance, buildVatSummary, validateSaftAoExportInput } from "./reports";

describe("reconciliable reports", () => {
  it("aggregates account movements and reconciles totals", () => {
    const result = buildTrialBalance([
      { accountCode: "11.1", accountName: "Caixa", debit: 100, credit: 0 },
      { accountCode: "11.1", accountName: "Caixa", debit: 0, credit: 20 },
      { accountCode: "21.1", accountName: "Clientes", debit: 0, credit: 80 },
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ accountCode: "11.1", debit: 100, credit: 20 });
    expect(result.totals).toEqual({ debit: 100, credit: 100 });
    expect(result.reconciled).toBe(true);
  });

  it("flags an unreconciled report", () => {
    expect(buildTrialBalance([{ accountCode: "11.1", accountName: "Caixa", debit: 100, credit: 99 }]).reconciled).toBe(false);
  });

  it("builds chronological journal and running ledger", () => {
    const rows = [
      { entryId: 2, accountCode: "11.1", accountName: "Caixa", debit: 0, credit: 20, description: "Venda", createdAt: new Date("2026-01-02"), sourceDocumentId: 9 },
      { entryId: 1, accountCode: "11.1", accountName: "Caixa", debit: 100, credit: 0, description: "Saldo inicial", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
    ];
    expect(buildJournal(rows).entries[0].entryId).toBe(1);
    expect(buildLedger(rows, "11.1").closingBalance).toBe(80);
  });

  it("summarizes IVA by regime and document status", () => {
    const result = buildVatSummary([
      { status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 },
      { status: "ISSUED", ivaRegime: "GERAL", netAmount: 50, taxAmount: 7, totalAmount: 57 },
      { status: "ISSUED", ivaRegime: "EXCLUSAO", netAmount: 80, taxAmount: 0, totalAmount: 80 },
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.totals).toEqual({ netAmount: 230, taxAmount: 21, totalAmount: 251 });
    expect(result.reconciled).toBe(true);
    expect(buildVatSummary([{ status: "ISSUED", ivaRegime: "EXCLUSAO", netAmount: 100, taxAmount: 14, totalAmount: 114 }]).reconciled).toBe(false);
  });

  it("reconciles the aggregate report contract and flags divergence", () => {
    const lines = [
      { entryId: 1, accountCode: "11.1", accountName: "Caixa", debit: 120, credit: 0, description: "Caixa", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
      { entryId: 1, accountCode: "51.1", accountName: "Capital", debit: 0, credit: 100, description: "Capital", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
      { entryId: 1, accountCode: "71.1", accountName: "Vendas", debit: 0, credit: 50, description: "Venda", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
      { entryId: 1, accountCode: "61.1", accountName: "Custos", debit: 30, credit: 0, description: "Custo", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
    ];
    const trialBalance = buildTrialBalance(lines);
    const journal = buildJournal(lines);
    const balanceSheet = buildBalanceSheet(lines);
    const vatSummary = buildVatSummary([{ status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 }]);
    const fiscalRegister = buildFiscalRegister([{ documentId: 1, documentNumber: "FT/000001", issueDate: new Date("2026-01-01"), customerNif: null, status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 }]);
    expect(buildReportReconciliation({ trialBalance, journal, balanceSheet, vatSummary, fiscalRegister }).reconciled).toBe(true);
    expect(buildReportReconciliation({ trialBalance: { ...trialBalance, reconciled: false }, journal, balanceSheet, vatSummary, fiscalRegister }).reconciled).toBe(false);
    const origin = buildDocumentOriginReconciliation([{ id: 1, status: "ACCOUNTED" }], [{ entryId: 1, sourceDocumentId: 1 }]);
    const orphan = buildDocumentOriginReconciliation([{ id: 1, status: "ACCOUNTED" }], []);
    expect(buildCompleteReportReconciliation({ trialBalance, journal, balanceSheet, vatSummary, fiscalRegister, documentOrigin: origin }).reconciled).toBe(true);
    expect(buildCompleteReportReconciliation({ trialBalance, journal, balanceSheet, vatSummary, fiscalRegister, documentOrigin: orphan }).reconciled).toBe(false);
  });

  it("reports SAF-T coverage without claiming submission eligibility", () => {
    const complete = buildSaftReadiness({ companyName: "Repair Lubatec", nif: "5001121871", functionalCurrency: "AOA", periodStart: new Date("2023-09-01"), periodEnd: new Date("2023-09-30"), accountCount: 2, journalEntryCount: 1, documentCount: 1, customerCount: 1, supplierCount: 1, productCount: 1, taxRuleCount: 1 });
    expect(complete).toMatchObject({ format: "SAFTAO1.01_01", ready: true, missing: [], counts: { accounts: 2, journalEntries: 1, documents: 1, customers: 1, suppliers: 1, products: 1, taxRules: 1 }, exportBlockedReason: "AGT_VALIDATION_REQUIRED", submissionEligible: false });
    const blocked = buildSaftReadiness({ companyName: "Repair Lubatec", nif: "5001121871", functionalCurrency: "AOA", periodStart: new Date("2023-09-01"), periodEnd: new Date("2023-09-30"), accountCount: 0, journalEntryCount: 0, documentCount: 0, customerCount: 0, supplierCount: 0, productCount: 0, taxRuleCount: 0 });
    expect(blocked.ready).toBe(false);
    expect(blocked.missing).toEqual(expect.arrayContaining(["MASTERFILES_ACCOUNTS", "GENERAL_LEDGER_ENTRIES", "SOURCE_DOCUMENTS", "MASTERFILES_CUSTOMERS", "MASTERFILES_SUPPLIERS", "MASTERFILES_PRODUCTS", "MASTERFILES_TAX_TABLES"]));
    expect(blocked.submissionEligible).toBe(false);
    expect(blocked.exportBlockedReason).toBe("MISSING_REQUIRED_ENTITIES");
    expect(() => assertSaftExportReady(complete)).toThrow("SAFT_EXPORT_NOT_READY:AGT_VALIDATION_REQUIRED");
    expect(() => assertSaftExportReady(blocked)).toThrow("SAFT_EXPORT_NOT_READY:MASTERFILES_ACCOUNTS");
  });

  it("builds deterministic SAF-T AO XML with escaped values and stable ordering", () => {
    const xml = buildSaftAoXml({
      companyName: "Repair & Lubatec",
      nif: "5001121871",
      address: "Shopping <Millennium>",
      municipality: "Lubango",
      province: "Huíla",
      functionalCurrency: "AOA",
      periodStart: new Date("2026-01-01T00:00:00Z"),
      periodEnd: new Date("2026-01-31T23:59:59Z"),
      accounts: [
        { id: 2, code: "12", description: "Banco", postable: true },
        { id: 1, code: "11", description: "Caixa", postable: true },
        { id: 3, code: "71", description: "Serviços", postable: true },
      ],
      journalEntries: [{ id: 7, transactionDate: new Date("2026-01-05T00:00:00Z"), description: "Venda & serviço", sourceDocumentId: 4, lines: [{ accountCode: "11", debit: 114, credit: 0 }, { accountCode: "71", debit: 0, credit: 114 }] }],
      sourceDocuments: [{ id: 4, documentNumber: "FT S001/1", documentType: "FT", status: "ISSUED", issueDate: new Date("2026-01-05T00:00:00Z"), customerName: "Cliente <A>", customerNif: "5001121872", netAmount: 100, taxAmount: 14, totalAmount: 114, ivaRegime: "GERAL" }],
    });
    expect(xml).toContain(`xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01"`);
    expect(xml).toContain("<AuditFileVersion>1.01_01</AuditFileVersion>");
    expect(xml).toContain("Repair &amp; Lubatec");
    expect(xml).toContain("Shopping &lt;Millennium&gt;");
    expect(xml.indexOf("<AccountID>11</AccountID>")).toBeLessThan(xml.indexOf("<AccountID>12</AccountID>"));
    expect(xml).toContain("<SourceDocumentID>4</SourceDocumentID>");
    expect(xml).toContain("<GrossTotal>114.00</GrossTotal>");
    expect(xml).toContain("<CompanyID>5001121871</CompanyID>");
    expect(xml).toContain("<DateCreated>");
    expect(xml).toContain("<NumberOfEntries>1</NumberOfEntries>");
    expect(xml).toContain("<DebitLine>");
    expect(xml).toContain("<CreditLine>");
    expect(xml).not.toContain("<AccountType>");
  });

  it("mantém REPORT_ONLY para preparação e identifica inconsistências sem submissão", () => {
    const input = {
      companyName: "Repair Lubatec",
      nif: "5001121871",
      functionalCurrency: "AOA",
      periodStart: new Date("2026-01-01T00:00:00Z"),
      periodEnd: new Date("2026-01-31T23:59:59Z"),
      accounts: [{ id: 1, code: "11", description: "Caixa", postable: true }],
      journalEntries: [{ id: 1, transactionDate: new Date("2026-01-05T00:00:00Z"), description: "Preparação", lines: [{ accountCode: "11", debit: 100, credit: 0 }] }],
      sourceDocuments: [],
      semanticMode: "REPORT_ONLY" as const,
    };
    const validation = validateSaftAoExportInput(input);
    expect(validation.valid).toBe(false);
    expect(validation.issues.map(issue => issue.code)).toContain("UNBALANCED_ENTRY");
    expect(() => buildSaftAoXml(input)).not.toThrow();
  });

  it("reconciles document origins with journal sourceDocumentId", () => {
    expect(buildDocumentOriginReconciliation([{ id: 1, status: "ACCOUNTED" }, { id: 2, status: "DRAFT" }], [{ entryId: 10, sourceDocumentId: 1 }])).toEqual({ missingJournalDocumentIds: [], orphanJournalEntryIds: [], reconciled: true });
    expect(buildDocumentOriginReconciliation([{ id: 1, status: "ISSUED" }], [])).toMatchObject({ missingJournalDocumentIds: [1], reconciled: false });
    expect(buildDocumentOriginReconciliation([], [{ entryId: 11, sourceDocumentId: 999 }])).toMatchObject({ orphanJournalEntryIds: [11], reconciled: false });
  });

  it("preserves fiscal rule provenance per document", () => {
    const result = buildFiscalRegister([
      {
        documentId: 9,
        documentNumber: "FT/000009",
        issueDate: new Date("2026-01-09"),
        customerNif: "5001121872",
        status: "ISSUED",
        ivaRegime: "GERAL",
        netAmount: 100,
        taxAmount: 14,
        totalAmount: 114,
        normativeRuleIds: [4],
        normativeRuleVersions: ["2026-01-01"],
        legalReferences: ["Lei n.º 14/23, artigo 19.º"],
      },
    ]);
    expect(result.entries[0]).toMatchObject({
      normativeRuleIds: [4],
      normativeRuleVersions: ["2026-01-01"],
      legalReferences: ["Lei n.º 14/23, artigo 19.º"],
    });
    expect(result.reconciled).toBe(true);
  });

  it("reconciles income statement and balance sheet", () => {
    const lines = [
      { accountCode: "11.1", accountName: "Caixa", debit: 120, credit: 0 },
      { accountCode: "51.1", accountName: "Capital", debit: 0, credit: 100 },
      { accountCode: "71.1", accountName: "Vendas", debit: 0, credit: 50 },
      { accountCode: "61.1", accountName: "Custos", debit: 30, credit: 0 },
    ];
    expect(buildIncomeStatement(lines)).toMatchObject({ revenue: 50, expenses: 30, netIncome: 20 });
    expect(buildBalanceSheet(lines)).toMatchObject({ assets: 120, liabilities: 0, equity: 120, netIncome: 20, reconciled: true });
  });
});
