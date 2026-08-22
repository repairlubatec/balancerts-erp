# Catálogo integral PGCA/IVA — revisão e confirmação humana

## Estado da catalogação

Foi gerado um catálogo estruturado a partir do PDF oficial do Decreto n.º 82/01, do OCR correspondente, do PDF auxiliar **PGCA Explicado** e do PDF recebido da Lei n.º 14/23. O Decreto e a Lei continuam a ser as fontes normativas de autoridade; o guia auxiliar serve exclusivamente para melhorar a legibilidade e localizar códigos.

| Domínio | Registos catalogados | Confirmados | A confirmar humanamente | Activação operacional |
|---|---:|---:|---:|---|
| Contas PGCA | 754 | 20 | 734 | Apenas `CONFIRMED` |
| Regras IVA | 9 | 1 | 8 | Apenas `CONFIRMED` |

As **20 contas PGCA confirmadas** correspondem à árvore já validada visualmente e auditada no sistema, incluindo `4`, `45`, `451`, `4511`, `4512`, `453`, `4531`, `6`, `61`, `611`, `6111`, `6112`, `612`, `6121`, `6122`, `613`, `6131`, `614`, `6141` e `6142`. As restantes contas foram preservadas como candidatos de revisão, sem activação operacional.

A regra IVA confirmada é a taxa geral de **14%**, associada ao artigo 19.º da Lei n.º 14/23. A taxa reduzida, a regra de cativação do artigo 21.º e os Anexos I–VI foram catalogados, mas permanecem `NEEDS_HUMAN_CONFIRMATION` até a confirmação literal de artigo, âmbito, taxa, excepções e vigência.

## Política de confirmação

> A catalogação integral não equivale à activação integral. Só registos com estado `CONFIRMED`, fonte identificada, hash verificável, página de prova e hierarquia coerente podem ser utilizados pelos fluxos operacionais.

Cada candidato PGCA contém código, designação OCR, fonte, páginas disponíveis e estado. Cada regra IVA contém identificador, artigo/anexo, tipo, regime, taxa quando conhecida, excerto de prova e estado. Códigos ou textos afectados por mistura de colunas, pontuação de preenchimento, omissões ou caracteres ilegíveis não são normalizados por inferência.

## Fontes e proveniência

| Fonte | Ficheiro | Uso | Estado |
|---|---|---|---|
| Decreto n.º 82/01 | `docs/normative-sources/decreto-82-01-pgca.pdf` | Autoridade da árvore PGCA | Confirmada como fonte primária |
| Lei n.º 14/23 | `docs/normative-sources/lei-14-23-iva.pdf` | Autoridade das regras IVA | Recebida e catalogada; confirmação regra a regra pendente |
| PGCA Explicado | `docs/normative-sources/pgca-explicado-auxiliar.pdf` | Apoio de leitura | Fonte auxiliar, nunca substitutiva |

Os hashes SHA-256 dos PDFs e o catálogo completo estão em `docs/normative-catalog-complete-review.json`. A confirmação humana deve ser registada por lote, preservando código, nome literal, página, fonte, actor, data, estado anterior e estado posterior.

## Lotes recomendados para confirmação humana

A revisão deve prosseguir em lotes homogéneos: classes 1–3; classe 4 — meios monetários; classe 5 — capital e reservas; classes 6–7 — proveitos/custos; classe 8 — resultados; e regras IVA por artigo e anexo. Em cada lote, o revisor deve confirmar visualmente o código, a designação exacta, o pai, o nível, a natureza e se aceita movimentos.

Até essa confirmação, o catálogo é **integral como inventário de revisão**, mas não é declarado como PGCA/IVA integralmente activado. Não foram reclassificados lançamentos históricos e não foram criadas regras operacionais para candidatos pendentes.
