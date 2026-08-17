import { activateCompanyForUser } from "../server/db";

const result = await activateCompanyForUser({
  userId: 1,
  companyId: 1,
  confirmation: "ACTIVATE_COMPANY",
});

console.log(JSON.stringify(result, null, 2));
