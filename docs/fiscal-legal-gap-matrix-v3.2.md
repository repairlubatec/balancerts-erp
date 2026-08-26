# Matriz de Lacunas Legais — Angola V3.2

**Data de corte:** 26 de Agosto de 2026  
**Finalidade:** orientar a auditoria do corpus fiscal do BALANCERTS.ERP.  
**Princípio:** lacuna documental não é preenchida por inferência, cópia web ou dado de teste.

| Área | Base identificada | Lacuna concreta | Evidência exigida | Impacto no ERP | Estado |
|---|---|---|---|---|---|
| PGC/PGCA | Decreto n.º 82/01 e 765 entradas importadas | Natureza, regra débito/crédito, lançabilidade e páginas legíveis ainda não fechadas para todas as contas | PDF oficial legível, página por conta/regra, hash e confirmação humana | Bloqueia activação e posting | `OPEN — CRITICAL` |
| IVA | Lei 7/19, Lei 17/19, DP 180/19, DE 134/19, Lei 14/23 | Cadeia temporal consolidada, anexos/modelos e vigência de alterações posteriores | PDFs primários, artigos/anexos, tabela de alterações e aprovação | Bloqueia taxas, isenções, contas IVA e modelos declarativos não confirmados | `OPEN — CRITICAL` |
| IVA — contas | DP 180/19 identifica 34.5, 34.6, 63.5 e 75.3.1.2 em fonte secundária | Conferência visual literal das contas e movimentos no PDF primário | Página do diploma e confirmação humana | Não activar movimentos por texto secundário | `OPEN — HIGH` |
| Imposto Industrial | Lei 19/14, Lei 26/20 e Lei 27/22; DE 83/19; DP 194/20 | Regras actuais de taxas, incluindo alteração do artigo 73.º, reintegrações, provisões, preços de transferência e autofacturação | Código consolidado e diplomas regulamentares primários, incluindo tabelas/modelos | Motor permanece parametrizado sem activar regras adicionais | `OPEN — HIGH` |
| IRT | Lei 18/14 e Lei 28/20 | Tabelas actuais por grupo, deduções, isenções e modelos | Código/tabelas/modelos oficiais vigentes | Cálculo salarial não deve presumir escalões | `OPEN — HIGH` |
| Imposto Predial | Lei 20/20; DP 191/21 | PDF primário, tabelas e eventuais alterações posteriores | Código, regulamento e tabelas oficiais | Avaliação/liquidação predial bloqueada como cálculo legal | `OPEN — HIGH` |
| IVM | Lei 24/20 | Tabelas, categorias, pagamento, modelos e alterações posteriores | Lei e modelos oficiais primários | Sem cálculo automático de IVM | `OPEN — HIGH` |
| IEC | Lei 8/19; Lei 18/19 | Anexos I/II, taxas por produto, rectificações e vigência consolidada | PDFs primários com tabelas anexas legíveis | Não activar taxas IEC | `OPEN — CRITICAL` |
| IAC | DLP 2/14 | Alterações posteriores, incidência, taxas, retenções e modelos | Código/tabelas/modelos oficiais | Cálculo IAC bloqueado | `OPEN — HIGH` |
| Imposto do Selo | DLP 3/14 e tabela anexa | Tabela actual, alterações por OGE e modelos/procedimentos | Código, tabela anexa e OGE/diplomas oficiais | Cálculo IS bloqueado | `OPEN — CRITICAL` |
| SISA/Sucessões/Doações | Página oficial de imposto identificada | Diploma base, taxas, isenções, modelos e vigência consolidada | PDFs oficiais e tabelas | Motor não deve inferir transmissões patrimoniais | `OPEN — HIGH` |
| Legislação geral | Lei 21/14; Lei 21/20; DP 245/21; DE 456/17; DE 372/17 | PDFs primários e relações de alteração/revogação | Fonte institucional e documentos integrais | NIF, execução e impressos permanecem condicionados | `OPEN — HIGH` |
| Benefícios fiscais | Lei 8/22; DP 213/23 | Âmbito, regimes, condições, limites, certificados e vigência | Código/regulamentos/modelos oficiais | Não aplicar benefício por etiqueta manual sem prova | `OPEN — HIGH` |
| Facturação | DP 71/25; AGT; DP 292/18 histórico; DE 73/19 | PDF institucional do DP 71/25, entrada em vigor, modelos e certificação; relação com DE 74/19/Rectificação 10/19 | Diploma primário e materiais AGT oficiais | Emissão deve manter estado condicionado até prova de conformidade | `OPEN — CRITICAL` |
| Autofacturação | DP 194/20 | Regras actuais, âmbito e modelos após novo regime de facturas | Diploma e modelos oficiais | Fluxo de autofacturação não activar por histórico | `OPEN — HIGH` |
| SAF-T AO | XSD oficial SAFTAO1.01_01.xsd e validação estrutural já integrada | Completar validação semântica, fiscal e de origem; confirmar versão exigida por período | XSD, manual AGT e regras oficiais vigentes | Estrutural pode validar; aceitação fiscal externa continua fora | `OPEN — HIGH` |
| OGE 2026 | Lei 14/25 e Circular 1 GACA/GJ/AGT/2026 identificadas no índice | Obter PDFs primários e mapear alterações reais por imposto | Lei, circular e anexos oficiais | Não alterar taxas do motor por índice ou notícia | `OPEN — CRITICAL` |
| Sectores IVRM | Legislação do Imposto sobre Valor dos Recursos Minerais | Diploma, regulamentos, tabelas e procedimentos sectoriais | Fonte ministerial/AGT/Diário da República | Fora do cálculo geral até corpus fechado | `OPEN — MEDIUM` |
| IEJ | Legislação vigente do Imposto Especial sobre Jogos | Diploma, taxas, tabelas e procedimentos oficiais | Fonte primária e modelos | Não activar cálculo IEJ | `OPEN — MEDIUM` |
| CEOC | Código/regime de execução e cobrança | Diplomas, prazos e procedimentos actuais | Fonte primária e manuais oficiais | Alertas apenas informativos até confirmação | `OPEN — MEDIUM` |

