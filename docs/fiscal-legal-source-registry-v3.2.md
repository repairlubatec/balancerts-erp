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


## 8. Páginas institucionais de âmbito operacional

| Área | Fonte institucional | Conteúdo confirmado | Limitação de activação |
|---|---|---|---|
| IAC | [Portal do Contribuinte — IAC](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-aplicacao-de-capitais) | Secções A/B, incidência, liquidação, obrigação declarativa e indicação operacional de 5%, 10% e 15%. | Ligar ao DLP n.º 2/14 e alterações vigentes; não activar apenas com a página-resumo. |
| IS | [Portal do Contribuinte — IS](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo) | Incidência por tabela anexa, sujeitos passivos, pagamento no mês seguinte e declaração anual. | Tabela anexa e alterações/OGE ainda exigem fonte primária e mapeamento. |
| IEC | [Portal do Contribuinte — IEC](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-especial-consumos) | Incidência sobre bens, produção/importação, base tributável e remissão para tabelas do Código. | Cadeia Lei 8/19 → Lei 18/19 ainda precisa de alterações posteriores e anexos completos. |
| IVM | [Portal do Contribuinte — IVM](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-veiculos-motorizados) | Categorias, isenções, critérios e tabelas operacionais de valores fixos. | Confrontar integralmente a Lei n.º 24/20, anexos e ajustes OGE antes de activação. |

Estas fontes são classificadas como `GUIA INSTITUCIONAL / REFERÊNCIA OPERACIONAL`. Servem para descobrir escopo e obrigações, mas não substituem o diploma, a tabela anexa, a versão consolidada ou a prova de vigência exigida pelo motor.


## 9. Circular AGT 01/GACA/GJ/AGT/2026

