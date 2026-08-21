import { auditLegacyChartForUser } from "../server/pgc.ts";

const result = await auditLegacyChartForUser({ userId: 1, companyId: 30001 });
console.log(JSON.stringify(result));