## Critérios de fecho

Uma linha só pode mudar para `CLOSED` quando a equipa tiver anexado a fonte primária, validado a integridade do PDF, identificado artigos/anexos relevantes, fechado alterações/revogações e vigência, e registado aprovação humana com actor, data, hash e escopo. Para contas PGCA, é ainda obrigatório confirmar código, designação literal, pai, nível hierárquico, natureza, regra de movimentação e se a conta é movimentável.

## Consequência actual

A matriz não autoriza activar o PGCA, IVA, taxas ou modelos. O comportamento correcto é **fail-closed**: permitir pesquisa, revisão, preparação e simulação explicitamente rotuladas, mas rejeitar posting, emissão ou cálculo legal quando a cadeia documental ou a validação normativa estiver incompleta.

## Referências

[1]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391 "AGT — Legislação Fiscal"
[2]: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3 "AGT — Regime Jurídico das Facturas"
[3]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[4]: https://lex.ao/docs/presidente-da-republica/2025/decreto-presidencial-n-o-71-25-de-20-de-marco/ "Lex.AO — Decreto Presidencial n.º 71/25"
[5]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-8-19-de-24-de-abril/ "Lex.AO — Lei n.º 8/19"


## Actualização de 26-08-2026 — classificação adicional

A classificação detalhada por pasta/área encontra-se em [fiscal-legal-item-classification-v3.2.md](./fiscal-legal-item-classification-v3.2.md). Foram acrescentadas evidências institucionais para OGE 2026, IAC, Imposto do Selo, IEC e IVM. A matriz mantém como lacunas os PDFs primários integrais, anexos/tabelas, alterações posteriores e prova de vigência quando não estão fechados.

