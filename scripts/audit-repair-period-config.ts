import { appendAuditEvent } from "../server/db";

await appendAuditEvent({
  organizationId: 1,
  companyId: 1,
  actorUserId: 1,
  action: "COMPANY_CONFIGURATION_UPDATED",
  entityType: "company",
  entityId: "1",
  beforeState: JSON.stringify({ primaryLegalRepresentative: null, period: null }),
  afterState: JSON.stringify({ primaryLegalRepresentative: "Fausto Silva", legalRepresentatives: ["Fausto Silva", "Luís Jordão"], period: "2023-09", status: "OPEN" }),
  correlationId: "company:1:configuration:2023-09",
});
console.log("configuration audited");
