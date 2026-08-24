# Auditoria completa do módulo de Contabilidade e Relatórios

**BALANCERTS.ERP — Parecer técnico**  
**Data:** 25 de Agosto de 2026  
**Âmbito:** plano de contas PGCA, lançamentos, regras de movimentação, relatórios financeiros, exportações, reconciliação e experiência desktop.

## Conclusão executiva

> **O módulo de Contabilidade está funcional para o conjunto reduzido de dados persistidos e os relatórios apresentam cálculos reconciliados nesse conjunto. Contudo, o plano PGCA anexado não está completamente incorporado nem activo como plano operacional integral.**

A base de dados contém uma versão `PGCA-82-01` na organização 1, com estado `UNDER_REVIEW`, 27 contas PGCA persistidas — todas marcadas como confirmadas —, 2 fontes confirmadas e zero regras contabilísticas activas. O workflow do sistema exige uma versão validada, fontes e contas confirmadas e cobertura completa de regras antes da activação. Portanto, não é tecnicamente correcto afirmar que o novo plano de contas está completamente incorporado no ERP.

Os relatórios principais funcionam sobre lançamentos `POSTED` e `APPROVED`. A base contém 1 lançamento publicado e aprovado, com 2 linhas e 18 contas operacionais em `chartAccounts`. Nesse universo, o balancete, o diário, a razão, a demonstração de resultados, o balanço e as reconciliações são calculados e testados. Isto prova a integridade do motor para os dados existentes, mas não prova cobertura integral do PGCA, dos fluxos automáticos ou das regras de movimentação legalmente confirmadas.

## 1. Estado de incorporação do plano de contas

| Elemento verificado | Estado encontrado | Parecer |
|---|---:|---|
| Versão normativa persistida | `PGCA-82-01`, `UNDER_REVIEW` | **Bloqueada para activação** |
| Contas PGCA persistidas | 27 | Parcial face ao documento anexado |
| Contas PGCA confirmadas | 27/27 | Confirmadas no registo actual, mas não equivalem à totalidade anexada |
| Fontes persistidas | 2/2 confirmadas | Insuficiente para concluir toda a cadeia documental do anexo |
| Regras contabilísticas activas | 0 | **Bloqueador de activação** |
| Contas operacionais (`chartAccounts`) | 18 | Universo operacional reduzido e distinto do staging PGCA |
| Lançamentos publicados | 1, com 2 linhas | Base funcional mínima |
| Cobertura normativa integral | Não demonstrada | **Não aprovada como completa** |

O workflow confirma que `UNDER_REVIEW` não é uma versão operacional. A validação só pode ocorrer depois de todas as contas e fontes estarem confirmadas; a activação exige ainda cobertura das operações obrigatórias de compras, vendas, stock, tesouraria, salários e imobilizado. Como existem zero regras activas, a activação da versão está correctamente impedida.

### 1.1. Diferença entre staging e base operacional

A matriz CSV do documento anexado contém **715 registos de dados**, além do cabeçalho. O histórico do preflight e o painel de staging apresentam a versão operacional de análise como **714 contas reconhecidas**, pelo que existe uma diferença de contagem que deve ser explicitamente reconciliada antes de qualquer importação normativa. A matriz identifica 86 extensões reservadas, 4 contas genéricas proibidas, 15 códigos duplicados e 25 pais em falta. O preflight marca a fonte como não segura para importação normativa e não segura para activação.

A interpretação correcta é que o anexo permanece em **staging documental**. As 27 contas persistidas não representam a incorporação integral dos 715 registos da matriz, e as 18 contas operacionais não devem ser apresentadas como substitutas automáticas do novo PGCA.

## 2. Lançamentos, validações e regras de movimentação

A validação de lançamentos implementa as invariantes essenciais de partida dobrada: pelo menos duas linhas, débito igual a crédito dentro da tolerância de 0,005, valores não negativos, uma única natureza por linha, contas postáveis e validade temporal das contas. O ciclo documental impede regressões indevidas depois de emissão ou contabilização.

A interface bloqueia novos lançamentos quando não existe uma versão PGCA activa e confirmada. A importação CSV exige igualmente versão activa e contas confirmadas e lançáveis. O painel P1 restringe saldos iniciais e regularizações às contas confirmadas e lançáveis de uma versão activa.

