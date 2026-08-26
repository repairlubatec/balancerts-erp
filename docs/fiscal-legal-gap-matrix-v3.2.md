# Matriz de Lacunas Legais — Angola V3.2

**Data de corte:** 26 de Agosto de 2026  
**Finalidade:** orientar a auditoria do corpus fiscal do BALANCERTS.ERP.  
**Princípio:** lacuna documental não é preenchida por inferência, cópia web ou dado de teste.

| Área | Base identificada | Lacuna concreta | Evidência exigida | Impacto no ERP | Estado |
|---|---|---|---|---|---|
| PGC/PGCA | Decreto n.º 82/01 e 765 entradas importadas | Natureza, regra débito/crédito, lançabilidade e páginas legíveis ainda não fechadas para todas as contas | PDF oficial legível, página por conta/regra, hash e confirmação humana | Bloqueia activação e posting | `OPEN — CRITICAL` |
| IVA | Lei 7/19, Lei 17/19, DP 180/19, DE 134/19, Lei 14/23 | Cadeia temporal consolidada, anexos/modelos e vigência de alterações posteriores | PDFs primários, artigos/anexos, tabela de alterações e aprovação | Bloqueia taxas, isenções, contas IVA e modelos declarativos não confirmados | `OPEN — CRITICAL` |
| IVA — contas | DP 180/19 identifica 34.5, 34.6, 63.5 e 75.3.1.2 em fonte secundária | Conferência visual literal das contas e movimentos no PDF primário | Página do diploma e confirmação humana | Não activar movimentos por texto secundário | `OPEN — HIGH` |
| Imposto Industrial | Lei 19/14 e Lei 26/20; DE 83/19; DP 194/20 | Regras actuais de taxas, reintegrações, provisões, preços de transferência e autofacturação | Código consolidado e diplomas regulamentares primários, incluindo tabelas/modelos | Motor permanece parametrizado sem activar regras adicionais | `OPEN — HIGH` |
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
