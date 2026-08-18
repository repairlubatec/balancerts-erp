# BALANCERTS.ERP — Relatório de fecho funcional

## Resultado

A revisão foi redireccionada de expansão de funcionalidades para conclusão operacional. Foram corrigidos dois pontos estruturais que afectavam a confiança das tabelas: **Facturação** passou a consultar documentos persistidos da empresa activa através de `documents.list`; **Contabilidade** passou a consultar lançamentos publicados através de `reports.journal`; e **Auditoria** passou a consultar eventos persistidos tenant-aware através de `audit.list`, respeitando RBAC. A rastreabilidade contabilística continua a seleccionar o ID persistente da linha, mesmo quando apresenta a descrição humana do lançamento.

| Verificação | Resultado |
|---|---|
| Matriz de conclusão por módulo | Criada em `docs/matriz-conclusao-produto.md` |
| Guia de utilização | Criado em `docs/guia-operacional-fecho.md` |
| Facturação sem dados demo | Verificado; tabela deriva de documentos persistidos |
| Contabilidade sem dados demo | Verificado; tabela deriva de lançamentos publicados |
| Auditoria sem dados demo | Verificado; tabela deriva de eventos persistidos |
| Empresa activa visível | Verificado nos módulos principais |
| Isolamento tenant-aware | Mantido e coberto pelos testes existentes |
| Repair Lubatec | Não alterada durante a revisão |
| Suite Vitest | 49 ficheiros, 176 testes aprovados |
| TypeScript | Sem erros |
| Build de produção | Aprovado |
| Integração real AGT | Mantida desactivada |

## Critério de produto fechado

A partir deste checkpoint, a prioridade passa a ser manutenção, configuração e correcção de defeitos reproduzíveis. Não serão acrescentados novos módulos ou painéis apenas para aumentar o âmbito. Uma alteração futura só deve ser feita quando corrigir uma função existente, cumprir uma configuração necessária ou tratar uma exigência oficial documentada.

## Limitação oficial

O software permanece em preparação interna para AGT. Credenciais, endpoint definitivo, número de validação, homologação, assinatura oficial e comunicação real não são simulados nem declarados como concluídos. Estes pontos dependem da AGT e da decisão da equipa responsável.