| Área | Resultado da auditoria | Classificação |
|---|---|---|
| Partida dobrada | Testada e aprovada | Conforme |
| Contas não postáveis | Rejeitadas pelo validador | Conforme |
| Validade temporal | Verificada pelo validador | Conforme |
| Estado documental | Transições e imutabilidade testadas | Conforme |
| Bloqueio sem PGCA activo | Implementado | Conforme |
| Regras automáticas por operação | Zero regras activas na base | **Bloqueador operacional** |
| Confirmação normativa das 715 linhas | Ainda não concluída | **Bloqueador normativo** |

Existe uma limitação importante: a base aritmética dos lançamentos está coberta, mas os testes não constituem uma prova completa de cada regra de movimentação do PGCA, IVA ou das operações automáticas. Essas regras continuam dependentes de confirmação primária e humana.

## 3. Relatórios e cálculos

O motor principal utilizado pelas consultas do servidor encontra-se em `server/reports.ts`. Os relatórios usam apenas lançamentos publicados e aprovados, agregam por código de conta e calculam valores monetários com arredondamento a duas casas.

| Relatório | Implementação | Estado observado |
|---|---|---|
| Balancete | Agregação por conta com totais de débito/crédito e reconciliação | Funcional no universo persistido |
| Diário | Ordenação cronológica por data e identificador de lançamento | Funcional |
| Razão | Filtro por conta e saldo corrido débito menos crédito | Funcional, limitado ao conjunto publicado |
| Demonstração de resultados | Classes/prefixos 6 e 7, rendimentos, gastos e resultado líquido | Funcional, requer validação semântica integral |
| Balanço | Prefixos 1/2, 3/4 e 5, com resultado líquido no capital próprio | Funcional, requer validação semântica integral |
| Resumo IVA | Agrupamento por regime e estado, com reconciliação aritmética | Implementado e testado |
| Antiguidade de saldos | Clientes e fornecedores por vencimento | Implementado e exposto nos relatórios |
| Registo fiscal | Totais líquidos, IVA e total | Implementado e reconciliável |
| Origem documental | Documentos contabilizáveis sem lançamento e lançamentos órfãos | Implementado |
| Reconciliação agregada | Cinco verificações no painel financeiro | Observada como 5/5 no cenário persistido |
| SAF-T AO | Preparação local e exportação bloqueada até validação AGT | Correctamente bloqueado para submissão externa |

A verificação visual da rota `/relatorios` mostrou o balancete com `45.1.1 — Caixa Repair Lubatec` e `61.3.1 — Mercadorias — Mercado nacional`, totais de 50.000,00 AOA a débito e a crédito e indicação de reconciliação 5/5. O painel também apresenta análise financeira global, gráficos, antiguidade de saldos, CSV, Excel, impressão PDF e arquivo PDF.

### 3.1. Limitações técnicas dos relatórios

A demonstração de resultados e o balanço são derivados por prefixos de código. Esta abordagem é determinística e funciona para a classificação actual, mas fica acoplada à estrutura textual dos códigos e não a uma classificação normativa confirmada por natureza, classe e regra de apresentação. A futura incorporação integral deve confirmar formalmente o mapeamento de todas as contas antes de usar estes mapas para relatórios legais.

Existe também um helper alternativo em `server/report-suite.ts`, baseado em `accountType`, enquanto o caminho principal usa `server/reports.ts` e prefixos. A duplicação pode criar divergência futura e deve ser consolidada ou documentada como camada de teste/compatibilidade.

A exportação CSV da análise financeira usa uma composição simples com separador `;` e não implementa escaping completo de aspas, separadores ou quebras de linha. Os dados actuais exportados são maioritariamente numéricos, mas a função deve ser endurecida antes de ser considerada exportação geral de produção.

O painel `AccountingReportsPanel` apresenta os mapas contabilísticos e totais, mas não expõe em cada separador um indicador explícito da propriedade `reconciled`; essa informação aparece no painel financeiro agregado. Para utilização contabilística, cada mapa deveria mostrar claramente o estado de reconciliação e a razão de bloqueio quando não existirem dados.

## 4. Interface desktop e experiência sem scroll global

A verificação visual das rotas `/contabilidade` e `/relatorios` em 1280×720 confirmou uma composição de software desktop: barra de operações no topo, contexto de empresa/exercício/período, comandos de lançamento/importação no topo e painéis compactos. Não foi observado scroll global da janela como mecanismo oculto para encontrar campos essenciais. As tabelas usam contenção própria e os relatórios distribuem os gráficos e os mapas em cartões operacionais.

