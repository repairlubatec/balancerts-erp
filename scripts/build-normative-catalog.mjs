import { writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

const root = "/home/ubuntu/balancerts-erp";
const pgcaReview = readFileSync(`${root}/docs/normative-sources/decreto-82-01-pgca-review.csv`, "utf8");
const pgcaAux = readFileSync(`${root}/docs/normative-sources/pgca-explicado-auxiliar-lista-ocr.txt`, "utf8");
const pgcaManifest = JSON.parse(readFileSync(`${root}/docs/normative-sources/pgca-visually-confirmed-accounts.json`, "utf8"));
const ivaOcr = readFileSync(`${root}/docs/normative-sources/lei-14-23-iva-ocr.txt`, "utf8");

const confirmed = new Map(pgcaManifest.accounts.map((a) => [a.code, { ...a, status: "CONFIRMED", authority: "Decreto n.º 82/01", evidence: "visual" }]));
const candidateMap = new Map();
for (const line of pgcaReview.split(/\r?\n/).slice(1)) {
  const cols = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map((v) => v.replace(/^,/, "").replace(/^\"|\"$/g, "").replace(/\"\"/g, '\"')) ?? [];
  const page = Number(cols[1]);
  const code = cols[2]?.trim();
  const name = cols[3]?.trim();
  if (!/^\d{1,4}(?:\.\d+)*$/.test(code ?? "") || !name || !Number.isFinite(page)) continue;
  if (!candidateMap.has(code)) candidateMap.set(code, { code, name, source: "Decreto n.º 82/01 OCR", pages: [page], status: "NEEDS_HUMAN_CONFIRMATION", authority: "Decreto n.º 82/01" });
  else if (!candidateMap.get(code).pages.includes(page)) candidateMap.get(code).pages.push(page);
}
for (const match of pgcaAux.matchAll(/===== PÁGINA (\d+) =====([\s\S]*?)(?===== PÁGINA|$)/g)) {
  const page = Number(match[1]);
  for (const line of match[2].split(/\r?\n/)) {
    const m = line.trim().match(/^(\d{1,2}(?:[.,]\d+){0,3})\s+(.{3,180})$/);
    if (!m) continue;
    const code = m[1].replace(/,/g, ".");
    const name = m[2].replace(/[.·…_]{3,}/g, "").replace(/\s+/g, " ").trim();
    if (!/^\d{1,4}(?:\.\d+)*$/.test(code) || name.length < 3 || /^(PÁGINA|QUADRO|LISTA|CLASSE)/i.test(name)) continue;
    if (!candidateMap.has(code)) candidateMap.set(code, { code, name, source: "PGCA Explicado (auxiliar)", pages: [page], status: "NEEDS_HUMAN_CONFIRMATION", authority: "Decreto n.º 82/01" });
    else if (!candidateMap.get(code).pages.includes(page)) candidateMap.get(code).pages.push(page);
  }
}
const pgcaAccounts = [...candidateMap.values()].map((a) => confirmed.has(a.code) ? { ...a, ...confirmed.get(a.code), sources: [a.source, "Decreto n.º 82/01 — revisão visual"] } : a);
for (const a of confirmed.values()) if (!pgcaAccounts.some((x) => x.code === a.code)) pgcaAccounts.push({ ...a, source: "Decreto n.º 82/01 — revisão visual", sources: ["Decreto n.º 82/01 — revisão visual"] });
pgcaAccounts.sort((a,b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

const article19 = /Artigo\s+19[ºo]?([\s\S]{0,5000}?)(?=Artigo\s+20[ºo]?)/i.exec(ivaOcr)?.[1] ?? "";
const article21 = /Artigo\s+21[ºo]?([\s\S]{0,5000}?)(?=Artigo\s+22[ºo]?)/i.exec(ivaOcr)?.[1] ?? "";
const annexesByName = new Map();
for (const m of ivaOcr.matchAll(/ANEXO\s+([IVX]+)\s*([\s\S]*?)(?=ANEXO\s+[IVX]+|$)/gi)) {
  const annex = `Anexo ${m[1].toUpperCase()}`;
  if (!annexesByName.has(annex)) annexesByName.set(annex, { annex, excerpt: m[2].replace(/\s+/g, " ").trim().slice(0, 1600), status: "NEEDS_HUMAN_CONFIRMATION", source: "Lei n.º 14/23 — PDF recebido" });
}
const annexes = [...annexesByName.values()];
const ivaRules = [
  { id: "IVA-14-23-ART19-GERAL", article: "19.º", type: "TAX_RATE", regime: "GERAL", rate: 0.14, status: "CONFIRMED", evidence: "OCR/PDF recebido", source: "Lei n.º 14/23" },
  { id: "IVA-14-23-ART19-REDUZIDA", article: "19.º", type: "TAX_RATE", regime: "REDUZIDA", rate: null, status: "NEEDS_HUMAN_CONFIRMATION", evidenceExcerpt: article19.slice(0, 1600), source: "Lei n.º 14/23" },
  { id: "IVA-14-23-ART21-CAPTIVAÇÃO", article: "21.º", type: "WITHHOLDING", regime: "CAPTIVAÇÃO", rate: null, status: "NEEDS_HUMAN_CONFIRMATION", evidenceExcerpt: article21.slice(0, 1600), source: "Lei n.º 14/23" },
  ...annexes.map((a) => ({ id: `IVA-14-23-${a.annex.replace(/\s/g, "-").toUpperCase()}`, article: a.annex, type: "ANNEX_SCOPE", regime: null, rate: null, status: a.status, evidenceExcerpt: a.excerpt, source: a.source }))
];
const sha = (path) => crypto.createHash("sha256").update(readFileSync(path)).digest("hex");
const catalog = { generatedAt: new Date().toISOString(), policy: { humanConfirmationRequired: true, operationalActivation: "CONFIRMED_ONLY", ambiguousHandling: "NEEDS_HUMAN_CONFIRMATION" }, sources: { pgca: { file: "docs/normative-sources/decreto-82-01-pgca.pdf", sha256: sha(`${root}/docs/normative-sources/decreto-82-01-pgca.pdf`) }, iva: { file: "docs/normative-sources/lei-14-23-iva.pdf", sha256: sha(`${root}/docs/normative-sources/lei-14-23-iva.pdf`) } }, pgcaAccounts, ivaRules, summary: { pgcaTotalCandidates: pgcaAccounts.length, pgcaConfirmed: pgcaAccounts.filter((a) => a.status === "CONFIRMED").length, pgcaNeedsHumanConfirmation: pgcaAccounts.filter((a) => a.status === "NEEDS_HUMAN_CONFIRMATION").length, ivaTotalRules: ivaRules.length, ivaConfirmed: ivaRules.filter((a) => a.status === "CONFIRMED").length, ivaNeedsHumanConfirmation: ivaRules.filter((a) => a.status === "NEEDS_HUMAN_CONFIRMATION").length } };
await writeFile(`${root}/docs/normative-catalog-complete-review.json`, JSON.stringify(catalog, null, 2));
console.log(JSON.stringify(catalog.summary));
