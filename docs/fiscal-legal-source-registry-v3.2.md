# Registo de Fontes Legais — Auditoria Fiscal Angola V3.2

**Projecto:** BALANCERTS.ERP  
**Data de corte:** 26 de Agosto de 2026  
**Estado:** registo documental em consolidação; nenhuma nova taxa ou regra material é activada por este ficheiro.

## 1. Regra de classificação

> Um diploma só pode alimentar cálculo, posting, emissão ou validação fiscal depois de existir uma fonte primária identificável, um PDF preservado com hash, confirmação do texto relevante, vigência temporal e aprovação humana formal. Um índice institucional ou uma cópia Lex.AO serve para localizar e cruzar, mas não substitui automaticamente o PDF primário.

| Estado | Critério operacional | Pode alimentar cálculo actual? |
|---|---|---:|
| `CONFIRMADO` | Fonte institucional/primária identificada, diploma e texto relevante conferidos, vigência fechada e aprovação registada. | Sim, dentro do escopo confirmado |
| `A CONSOLIDAR` | Diploma identificado, mas alterações, vigência, anexos ou cadeia ainda não fechados. | Não |
| `PDF OFICIAL A LOCALIZAR` | A necessidade normativa é conhecida, mas o PDF oficial directo ainda não foi obtido. | Não |
| `HISTÓRICO` | Diploma preservado para contexto ou transição e explicitamente excluído do cálculo actual. | Não |
| `CÓPIA SECUNDÁRIA` | PDF obtido de repositório jurídico não institucional; serve para OCR/comparação, não para activação. | Não |

## 2. Fontes estruturantes do ERP

