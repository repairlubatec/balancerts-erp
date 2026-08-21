import { addPgcAccountDraftForUser, listPgcAccountsForUser } from "../server/pgc.ts";

const context = { userId: 1, organizationId: 1, versionId: 1 };
const existing = await listPgcAccountsForUser(context);
const known = new Set(existing.map((account) => account.code));
const accounts = [
  { code: "4", name: "Meios monetários", classCode: "4", parentCode: null, level: 1, accountType: "CLASS", nature: "NOT_APPLICABLE", balanceType: "NOT_APPLICABLE", acceptsEntries: false, acceptsChildren: true, balanceSheet: true },
  { code: "45", name: "Caixa", classCode: "4", parentCode: "4", level: 2, accountType: "GROUP", nature: "NOT_APPLICABLE", balanceType: "NOT_APPLICABLE", acceptsEntries: false, acceptsChildren: true, balanceSheet: true },
  { code: "451", name: "Fundo fixo", classCode: "4", parentCode: "45", level: 3, accountType: "GROUP", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: false, acceptsChildren: true, balanceSheet: true },
  { code: "4511", name: "Caixa Kwanza", classCode: "4", parentCode: "451", level: 4, accountType: "MOVEMENT", nature: "DEBIT", balanceType: "DEBIT", acceptsEntries: true, acceptsChildren: false, balanceSheet: true, notes: "Designação indicada para confirmação do contabilista; o OCR do PDF apresenta leitura parcial." },
  { code: "6", name: "Proveitos e ganhos por natureza", classCode: "6", parentCode: null, level: 1, accountType: "CLASS", nature: "NOT_APPLICABLE", balanceType: "NOT_APPLICABLE", acceptsEntries: false, acceptsChildren: true, incomeStatement: true },
  { code: "61", name: "Vendas", classCode: "6", parentCode: "6", level: 2, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, incomeStatement: true },
  { code: "613", name: "Mercadorias", classCode: "6", parentCode: "61", level: 3, accountType: "GROUP", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: false, acceptsChildren: true, incomeStatement: true },
  { code: "6131", name: "Mercado nacional", classCode: "6", parentCode: "613", level: 4, accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", acceptsEntries: true, acceptsChildren: false, incomeStatement: true },
];
for (const account of accounts) {
  if (known.has(account.code)) continue;
  const result = await addPgcAccountDraftForUser({ ...context, account: { ...account, validFrom: new Date("2002-01-01T00:00:00.000Z"), sourceId: 1 } });
  console.log(JSON.stringify({ code: account.code, id: result.id, status: result.validationStatus }));
}
