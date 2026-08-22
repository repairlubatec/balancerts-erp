import { addPgcAccountVisualConfirmedForUser } from "../server/pgc.ts";

const base = {
  userId: Number(process.env.PGC_REVIEW_USER_ID ?? 1),
  organizationId: Number(process.env.PGC_REVIEW_ORGANIZATION_ID ?? 1),
  versionId: Number(process.env.PGC_REVIEW_VERSION_ID ?? 1),
  sourceSha256: "04359cb12d48a20cc5326ca001cd0597b1904a7d99d376b1820e8be40f332c89",
};
const validFrom = new Date("2002-01-01T00:00:00.000Z");
const accounts = [
  { code: "1", name: "Meios fixos e investimentos", classCode: "1", parentCode: null, level: 1, accountType: "CLASS", nature: "NOT_APPLICABLE", balanceType: "NOT_APPLICABLE", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [41] },
  { code: "11", name: "Imobilizações corpóreas", classCode: "1", parentCode: "1", level: 2, accountType: "GROUP", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [41] },
  { code: "12", name: "Imobilizações incorpóreas", classCode: "1", parentCode: "1", level: 2, accountType: "GROUP", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [41] },
  { code: "13", name: "Investimentos financeiros", classCode: "1", parentCode: "1", level: 2, accountType: "GROUP", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [42] },
  { code: "14", name: "Imobilizações em curso", classCode: "1", parentCode: "1", level: 2, accountType: "GROUP", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [42] },
  { code: "18", name: "Amortizações acumuladas", classCode: "1", parentCode: "1", level: 2, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [42] },
  { code: "19", name: "Provisões para investimentos financeiros", classCode: "1", parentCode: "1", level: 2, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true, incomeStatement: false, evidencePages: [42] },
];

for (const account of accounts) {
  const result = await addPgcAccountVisualConfirmedForUser({
    ...base,
    account: { ...account, validFrom, sourceId: 1 },
    evidencePages: account.evidencePages,
  });
  console.log(JSON.stringify(result));
}