A correcção normativa mais relevante é que o Decreto Presidencial n.º 92/25 foi retirado da cadeia de facturação e classificado como Estatuto Orgânico da AGT. A cadeia de facturação continua a exigir análise própria do Decreto Presidencial n.º 71/25 e dos diplomas complementares.


## Circular AGT 01/2026 — lacunas temporais adicionadas

A Circular AGT 01/GACA/GJ/AGT/2026 foi obtida como PDF institucional, mas é image-only e o seu texto foi extraído por OCR. A matriz passa a exigir confirmação visual dos seguintes pontos antes de qualquer activação: condições do IVA de 5% para equipamentos industriais, limiares dos regimes de IVA, isenção de IRT indicada, dedutibilidade agrícola/pecuária, isenções de IVA/IS em plataformas digitais, regras de perdão de juros e restrições aos benefícios em reinvestimento.

Cada ponto deve ser registado como regra temporal de 2026, com artigo, condição, data inicial, data final ou evento de cessação, prioridade face ao Código e referência à Circular. Nenhum destes candidatos altera actualmente o resultado do motor fiscal.


## IEJ — actualização normativa

A Lei n.º 17/24, de 28 de Outubro, substitui a Lei n.º 5/16 no plano sectorial da actividade de jogos. A lacuna permanece aberta quanto ao sistema fiscal especial referido no preâmbulo: faltam identificar, obter e validar os artigos fiscais, regulamentos, tabelas e modelos que possam alimentar o motor. A lei sectorial, isoladamente, não autoriza a criação de taxas IEJ.


## Evidências primárias anexadas — estado granular

| Área | Evidência confirmada | Lacuna que permanece | Efeito fail-closed |
|---|---|---|---|
| PGCA-base | Decreto n.º 82/01: aprovação do PGC nas pp. 1–3; conta 75.3 e subcontas na p. 55; descrições de natureza/movimento nas pp. 70–73; SHA-256 `04359cb12d48a20cc5326ca001cd0597b1904a7d99d376b1820e8be40f332c89` | Conferência integral das 765 contas, hierarquia completa e regras de todas as contas movimentáveis | Não activar PGCA-82-01 globalmente |
| IVA — taxas | Lei n.º 14/23, art. 19.º, pp. 8–9: 14% geral, 7% simplificado, 7% hotelaria/restauração, 5% bens alimentares/insumos dos anexos e 1% regime especial de Cabinda nos termos visíveis; SHA-256 `d9fa7e618a32a134853e761126e7851c331f5620a0eee87be4ce7aae380545d6` | Confronto com toda a cadeia 7/19, 17/19, DP 180/19, DE 134/19 e demais alterações; tabelas/anexos completos | Manter regras como candidatas/pendentes até a cadeia completa estar aprovada |
| IVA — regras especiais | Lei n.º 14/23, arts. 74.º–78.º, p. 24: Imposto do Selo, não aceitação do IVA dedutível, reporte TPA, comércio electrónico e pagamento diferido | Mapeamento jurídico e operacional detalhado, modelos declarativos e dependências externas | Não activar automaticamente estes comportamentos |
| Contas IVA específicas | O Decreto n.º 82/01 anexado confirma o quadro-base e a p. 55 não contém as contas posteriores 34.5/34.6/63.5/75.3.1.2 | Conferência do DP 180/19 e prova primária das contas IVA posteriores | Preservar camadas separadas; não substituir o plano-base |

A matriz passou a distinguir **trecho primário visualmente confirmado** de **cobertura integral ainda pendente**. Nenhuma lacuna foi preenchida por inferência.


## Lote Resultados/IVA — conferência visual dirigida

