import { addPgcSourceForUser, createPgcVersionForUser, listPgcVersionsForUser } from "../server/pgc.ts";

const input = { userId: 1, organizationId: 1 };
const existing = await listPgcVersionsForUser(input);
let version = existing.find((row) => row.code === "PGCA-82-01");
if (!version) {
  const created = await createPgcVersionForUser({ ...input, code: "PGCA-82-01", name: "Plano Geral de Contabilidade — Decreto n.º 82/01", description: "Catálogo normativo base do PGCA angolano. Mantém-se em rascunho até validação formal da fonte e das contas pelo contabilista responsável.", sourceType: "PGC_BASE", effectiveFrom: new Date("2002-01-01T00:00:00.000Z") });
  version = { id: created.id, code: "PGCA-82-01" };
}
console.log(JSON.stringify({ versionId: version.id, code: version.code, created: existing.every((row) => row.code !== "PGCA-82-01") }));
