# Linha de base da auditoria — Contabilidade e Tesouraria

## Escopo
Auditoria do BALANCERTS.ERP face ao trabalho contabilístico e financeiro de empresas angolanas, sem declarar certificação AGT nem homologação bancária.

## Capacidades identificadas no código

| Área | Capacidades persistentes encontradas | Evidência local |
|---|---|---|
| Exercício e período | Exercícios anuais, períodos mensais, estados aberto/em encerramento/fechado/reaberto | `drizzle/schema.ts`, `server/db.ts` |
| Plano contabilístico | Contas por empresa, código, nome, hierarquia, lançabilidade e vigência | `chartAccounts`, `accounting.accounts`, `AccountingWorkbenchPanel` |
| Diário | Lançamentos de dupla partida, linhas a débito/crédito, moeda e taxa | `journalEntries`, `journalLines`, `postJournalEntry` |
| Suporte documental | Documento de origem, ficheiro do arquivo, referência, diário, centro e dimensão analítica | `journalEntries`, `accounting.post` |
| Relatórios | Diário, razão, balancete, resultados, balanço, reconciliação e rastreabilidade | `server/reports.ts`, `server/routers.ts` |
| Importação | CSV com pré-validação, resolução de códigos PGCA, limite de 500 linhas e idempotência por linha | `AccountingImportPanel`, `importJournalEntriesForUser` |
| Analítica | Centros de custo por empresa, criação auditada e campos analíticos no lançamento | `costCenters`, `accounting.costCenters` |
| Fecho | Avaliação, encerramento e reabertura auditados com RBAC | `closing` router, `fiscalPeriods` |
| Tesouraria | Contas de caixa/banco, pagamentos, recebimentos, movimentos por período, reconciliação e idempotência | `cashAccounts`, `payments`, `treasuryTransactions` |
| Controlo | Isolamento por empresa/organização, RBAC, auditoria e testes de regressão | `permissions.ts`, matriz de auditoria, suite Vitest |

## Limites já visíveis

A linha de base não prova, por si só, conformidade legal nem cobertura completa do mercado. Deve ser comparada com fontes oficiais angolanas, requisitos de bancos e práticas de contabilistas. Em particular, é necessário verificar versão oficial do PGCA, mapas exigidos, IVA/IRT/II conforme actividade, retenções, moeda e câmbio, reconciliação bancária por extracto, controlos de caixa, pagamentos em lote, aprovação, segregação de funções, fechos, inventário e integração AGT.

## Estado da implementação na data da auditoria

O projecto tem checkpoint `d008e9dd` com 60 ficheiros de teste e 219 testes aprovados, TypeScript e build aprovados. Esta informação é estado técnico do projecto, não uma declaração de certificação fiscal, contabilística ou bancária.