| Elemento | Registo |
|---|---|
| Fonte | [AGT — Circulares 2026](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/circulares#collapse2398) |
| PDF | `circular-01-gaca-gj-agt-2026.pdf` — 9 páginas; SHA-256 `744ff21a4ce718b3070de2228683d091927ecb424a498e267b6eb37152133e49` |
| Data/objecto identificado | 5 de Janeiro de 2026; medidas tributárias relacionadas com o OGE 2026 |
| Estado | `A CONSOLIDAR — OCR, exige conferência visual` |
| Efeitos candidatos | IVA 5% para equipamentos industriais sob condições; limiares IVA; IRT; II; IS/IVA em plataformas digitais; benefícios fiscais; perdão de juros |
| Regra de segurança | Não tratar estes itens como taxas permanentes. Exigir artigo, condição, vigência e expiração; manter bloqueados até conferência humana do PDF. |

A Circular declara revogar a Circular n.º 01/GACA/GJ/AGT/2025 e a Circular n.º 019/GJ/AGT/2024 e aplicação imediata. Estes efeitos temporais serão tratados como camada normativa datada, nunca como substituição do Código do IVA, do Código do II ou do PGCA-82-01.


## 10. Circulares AGT 09 e 12 de 2026

| Diploma | Função | Estado | Tratamento seguro |
|---|---|---|---|
| Circular n.º 09 GACA/GJ/AGT/2026 | Sentido e alcance do n.º 3 do artigo 41.º da lei do OGE 2026 | `A CONSOLIDAR — PDF image-only` | Não activar sem conferência visual e determinação exacta do efeito sobre obrigações/taxas. |
| Circular n.º 12/AGT/2026 | Esclarecimento sobre aproveitamento útil e efectivo de prédios rústicos agrícolas/pecuários para efeitos de isenção do IP | `A CONSOLIDAR — OCR` | Tratar como critério interpretativo e documental, não como nova taxa ou isenção autónoma. |

A Circular 12 exige, entre outros elementos, prova por títulos de concessão, planos de exploração, registos de produção, relatórios técnicos ou licenças sectoriais, e prevê efeitos diferenciados para áreas parcialmente aproveitadas. Estes requisitos só podem entrar no fluxo de validação do IP após conferência visual do PDF institucional.


## 11. Cadeia temporal de facturação e submissão electrónica

| Diploma | Estado temporal | Tratamento no ERP |
|---|---|---|
| DP n.º 292/18 | `HISTÓRICO` — revogado pelo DP 71/25 | Preservar para auditoria de documentos antigos; não usar para novas emissões. |
| DP n.º 144/23 | `HISTÓRICO` — revogado pelo DP 71/25 | Preservar para rastreabilidade; não usar como regime actual de auto-facturação. |
| DP n.º 312/18 | `A CONSOLIDAR` — regime de submissão electrónica; n.os 1 e 5 do artigo 2.º derrogados pelo DP 71/25 | Aplicar apenas após delimitar a parte não derrogada e a compatibilidade com SAF-T/relatórios. |
| DP n.º 71/25 | `A CONSOLIDAR` — novo Regime Jurídico das Facturas | Base temporal actual para facturas, documentos relevantes, arquivo, facturação electrónica e auto-facturação, pendente de mapeamento integral. |

A cadeia não é uma substituição simples: exige determinar o que o DP 71/25 revoga, o que derroga do DP 312/18 e quais procedimentos AGT posteriores complementam o regime.


## 12. IEJ e actividade de jogos

| Fonte | Confirmação | Estado | Regra de activação |
|---|---|---|---|
| [Lex.AO — Lei n.º 17/24, de 28 de Outubro](https://lex.ao/docs/assembleia-nacional/2024/lei-n-o-17-24-de-28-de-outubro/) | Aprova a Lei da Actividade de Jogos; publicada no DR I Série n.º 206, pág. 12128; revoga a Lei n.º 5/16. | `A CONSOLIDAR` | Usar como base sectorial. Exigir regulamentação fiscal, tabelas, modelos e artigos específicos antes de criar regras IEJ no motor. |

A menção a um sistema fiscal especial no preâmbulo não é, por si só, uma taxa ou regra de liquidação parametrizável.


## 13. Materiais operacionais AGT 2026

| Material | URL institucional | Estado | Limite de uso |
|---|---|---|---|
| Calendário Fiscal 2026 | [PDF AGT/MINFIN](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mziw/~edisp/minfin5320492.pdf) | `REFERÊNCIA OPERACIONAL` | Apoia calendários e obrigações; não substitui a lei nem prova taxas. |
| Folha Tributária n.º 94 — Junho 2026 | [PDF AGT/MINFIN](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw42/nzm5/~edisp/minfin6739845.pdf) | `REFERÊNCIA EXPLICATIVA` | Apoia localização de actualizações; não é fonte autónoma para parametrização normativa. |
| Guia IVM | Link institucional exposto no portal AGT | `REFERÊNCIA OPERACIONAL` | Não substituir o Código/tabelas do IVM; exigir fonte normativa para cálculos. |

Estes materiais são úteis para a camada de controlo e alertas de obrigações, mas permanecem separados da camada de diplomas, tabelas e regras activáveis.

## 14. Verificação dos materiais AGT 2026

Os PDFs do Calendário Fiscal 2026 e da Folha Tributária n.º 94 foram obtidos do repositório institucional e verificados tecnicamente. Permanecem na categoria `REFERÊNCIA OPERACIONAL/EXPLICATIVA`, sem autoridade autónoma para alterar taxas, isenções ou regras de liquidação.


## 15. PDFs primários anexados em 26-08-2026

| Fonte | Ficheiro | Páginas | SHA-256 | Evidência visual confirmada | Estado ERP |
|---|---|---:|---|---|---|
| Decreto n.º 82/01, de 16 de Novembro | `Decreton.º82-01de16deNovembro_AprovaoPlanoGeraldeContabilidade.pdf` | 97 | `04359cb12d48a20cc5326ca001cd0597b1904a7d99d376b1820e8be40f332c89` | Cabeçalho do Diário da República e aprovação do PGC nas pp. 1–3; conta 75.3 e subcontas legíveis na p. 55; regras de natureza/movimento legíveis nas pp. 70–73 | `VISUALLY_CONFIRMED` apenas para os trechos registados; não activar o plano global |
| Lei n.º 14/23, de 28 de Dezembro | `Lein1423mini.pdf` | 77 | `d9fa7e618a32a134853e761126e7851c331f5620a0eee87be4ce7aae380545d6` | Cabeçalho e republicação do Código do IVA nas pp. 1–3; art. 19.º e taxas nas pp. 8–9; arts. 74.º–78.º na p. 24 | `VISUALLY_CONFIRMED` apenas para os artigos/páginas registados; não activar a cadeia completa |

A classificação acima é granular: confirma os trechos visualmente legíveis e não transforma a conferência parcial em aprovação integral de todas as contas, anexos, taxas, isenções ou regras do diploma.


### Complemento visual da Lei n.º 14/23

A republicação integral do Código do IVA nas páginas 44–45 confirma o artigo 19.º com a mesma estrutura de taxas observada nas páginas 8–9: 14% geral, 7% regime simplificado, 7% hotelaria/restauração, 5% bens alimentares/insumos dos anexos e 1% Cabinda nas condições indicadas. O n.º 4 fixa a taxa vigente no momento da exigibilidade. Este bloco foi classificado como `VISUALLY_CONFIRMED` no escopo exacto das páginas revistas; a aprovação da regra no motor continua dependente da cadeia normativa completa e da governação prevista.


## Decreto Presidencial n.º 180/19 — camada contabilística IVA

**Ficheiro anexado:** `/home/ubuntu/upload/DecretoPresidencialn180.19.pdf`  
**Integridade:** PDF 1.5, 12 páginas, A4, 1 809 578 bytes, produtor `GPL Ghostscript 9.18`, autor/metadado `Jurisnet`, SHA-256 `1178226f04a13abf6fbd9ab4e6830a92f7d5a5bcc2ae826457ee8eeb273b5694`.  
**Classificação:** diploma de camada contabilística do IVA, relacionado com a base PGCA-82-01; não substitui o Decreto n.º 82/01.  
**Páginas visualmente confirmadas:** pp. 8–11, incluindo 34.5.4–34.5.9, 34.6, 63.5, 75.3.1.2 e o Anexo II com 4640–4647.

O estado documental passou de `SOURCE_CANDIDATE` para **`VISUALLY_CONFIRMED` no escopo das páginas 8–11**. A aprovação operacional das regras no motor permanece condicionada à conferência da cadeia completa, vigência aplicável, anexos/modelos e aprovação formal prevista pelo fluxo fail-closed.


## Decreto Executivo n.º 134/19 — modelos declarativos do IVA

**Ficheiro anexado:** `/home/ubuntu/upload/decreto-executivo-n-o-134-19-de-10-de-junho_ministerio-das-financas_lex-ao.pdf`  
**Integridade:** PDF 1.3, 15 páginas, A4, 772 633 bytes, produtor `FPDF 1.7`, autor/metadado `Jurisnet`, SHA-256 `640cdb4674f0159c85ee4182525245ee3f6dc02e2cc584a7ec6d3a04895e9bee`.  
**Classificação:** diploma declarativo/procedimental do IVA, relacionado com a Lei n.º 14/23, o DP 180/19 e a cadeia histórica, sem substituir o PGCA-base.  
**Páginas visualmente confirmadas:** pp. 4–8 e 12–15, incluindo Modelo 06, Declaração Periódica Modelo 7, anexos de clientes/fornecedores, regularização de créditos duvidosos/incobráveis, pedidos de restituição, declaração de regime transitório e mapa de fornecedores.

O estado documental foi actualizado para **`VISUALLY_CONFIRMED` no escopo das páginas revistas**. A classificação não autoriza activar taxas, contas ou regras de lançamento; apenas suporta a modelação controlada de formulários, campos, anexos e trilhos documentais.