| Domínio | Diploma/camada | Ano | Fonte de localização | Evidência local | Estado actual | Decisão segura |
|---|---|---:|---|---|---|---|
| PGC/PGCA | Decreto n.º 82/01 | 2001 | [Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/legislacao) e fontes oficiais a confrontar | `docs/normative-sources/decreto-82-01-pgca.pdf` | `A CONSOLIDAR` | Manter canónico; não activar contas sem natureza e movimento confirmados |
| IVA base | Lei n.º 7/19 | 2019 | [Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado) | `legal-pdfs-2026-08-26/lei-7-19-lexao.pdf` | `CÓPIA SECUNDÁRIA` | Preservar como origem histórica da cadeia IVA |
| IVA alteração | Lei n.º 17/19 | 2019 | [Lex.AO](https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-17-19-de-13-de-agosto/) | `legal-pdfs-2026-08-26/lei-17-19-lexao.pdf` | `CÓPIA SECUNDÁRIA` | Aplicar só após confronto primário e vigência |
| IVA contas/regulamento | Decreto Presidencial n.º 180/19 | 2019 | [Lex.AO](https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/) | `legal-pdfs-2026-08-26/decreto-presidencial-180-19-lexao.pdf` | `CÓPIA SECUNDÁRIA` | Preservar a ligação ao PGC e confirmar contas 34.5, 34.6, 63.5 e 75.3.1.2 por fonte primária |
| IVA modelos | Decreto Executivo n.º 134/19 | 2019 | [Lex.AO](https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/) | `legal-pdfs-2026-08-26/decreto-executivo-134-19-lexao.pdf` | `CÓPIA SECUNDÁRIA` | Não activar modelos sem anexos legíveis e vigência confirmada |
| IVA republicação | Lei n.º 14/23 | 2023 | [Lex.AO](https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/) | `legal-pdfs-2026-08-26/lei-14-23-lexao.pdf` e cópia recebida | `A CONSOLIDAR` | É a camada central de consolidação, não apaga a cadeia de 2019 |
| Facturação actual | Decreto Presidencial n.º 71/25 | 2025 | [AGT — legislação fiscal](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391) e [AGT — regime](https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3) | `legal-pdfs-2026-08-26/decreto-71-25-lexao.pdf` | `A CONSOLIDAR` | Prioridade actual; confirmar PDF institucional, entrada em vigor, certificação e modelos |
| Facturação anterior | Decreto Presidencial n.º 292/18 | 2018 | [Lex.AO](https://lex.ao/docs/presidente-da-republica/2018/decreto-presidencial-n-o-292-18-de-03-de-dezembro/) | `legal-pdfs-2026-08-26/decreto-312-18-lexao.pdf` não é este diploma; PDF próprio ainda não fechado | `HISTÓRICO` | Preservar apenas para transição, pois a AGT/Lex.AO indicam revogação pelo DP 71/25 |
| Validação de sistemas | Decreto Executivo n.º 74/19 + Rectificação n.º 10/19 | 2019 | [AGT — legislação fiscal](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391) | PDF institucional ainda não fechado | `PDF OFICIAL A LOCALIZAR` | Bloquear alegações de certificação sem norma e evidência completas |
| NIF | Decreto Presidencial n.º 245/21 | 2021 | [AGT — legislação fiscal](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391) | PDF institucional ainda não fechado | `PDF OFICIAL A LOCALIZAR` | Não inventar validação de NIF |

## 3. PDFs secundários preservados

Os seguintes ficheiros foram descarregados do domínio `files.lex.ao` e têm apenas valor de localização/comparação até validação institucional. Os PDFs adicionais são digitalizações sem texto útil extraível por `pdftotext`.

| Ficheiro | Páginas | SHA-256 |
|---|---:|---|
| `lei-26-20-lexao.pdf` | 9 | `06e316a8541ce4b0dcb2de0fcf1c49695d77fbf7820ff86d3673599b7c6a993b` |
| `lei-28-20-lexao.pdf` | 25 | `db464c65f7d7c48b5df1ac6c41088c665a15627d23effe674dc5fe700dd9ec2b` |
| `lei-24-20-lexao.pdf` | 4 | `a97b844b8dd72cf510a86f1620978ad959ae9e7e487e408cd507968bf9838be8` |
| `lei-18-19-lexao.pdf` | 7 | `5324369a16ea6fb89ddd4377a5501be1b6d287309302cdd0f4a820d84e52febf` |
| `decreto-191-21-lexao.pdf` | 9 | `8333890d162a9ff2d8ca7b906b7df2bf356008b5a2b35b888cf5a41c7b501112` |
| `decreto-194-20-lexao.pdf` | 4 | `a3c281ae8dcaed9f79098b06666ef39a929d8274f93792c80c0483ee36153134` |
| `decreto-312-18-lexao.pdf` | 29 | `cdb922c8facd35b7a10deeb91090475e71c74a4a8d9bb70331bdb70c505e71f7` |
| `lei-8-22-lexao.pdf` | 12 | `dd112e525311b7d4c42a4cbc1aa2903a4a2390c60da451da06b7f103bd312b9d` |
| `decreto-71-25-lexao.pdf` | 21 | `87491719e52d4fb906f7972d0673561218886ff40ab570d4d0d5c0c361ef9ebe` |
| `decreto-92-25-lexao.pdf` | 39 | `b96e9accae8d59272f29cb2a29d01727509447a2737f6bb7f6cd1ecd4b8f4139` |
| `decreto-73-19-lexao.pdf` | 4 | `f4ecce6ebdfd51c1b471f26fba422fb6f565673abfbe478cb86873312dc171b5` |

## 4. Política de activation gate

O motor deve manter `SOURCE_CANDIDATE`, `UNDER_REVIEW` ou estado equivalente até fechar cinco evidências: identidade do diploma; fonte primária; texto/artigo/anexo relevante; vigência e relação com alterações/revogações; aprovação humana auditável. Um PDF secundário, OCR incompleto, página de índice ou taxa publicada no portal sem diploma associado não satisfaz a guarda. Em caso de conflito, ausência ou ilegibilidade, a resolução é `REVIEW_REQUIRED` e o cálculo fica bloqueado.

## 5. Referências institucionais

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[2]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391 "AGT — Legislação Fiscal"
[3]: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3 "AGT — Regime Jurídico das Facturas"
[4]: https://lex.ao/docs/presidente-da-republica/2025/decreto-presidencial-n-o-71-25-de-20-de-marco/ "Lex.AO — Decreto Presidencial n.º 71/25"
[5]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-8-19-de-24-de-abril/ "Lex.AO — Lei n.º 8/19"


## 6. Diplomas adicionais confirmados por localização secundária

| Área | Diploma | Confirmação obtida | Estado seguro |
|---|---|---|---|
| Imposto Industrial | Lei n.º 26/20, de 20 de Julho | Altera o Código aprovado pela Lei n.º 19/14; publicação DR I Série n.º 107, pág. 3841; revoga Lei 4/19 e artigos indicados. | `CÓPIA SECUNDÁRIA / A CONSOLIDAR` |
| IRT | Lei n.º 28/20, de 22 de Julho | Altera o Código do IRT; publicação DR I Série n.º 109, pág. 3875; revoga Lei 9/19 e Lei 28/19. | `CÓPIA SECUNDÁRIA / A CONSOLIDAR` |
| IEC | Lei n.º 18/19, de 13 de Agosto | Altera Lei 8/19; publicação DR I Série n.º 104, pág. 5066; entrada em vigor em 1 de Outubro de 2019; mantém Anexos I/II de taxas. | `CÓPIA SECUNDÁRIA / A CONSOLIDAR` |
| IVM | Lei n.º 24/20, de 13 de Julho | Aprova o IVM; publicação DR I Série n.º 103, pág. 3803; entrada em vigor 30 dias após publicação; taxas em tabelas anexas. | `CÓPIA SECUNDÁRIA / A CONSOLIDAR` |
| Facturação | Decreto Presidencial n.º 71/25, de 20 de Março | AGT lista o diploma; Lex.AO indica novo regime e revogação do DP 292/18. | `A CONSOLIDAR` |
| AGT/estrutura institucional | Decreto Presidencial n.º 92/25, de 29 de Abril | OCR do Diário da República confirma que aprova o Estatuto Orgânico da AGT e revoga o DP 324/14, DP 135/18, DP 215/19 e legislação contrária; não é diploma de facturação. | `CÓPIA SECUNDÁRIA / A CONSOLIDAR` |
| Facturação histórica | Decreto Executivo n.º 73/19, de 6 de Março | Regulamentação/requisitos associados ao regime anterior; deve ser temporalmente ligada ao DP 292/18. | `HISTÓRICO / A CONSOLIDAR` |

A ausência de texto extraível nos PDFs secundários não invalida a sua preservação, mas impede a confirmação automática de artigos, tabelas e taxas. A próxima etapa deve usar OCR/revisão visual e confronto institucional, não importação directa para o motor fiscal.


## 7. OGE 2026 e circulares AGT

| Área | Referência | Evidência localizada | Estado seguro | Acção pendente |
|---|---|---|---|---|
| OGE 2026 | Lei n.º 14/25 | [Portal AGT — Circulares](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/circulares#collapse2398) lista `OGE DE 2026.pdf`; [asset MINFIN](https://cms.minfin.gov.ao/api/assets/portal-minfin/8983392b-8784-45d7-a23d-1aa35cf938b4/) localizado por pesquisa institucional | `OFFICIAL_REFERENCE_ONLY` | Obter o PDF legível, hash, artigos com impacto fiscal e anexos |
| Medidas tributárias 2026 | Circular n.º 01 GACA/GJ/AGT/2026 | Listada no índice do Portal do Contribuinte e nas imagens do utilizador; PDF directo ainda não confirmado | `PDF OFICIAL A LOCALIZAR` | Obter circular e anexos; mapear apenas alterações expressas |

A localização institucional não equivale a validação do conteúdo do asset. O motor fiscal deve continuar a usar apenas versões normativas aprovadas e não deve alterar taxas por referência ao OGE até o confronto documental estar fechado.
