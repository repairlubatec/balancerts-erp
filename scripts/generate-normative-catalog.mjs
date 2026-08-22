import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../docs/normative-catalog-complete-review.json", import.meta.url);
const targetPath = new URL("../client/src/data/normativeCatalog.ts", import.meta.url);
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const output = `// Gerado a partir de docs/normative-catalog-complete-review.json. Não editar manualmente.\nexport const normativeCatalog = ${JSON.stringify(source, null, 2)} as const;\n`;
await writeFile(targetPath, output, "utf8");
console.log(`Catálogo normativo gerado: ${source.pgcaAccounts.length} contas PGCA.`);