| Elemento | Evidência primária conferida | Estado | Limite de activação |
|---|---|---|---|
| Classe 8 — Resultados | Decreto n.º 82/01, p. 57: contas 81–89 e subcontas de resultados transitados, operacionais, financeiros, extraordinários, imposto sobre lucros e resultado líquido | `VISUALLY_CONFIRMED` no escopo da página | Não activar sem confirmar natureza/movimento de cada conta movimentável |
| Classes 6–7 e conta 75.3 | Decreto n.º 82/01, pp. 51–56: proveitos, custos, impostos e conta 75.3 — Impostos, incluindo subcontas legíveis de Imposto do Selo, Imposto de Capitais, Contribuição Predial e Outros Impostos | `VISUALLY_CONFIRMED` no escopo das páginas revistas | Não interpretar 75.3 como substituto das contas criadas por diplomas IVA posteriores |
| Critérios de valorização e reconhecimento | Decreto n.º 82/01, pp. 63–67: existências, métodos de custeio, valor realizável líquido, contratos de construção e percentagem de acabamento | `VISUALLY_CONFIRMED` | Regras interpretativas não são activadas como parametrização automática |
| Taxas e vigência IVA | Lei n.º 14/23, pp. 8–9, 25 e 44–45: taxas e entrada em vigor/republicação | `VISUALLY_CONFIRMED` no escopo revisto | Cadeia histórica e anexos ainda exigem confronto integral |
| Contas IVA posteriores | DP 180/19 não está entre os dois PDFs anexados; as contas 34.5/34.6/63.5/75.3.1.2 não são atribuídas ao Decreto n.º 82/01 | `SOURCE_CANDIDATE`/pendente | Requer PDF primário legível do DP 180/19 e conferência visual própria |

A separação entre **Resultados/IVA do plano-base** e **camada IVA posterior** foi mantida sem sobreposição de códigos ou regras.


## DP 180/19 — evidência da camada contabilística IVA

| Elemento | Evidência primária | Estado | Limite de activação |
|---|---|---|---|
| Contas da classe 34.5 | DP 180/19, pp. 8–9: IVA regularizações, apuramento, a pagar, a recuperar, reembolsos pedidos e liquidações oficiosas | `VISUALLY_CONFIRMED` no escopo pp. 8–9 | Requer mapeamento integral das subcontas e aprovação da cadeia |
| 34.6 | DP 180/19, p. 9: Certificado de Crédito Fiscal a Compensar, natureza devedora e contrapartidas visíveis | `VISUALLY_CONFIRMED` no escopo p. 9 | Não activar sem confirmar os fluxos de reembolso/compensação completos |
| 63.5 | DP 180/19, p. 9: rubrica IVA para regularizações anuais por cálculo do pro-rata | `VISUALLY_CONFIRMED` no escopo p. 9 | Confirmar subcontas analíticas e vigência operacional |
| 75.3.1.2 | DP 180/19, p. 9: IVA não dedutível e regularizações sem imputação específica | `VISUALLY_CONFIRMED` no escopo p. 9 | Não confundir com a 75.3 do Decreto n.º 82/01 |
| Anexo II 4640–4647 | DP 180/19, pp. 10–11: IVA suportado, dedutível, liquidado, regularizações, apuramento, a pagar, a recuperar e reembolsos | `VISUALLY_CONFIRMED` no escopo pp. 10–11 | Confirmar se a nomenclatura anexa é aplicável ao âmbito actual do ERP antes de parametrizar |

A prova do DP 180/19 fecha a existência documental da camada contabilística IVA, mas **não autoriza activação automática**. O estado de governação permanece dependente da cadeia normativa consolidada, dos anexos e da aprovação humana formal.


## Decreto Executivo n.º 134/19 — camada declarativa e procedimental

