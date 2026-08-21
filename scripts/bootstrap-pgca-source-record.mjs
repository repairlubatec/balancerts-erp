import { addPgcSourceForUser } from "../server/pgc.ts";

const result = await addPgcSourceForUser({
  userId: 1,
  organizationId: 1,
  versionId: 1,
  instrument: "Decreto",
  instrumentNumber: "82/01",
  article: "1.º, 2.º, 5.º, 6.º e anexo do Plano Geral de Contabilidade",
  title: "Plano Geral de Contabilidade de Angola",
  sourceUrl: "https://lex.ao/docs/conselho-de-ministros/2001/decreto-n-o-82-01-de-16-de-novembro/",
  issuedAt: new Date("2001-11-16T00:00:00.000Z"),
  effectiveFrom: new Date("2002-01-01T00:00:00.000Z"),
  verificationStatus: "PENDING",
  conflictNote: "Confirmar visualmente o PDF oficial e a versão aplicável antes de validar e activar.",
});
console.log(JSON.stringify(result));
