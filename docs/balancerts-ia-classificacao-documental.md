# Balancerts IA — Classificação documental assistida

## Objectivo

Foi implementada a primeira tarefa funcional assistida do Balancerts IA: classificação documental para revisão humana. A IA pode analisar um conjunto limitado de metadados seguros de um documento e produzir uma sugestão persistente, mas não altera o documento, impostos, séries, lançamentos contabilísticos, tesouraria, stock ou submissões AGT.

## Modelo de sugestão

A tabela `balancertsIaSuggestions` conserva a empresa, organização, utilizador que iniciou a análise, alvo, tarefa, provider, modelo, confiança, chave de idempotência, resumo de entrada, estado anterior, proposta, nota e decisão de revisão. Os estados são `PROPOSED`, `APPROVED`, `REJECTED` e `EXPIRED`.

Cada documento possui uma chave de idempotência determinística baseada na empresa, documento e hash ou data de criação. Repetir o pedido devolve a sugestão existente em vez de criar uma duplicação.

## Segurança e efeitos

A consulta inicial verifica a empresa, organização e proprietário da sessão. O conteúdo enviado ao provider é limitado a tipo, estado, tipo de contraparte, regime de IVA, moeda e totais; não são enviados ficheiros integrais nem chaves. A sugestão guarda a evidência antes/depois e a aprovação grava auditoria com `applied: false`.

A aprovação é deliberadamente uma decisão sobre evidência, não uma aplicação automática. O ERP continua a exigir que qualquer alteração fiscal, contabilística ou documental seja executada através dos fluxos próprios, com permissões, validações e auditoria independentes.

## Centro desktop

O módulo `/ia` recebeu o Centro de revisão humana. O operador autorizado selecciona um documento, solicita classificação, consulta a confiança e a proposta, adiciona uma nota opcional e aprova ou rejeita a evidência. A interface mantém a moldura Windows, a empresa activa, os estados persistentes e os rótulos portugueses.

## Validação

Foi aplicada a migração `0028_neat_magma.sql`. Foram adicionados testes de providers, router tRPC, RBAC, isolamento, revisão com `applied: false`, idempotência e rótulos de apresentação. A validação final aprovou **59 ficheiros de teste e 214 testes**, TypeScript sem erros, build de produção e revisão visual do módulo Balancerts IA.

A AGT permanece desligada. A activação de providers Azure/OpenAI exige credenciais do servidor e consentimento operacional separado.