| Elemento | Evidência primária visual | Estado | Limite de activação |
|---|---|---|---|
| Modelo 06 | DE 134/19, pp. 4–5: início, alteração e cessação de actividade; regime, sujeito passivo, contabilista e opções de IVA | `VISUALLY_CONFIRMED` no escopo revisto | Suporta formulários e validações, não cria regras de lançamento |
| Declaração Periódica Modelo 7 | DE 134/19, p. 6: identificação, operações, dedução, apuramento, imposto a pagar/recuperar | `VISUALLY_CONFIRMED` no escopo revisto | Requer mapeamento integral dos campos e versões vigentes |
| Anexos de Clientes e Fornecedores | DE 134/19, pp. 7–8: NIF, documentos, valores tributáveis, IVA e taxas | `VISUALLY_CONFIRMED` no escopo revisto | Não activar exportação oficial sem validar formato e canal AGT |
| Regularização de créditos | DE 134/19, pp. 12–13: créditos duvidosos/incobráveis, facturas, contabilista, anexos e parecer | `VISUALLY_CONFIRMED` no escopo revisto | Requer validação dos requisitos do artigo 49.º do CIVA |
| Restituição do IVA | DE 134/19, p. 13: representações diplomáticas, consulares e organismos internacionais | `VISUALLY_CONFIRMED` no escopo revisto | Não activar fluxo sem requisitos externos e elegibilidade confirmados |
| Regime transitório | DE 134/19, pp. 14–15: declaração transitória, dedução, mapa de fornecedores e não sujeição | `VISUALLY_CONFIRMED` no escopo revisto | Distinguir regime histórico/transitório da operação corrente |

O PDF contém o início do Decreto Executivo n.º 135/19 na metade inferior da página 15; esse conteúdo foi excluído da classificação do DE 134/19 para evitar mistura de diplomas.


## Lei n.º 17/19 — alteração e Anexo I do IVA

| Elemento | Evidência primária visual | Estado | Limite de activação |
|---|---|---|---|
| Alterações ao CIVA | Lei n.º 17/19, pp. 2–3: artigos 5.º, 6.º, 9.º, 10.º, 12.º, 14.º, 18.º, 21.º, 22.º, 23.º e 31.º | `VISUALLY_CONFIRMED` no escopo revisto | Requer composição temporal com Lei 7/19, DP 180/19, DE 134/19 e Lei 14/23 |
| Imposto cativo | p. 3, artigo 21.º: exclusões de operações e sujeitos/serviços expressamente visíveis | `VISUALLY_CONFIRMED` no escopo revisto | Não activar regras de cativo sem mapear todas as condições e excepções |
| Direito à dedução | p. 3, artigos 22.º e 23.º: âmbito e condições do direito à dedução | `VISUALLY_CONFIRMED` no escopo revisto | Requer confrontação com contas e procedimentos do DP 180/19 |
| Entrada em vigor | p. 4, artigo 4.º: 1 de Outubro de 2019 | `VISUALLY_CONFIRMED` | Usar como marco temporal da camada, não como activação actual isolada |
| Anexo I | p. 4: classificação pautal de bens alimentares essenciais | `VISUALLY_CONFIRMED` no escopo revisto | Exige importação exacta de todos os códigos/descritivos e ligação às regras de taxa |
| Conteúdo de Lei 18/19 | p. 4, parte inferior: início de diploma distinto | Excluído | Não misturar na fonte Lei 17/19 |

A Lei n.º 17/19 foi inserida na cadeia histórica sem substituir a Lei n.º 7/19 nem a Lei n.º 14/23. A activação material continua sujeita à consolidação temporal e à aprovação formal.


## Lei n.º 7/19 — diploma-base original do CIVA

