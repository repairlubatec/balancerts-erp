import { addPgcAccountVisualConfirmedForUser } from "../server/pgc.ts";

const base = {
  userId: Number(process.env.PGC_REVIEW_USER_ID ?? 1),
  organizationId: Number(process.env.PGC_REVIEW_ORGANIZATION_ID ?? 1),
  versionId: Number(process.env.PGC_REVIEW_VERSION_ID ?? 1),
  sourceSha256: "04359cb12d48a20cc5326ca001cd0597b1904a7d99d376b1820e8be40f332c89",
};
const validFrom = new Date("2002-01-01T00:00:00.000Z");
const accounts = [
  { code: "4512", name: "Caixa", classCode: "4", parentCode: "451", level: 4, accountType: "MOVEMENT", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: true, incomeStatement: false, evidencePages: [49] },
  { code: "453", name: "Valores destinados a pagamentos específicos", classCode: "4", parentCode: "45", level: 3, accountType: "GROUP", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [49] },
  { code: "4531", name: "Salários", classCode: "4", parentCode: "453", level: 4, accountType: "MOVEMENT", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: true, incomeStatement: false, evidencePages: [49] },
  { code: "611", name: "Produtos acabados e intermédios", classCode: "6", parentCode: "61", level: 3, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "6111", name: "Mercado nacional", classCode: "6", parentCode: "611", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "6112", name: "Mercado estrangeiro", classCode: "6", parentCode: "611", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "612", name: "Sub-produtos, desperdícios, resíduos e refugos", classCode: "6", parentCode: "61", level: 3, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "6121", name: "Mercado nacional", classCode: "6", parentCode: "612", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "6122", name: "Mercado estrangeiro", classCode: "6", parentCode: "612", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "614", name: "Embalagens de consumo", classCode: "6", parentCode: "61", level: 3, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "6141", name: "Mercado nacional", classCode: "6", parentCode: "614", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
  { code: "6142", name: "Mercado estrangeiro", classCode: "6", parentCode: "614", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: false, incomeStatement: true, evidencePages: [50] },
];

for (const account of accounts) {
  const result = await addPgcAccountVisualConfirmedForUser({ ...base, account: { ...account, validFrom, sourceId: 1 }, evidencePages: account.evidencePages });
  console.log(JSON.stringify(result));
}
