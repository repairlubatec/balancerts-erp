import { reviewPgcSourceForUser } from "../server/pgc.ts";

const result = await reviewPgcSourceForUser({
  userId: Number(process.env.PGC_REVIEW_USER_ID ?? 1),
  organizationId: Number(process.env.PGC_REVIEW_ORGANIZATION_ID ?? 1),
  versionId: Number(process.env.PGC_REVIEW_VERSION_ID ?? 1),
  sourceId: 30001,
  verificationStatus: "CONFIRMED",
});

console.log(JSON.stringify(result));
