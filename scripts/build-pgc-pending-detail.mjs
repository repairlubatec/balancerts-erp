import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const diff = JSON.parse(fs.readFileSync(path.join(root, "docs/pgca-code-diff-2026-08-26.json"), "utf8"));
const confirmed = JSON.parse(fs.readFileSync(path.join(root, "docs/normative-sources/pgca-visually-confirmed-accounts.json"), "utf8"));
const confirmedCodes = new Set(confirmed.accounts.map((a) => a.code));
const ocrDir = path.join(root, "docs/normative-sources/pgca-ocr");
const pages = fs.readdirSync(ocrDir).filter((f) => /^page-\d+\.txt$/.test(f)).sort();
const pageText = pages.map((f) => ({ page: Number(f.match(/\d+/)[0]), text: fs.readFileSync(path.join(ocrDir, f), "utf8") }));
const findPages = (code) => pageText.filter(({text}) => new RegExp(`(^|[^0-9.])${code.replaceAll(".", "\\.")}(?![0-9.])`).test(text)).map(({page}) => page).slice(0, 8);
const rows = diff.missingCodes.map((a) => ({ ...a, classCode: a.code.split(/[.]/)[0], evidencePagesCandidate: findPages(a.code) }));
const byClass = new Map(); for (const r of rows) byClass.set(r.classCode, (byClass.get(r.classCode) ?? 0) + 1);
const evidence = [
  ["Quadro oficial do plano", "Página do PDF oficial onde aparecem simultaneamente código, designação e relação hierárquica", "Obrigatória para cada código; OCR é apenas índice, não prova."],
  ["Natureza contabilística", "Página/nota do diploma que permita confirmar Devedora, Credora ou Mista, conforme a conta", "Obrigatória para contas de grupo e movimentáveis; não inferir pela classe."],
  ["Regra de movimentação", "Página do esquema/nota de movimentação que diga como debitar e creditar a conta ou subconta", "Obrigatória para activar lançamentos; regra geral de activo/passivo não substitui regra específica quando houver."],
  ["Lançabilidade", "Quadro que demonstre se a conta aceita movimentos ou se é agregadora/analítica", "Obrigatória para impedir lançamentos em contas-pai."],
  ["Fonte e integridade", "PDF original, identificação do diploma, página e hash do ficheiro", "Obrigatória para auditoria e cadeia normativa."],
  ["IVA posterior", "Para códigos 34.5, 34.6, 63.5 e 75.3.1.2: página legível do Decreto Presidencial n.º 180/19", "Camada posterior relacionada; não altera a identidade PGCA-82-01."],
];
const lines = [
  "# Inventário concreto das contas PGCA pendentes — Repair Lubatec",
  "",
  "> **Nota de segurança:** isto é uma análise técnica para preparação do ERP. A activação contabilística deve ser revista por contabilista certificado e, quando aplicável, por assessor jurídico/fiscal.",
  "",
  `O arquivo técnico contém **${diff.fullCount} registos**. O ERP tem **${diff.confirmedCount} contas confirmadas visualmente** e **${diff.missingCount} códigos sem confirmação equivalente persistida**. Estes 765 registos não são necessariamente duplicados: incluem a sequência oficial classe → conta → subconta → analítica → movimentável. O bloqueio significa que falta prova normativa legível, não que o código esteja rejeitado.`,
  "",
  "## 1. Distribuição concreta",
  "",
  "| Classe/prefixo inicial | Pendentes | Interpretação |",
  "|---:|---:|---|",
  ...[...byClass.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([k,v])=>`| ${k} | ${v} | Contas e subcontas cujo código começa por ${k}; confirmar hierarquia e regra própria. |`),
  "",
  "| Nível | Quantidade | O que deve ser confirmado |",
  "|---:|---:|---|",
  "| 1 | 6 | Classes de topo; normalmente não recebem lançamentos. Confirmar no quadro se aceitam filhos. |",
  "| 2 | 57 | Contas agregadoras ou divisões principais; confirmar se são apenas agrupadoras ou movimentáveis. |",
  "| 3 | 251 | Subcontas; confirmar natureza, pai e possibilidade de receber movimentos. |",
  "| 4 | 280 | Subcontas analíticas/operacionais; confirmar designação literal e regra de débito/crédito. |",
  "| 5 | 171 | Níveis mais detalhados; confirmar pai imediato e lançabilidade específica. |",
  "",
  "## 2. O que falta para cada conta",
  "",
  "| Evidência | Conteúdo concreto | Por que é necessária |",
  ...evidence.map(([a,b,c])=>`| ${a} | ${b} | ${c} |`),
  "",
  "## 3. Como ler o bloqueio no ERP",
  "",
  "A conta só pode passar para `CONFIRMED` quando o revisor conseguir apontar para a página do diploma e ler sem ambiguidade o código, a designação e o lugar na hierarquia. Para uma conta que possa receber lançamentos, deve também estar legível a natureza e a regra de movimentação. Se a página estiver cortada, desfocada, depender apenas de OCR ou não mostrar o contexto do pai, o estado correcto é `NEEDS_NORMATIVE_VALIDATION`, não `CONFIRMED`.",
  "",
  "A regra geral — activos debitam por aumentos e creditam por diminuições; passivos e capital próprio creditam por aumentos e debitam por diminuições — serve apenas como orientação de alto nível. Não autoriza o ERP a atribuir automaticamente natureza a cada conta, sobretudo em contas mistas, correctoras, resultados, provisões, amortizações e contas de IVA.",
  "",
  "## 4. Exemplos concretos já confirmados",
  "",
  "As 27 confirmações actuais cobrem as classes/prefixos `1`, `11`, `12`, `13`, `14`, `18`, `19`, `4`, `45`, `451`, `4511`, `4512`, `453`, `4531`, `6`, `61`, `611`, `6111`, `6112`, `612`, `6121`, `6122`, `613`, `6131`, `614`, `6141` e `6142`, com revisão visual registada nas páginas 41–50 do PDF de trabalho. Os restantes códigos do inventário continuam na lista abaixo e não devem ser tratados como confirmados por proximidade hierárquica.",
  "",
  "## 5. Lista completa dos códigos pendentes",
  "",
  "| Código | Designação no arquivo | Pai | Nível | Páginas OCR candidatas | Evidência que ainda falta |",
  "|---|---|---|---:|---|---|",
  ...rows.map((r) => `| ${r.code} | ${r.name.replaceAll("|", "\\|")} | ${r.parentCode ?? "—"} | ${r.level ?? "—"} | ${r.evidencePagesCandidate.length ? r.evidencePagesCandidate.join(", ") : "não localizada com segurança"} | Quadro oficial + natureza + regra de movimentação + lançabilidade; confirmar visualmente. |`),
  "",
  "## 6. Regra para as contas de IVA",
  "",
  "As contas `34.5`, `34.5.1`, `34.5.2`, `34.6`, `63.5` e `75.3.1.2` devem ser tratadas como alterações/camadas relacionadas ao PGCA-82-01, com fonte no Decreto Presidencial n.º 180/19. Não devem ser usadas para substituir o plano-base nem ser activadas só porque aparecem num pacote com o título “PGCA actualizado com IVA”. Para cada uma, a evidência deve mostrar o código, a designação e a função contabilística no texto oficial; se a lista fornecida não trouxer a designação completa, essa parte também fica pendente.",
  "",
  "## Referências",
  "",
  "[1]: https://lex.ao/docs/presidente-da-republica/2001/decreto-n-o-82-01-de-16-de-novembro/ \"Decreto n.º 82/01 — Plano Geral de Contabilidade\"",
  "[2]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ \"Decreto Presidencial n.º 180/19 — Regulamento do Código do IVA\"",
  "[3]: https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/ \"Decreto Executivo n.º 134/19 — Modelos declarativos do IVA\"",
  "" ];
fs.writeFileSync(path.join(root, "docs/pgca-pending-concrete-detail-2026-08-26.md"), lines.join("\n"));
const csvRows = rows.map(r => [r.code, r.name, r.parentCode ?? "", r.level ?? "", r.evidencePagesCandidate.join(","), "Quadro oficial; natureza; regra de movimentação; lançabilidade"].map(v => `"${String(v).replaceAll('"', '""')}"`).join(";"));
fs.writeFileSync(path.join(root, "docs/pgca-pending-concrete-detail-2026-08-26.csv"), ["codigo;designacao;pai;nivel;paginas_ocr_candidatas;evidencia_pendente", ...csvRows].join("\n"));
console.log(JSON.stringify({pending: rows.length, classes: Object.fromEntries(byClass), output: ["docs/pgca-pending-concrete-detail-2026-08-26.md", "docs/pgca-pending-concrete-detail-2026-08-26.csv"]}, null, 2));
