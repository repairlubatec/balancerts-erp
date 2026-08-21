import { reviewPgcAccountForUser } from "../server/pgc.ts";

const input = {
  userId: Number(process.env.PGC_REVIEW_USER_ID ?? 1),
  organizationId: Number(process.env.PGC_REVIEW_ORGANIZATION_ID ?? 1),
  versionId: Number(process.env.PGC_REVIEW_VERSION_ID ?? 1),
};

const accountIds = [1, 2, 3, 4, 5, 6, 7, 8];

for (const accountId of accountIds) {
  const result = await reviewPgcAccountForUser({ ...input, accountId, validationStatus: "CONFIRMED", notes: "Confirmada visualmente no PDF oficial do Decreto n.º 82/01; páginas do quadro PGCA registadas no log de validação visual." });
  console.log(JSON.stringify(result));
}