| Elemento | Evidência primária visual | Estado | Limite de activação |
|---|---|---|---|
| Taxa geral | p. 10, artigo 19.º: 14% e taxa do momento da exigibilidade | `VISUALLY_CONFIRMED` no escopo revisto | Deve ser confrontada com alterações/republicação e vigência corrente |
| Imposto cativo | pp. 10 e 13: artigo 21.º e obrigações de submissão do anexo | `VISUALLY_CONFIRMED` no escopo revisto | Requer todas as entidades, percentagens e excepções mapeadas |
| Dedução e exclusões | pp. 11–12: artigos 22.º a 28.º | `VISUALLY_CONFIRMED` no escopo revisto | Requer composição temporal e regras DP 180/19 |
| Obrigações e facturação | pp. 13–14: artigos 31.º a 38.º | `VISUALLY_CONFIRMED` no escopo revisto | Não activar submissão AGT sem contrato/formato oficial corrente |
| Regime de caixa | p. 21: artigos 67.º e 69.º | `VISUALLY_CONFIRMED` no escopo revisto | Distinguir regime especial das operações gerais |
| Modelos e anexos | pp. 22–25: artigos 73.º–74.º e Anexos I–IV | `VISUALLY_CONFIRMED` no escopo revisto | Importar integralmente tabelas e modelos com versionamento |
| Entrada em vigor | p. 25, artigo 4.º: 1 de Julho de 2019 | `VISUALLY_CONFIRMED` | Marco histórico; não determina sozinho o regime operacional actual |

A Lei n.º 7/19 completa a fonte inicial da cadeia `Lei 7/19 → Lei 17/19 → DP 180/19 → DE 134/19 → Lei 14/23`. O exemplar também contém o início da Lei n.º 8/19, mantida fora desta classificação.


## Actualização de 26-08-2026 — CGT e páginas institucionais adicionais

| Área | Evidência obtida | Lacuna/bloqueio | Estado seguro |
|---|---|---|---|
| Legislação geral — CGT base | Lei n.º 21/14, PDF de 38 páginas, SHA-256 `205431275264aea954a307ddb39007fa3c8cb6e29852f25d58e742016afe3175`; conferência visual pp. 1–3 e 36–38; aprovação do CGT, revogação do código anterior, vigência em 01-01-2015 e disposições finais | Falta conferência visual integral e mapeamento completo de artigos, remissões e legislação complementar | `OPEN — HIGH`; evidência `VISUALLY_CONFIRMED` apenas no escopo indicado |
| Legislação geral — alteração CGT | Lei n.º 21/20, PDF de 14 páginas, SHA-256 `39d9a82850eadc65a507703f948b0a1f516c9d23eac1f899dc4e9ea58d2ae0e4`; conferência visual pp. 1–3 e 13–14; alterações, aditamentos, revogações e entrada em vigor | Falta mapear todos os artigos alterados/aditados para dependências do motor e validar diplomas posteriores | `OPEN — HIGH`; evidência `VISUALLY_CONFIRMED` apenas no escopo indicado |
| Imposto Industrial | Página oficial apresenta incidência, regimes, taxas operacionais de 25%, 10%, 35% e pagamento provisório de 2% | Código completo, diplomas alteradores, tabelas/modelos e vigência devem ser confirmados por PDFs primários | `OPEN — HIGH`; `SOURCE_CANDIDATE` |
| IRT | Página oficial apresenta grupos A/B/C, regras de matéria colectável, taxas B/C de 25% e 6,5% e prazos | Tabela do Grupo A, código consolidado, deduções, isenções, modelos e alterações posteriores ainda exigem fontes primárias | `OPEN — HIGH`; `SOURCE_CANDIDATE` |
| Imposto Predial | Página oficial apresenta incidência, isenções, matéria colectável, taxas operacionais e prazos | Código, tabela integral, regulamentos, modelos e alterações posteriores ainda não estão fechados | `OPEN — HIGH`; `SOURCE_CANDIDATE` |
| Imposto do Selo | Página oficial remete as taxas para a tabela anexa e apresenta incidência, isenções, pagamento e declaração anual | A tabela anexa, alterações, modelos e vigência são indispensáveis; a página não basta para calcular | `OPEN — CRITICAL`; `SOURCE_CANDIDATE` |

### Regra de activação

Nenhum valor publicado nas páginas institucionais foi convertido em regra activa. O CGT foi integrado no registo como diploma transversal de procedimento e garantias, mas a activação permanece condicionada à cobertura documental e aprovação humana exigidas pelo modelo fail-closed.


## Evidência institucional adicional — cronologia e modelos