O fluxo de Contabilidade mostra empresa activa, exercício 2023, período Setembro aberto, comandos `Novo lançamento` e `Importar documento`, abas operacionais e acessos a lançamentos, documentos e pesquisa. O fluxo de Relatórios apresenta o balancete e os indicadores financeiros sem depender de um formulário escondido no fim da página.

A verificação visual não substitui testes de interacção com dados reais. Deve ainda ser confirmada a navegação por teclado, a exportação efectivamente descarregada, a impressão PDF e o comportamento em janelas menores.

## 5. Testes executados

A verificação de tipos terminou sem erros. Os testes direccionados de Contabilidade, PGCA e Relatórios aprovaram **38 testes em 9 ficheiros**. A suite global aprovou **552 testes em 140 ficheiros**.

Os testes cobrem invariantes contabilísticas, construtores de relatórios, reconciliação, SAF-T, workflow PGCA, validação PGCA, painel de trabalho e simulador de regras. Ainda assim, a cobertura de integração end-to-end entre interface, consultas tRPC, base real, exportação e impressão é inferior à cobertura unitária dos construtores.

## Parecer final

| Dimensão | Parecer |
|---|---|
| Plano PGCA completamente incorporado | **Não** — permanece `UNDER_REVIEW`, com apenas 27 contas persistidas e zero regras activas |
| Activação normativa | **Bloqueada correctamente** até confirmação integral e cobertura de regras |
| Lançamentos básicos | **Funcionais e protegidos** no universo validado |
| Relatórios financeiros | **Funcionais e reconciliados** para os dados persistidos |
| Relatórios como mapas legais completos | **Ainda não demonstrado** sem cobertura integral do PGCA e mapeamento semântico confirmado |
| Exportações | **Disponíveis**, com melhoria recomendada no escaping CSV e validação end-to-end |
| Interface desktop sem scroll global | **Conforme na verificação visual** realizada |
| Estado geral do módulo | **Funcional em base controlada, não pronto para declarar incorporação normativa integral** |

### Prioridade das correcções recomendadas

**P0 — Não declarar o PGCA completo.** Manter a versão em revisão, a activação bloqueada e a distinção entre staging, contas PGCA persistidas e plano operacional.

**P1 — Reconciliar a contagem do staging.** Explicar formalmente a diferença entre 714 contas reconhecidas no preflight/painel e 715 registos de dados na matriz CSV, sem eliminar ou inventar um registo.

**P1 — Completar confirmação normativa e regras.** Só depois da fonte primária legível, confirmação humana, desambiguação dos códigos e cobertura de compras, vendas, stock, tesouraria, salários e imobilizado deve existir uma versão validada/activa.

**P2 — Consolidar o motor de relatórios.** Eliminar ou documentar a duplicação entre `server/reports.ts` e `server/report-suite.ts`, substituindo prefixos por classificação semântica confirmada quando o catálogo estiver normativamente fechado.

**P2 — Endurecer exportações e integração.** Adicionar escaping CSV completo, testes de descarga no browser e indicadores de reconciliação por mapa.

**P2 — Ampliar testes end-to-end.** Testar empresa, exercício, período, filtros, contas, lançamentos, relatórios, exportações, estados vazios e isolamento entre organizações com dados controlados.

## Base técnica consultada

| Fonte interna | Finalidade |
|---|---|
| `server/pgc-workflow.ts` | Estados, pré-requisitos e bloqueios de activação PGCA |
| `server/reports.ts` | Motor principal dos relatórios e reconciliações |
| `server/db.ts` | Consultas de lançamentos e relatórios por empresa/período |
| `client/src/components/AccountingWorkbenchPanel.tsx` | Interface do plano activo, filtros, importação e bloqueios |
| `client/src/components/AccountingReportsPanel.tsx` | Mapas contabilísticos e totais |
| `client/src/components/FinancialDashboardPanel.tsx` | Gráficos, antiguidade, exportações e reconciliação |
| `docs/matriz-conformidade-plano-contas-anexado-2026-08-24.csv` | Matriz de staging do documento anexado |
| `scripts/pgc-document-preflight.mjs` | Preflight não destrutivo da fonte PGCA |
| `server/accounting.test.ts`, `server/reports.test.ts`, `server/pgc.workflow.test.ts` | Evidência de testes unitários e de workflow |

**Conclusão:** o módulo de Contabilidade e Relatórios encontra-se tecnicamente funcional para a base controlada actual, mas a incorporação integral do plano de contas PGCA e a prontidão normativa dos relatórios ainda não estão concluídas.