| Elemento | Evidência institucional | Limite | Estado seguro |
|---|---|---|---|
| Cronologia CIP/CGT/IVM/CII/CIRT | Notícia oficial do Portal confirma datas de publicação/aplicação associadas às Leis n.º 20/20, 21/20, 24/20, 26/20 e 28/20 | A notícia tem uma referência inconsistente ao CII/Código Predial e não substitui os diplomas integrais | `SUPPORTING_EVIDENCE`; não activar |
| Transição do CIRT em 2020 | Notícia oficial distingue rendimentos até Agosto sob o quadro anterior e rendimentos a partir de Setembro sob a Lei n.º 28/20 | Falta cadeia posterior e tabela corrente aplicável em 2026 | `SUPPORTING_EVIDENCE`; não activar |
| Modelos fiscais | Página oficial de formulários enumera modelos de II, IRT, IS e IP | Necessário descarregar cada ficheiro, verificar hash, campos, versão e vigência antes de exportar pelo ERP | `OPEN — HIGH` |

As fontes auxiliares reforçam a localização e a cronologia, mas não fecham as lacunas críticas de tabelas, taxas e modelos. O motor permanece fail-closed.


### Lei n.º 27/22 — actualização após PDF fornecido pelo utilizador

O PDF fornecido tem 3 páginas, é byte-a-byte idêntico ao candidato Lex e foi conferido visualmente. A página 3 confirma a alteração do artigo 73.º do Código do Imposto Industrial, a taxa de 6,5% sobre a matéria colectável e a entrada em vigor em 1 de Janeiro de 2023. A evidência do conteúdo do diploma fica `VISUALLY_CONFIRMED_PRIMARY_CONTENT`, com proveniência `HOSTED_COPY_LEX`.

A confirmação não fecha o CII completo nem as alterações e tabelas associadas. Permanecem obrigatórios a validação integral da cadeia do Imposto Industrial, a cobertura das regras dependentes, o registo de aprovação normativa e o readiness sem bloqueadores. A taxa de 6,5% continua `BLOCKED` para cálculo, facturação, posting e relatórios oficiais.


### Actualização após recepção dos quatro PDFs — confirmação de conteúdo, não activação

| Área | PDF fornecido | Conteúdo visual confirmado | Estado seguro |
|---|---|---|---|
| Imposto Industrial | Lei n.º 19/14, 19 páginas | CII, regime transitório, revogações, entrada em vigor, artigo 73.º base e regras de liquidação | `VISUALLY_CONFIRMED_PRIMARY_CONTENT`; cálculo global ainda condicionado à cadeia posterior |
| IRT | Lei n.º 28/20, 25 páginas | Alteração do CIRT, grupos A/B/C, taxa de 6,5% e 25% nos grupos B/C, tabela do Grupo A e entrada em vigor | `VISUALLY_CONFIRMED_PRIMARY_CONTENT`; tabelas posteriores e vigência corrente ainda condicionadas |
| Imposto do Selo | DLP n.º 3/14, 11 páginas | Código republicado, revogações, obrigações, fiscalização e Anexo A com actos e taxas | `VISUALLY_CONFIRMED_PRIMARY_CONTENT`; alterações/tabela corrente ainda condicionadas |
| Imposto Predial | Lei n.º 20/20, 10 páginas | Código, revogações, entrada em vigor, taxas-base, liquidação, transmissões e obrigações | `VISUALLY_CONFIRMED_PRIMARY_CONTENT`; cadastro, regulamentação e actualizações ainda condicionados |

Os quatro ficheiros fornecidos são byte-a-byte idênticos aos candidatos Lex/Jurisnet anteriormente preservados. A confirmação visual do conteúdo reduz as lacunas documentais, mas não autoriza a promoção automática de taxas, porque a proveniência do ficheiro não é uma descarga institucional verificável, as alterações posteriores e tabelas vigentes não estão todas fechadas e a aprovação normativa formal não foi registada.
