# Correcção auditada do lançamento 3420001

## Âmbito

A Repair Lubatec confirmou os códigos PGC `4511` e `6131` para a reparação dos dois `accountId` órfãos encontrados no lançamento `3420001`, com descrição **“Cama”**, período 09/2023 e moeda AOA.

A verificação mostrou que `4511` e `6131` eram IDs internos sem linha correspondente em `chartAccounts`; não eram códigos válidos persistidos. Os valores originais eram um débito de 50 000 AOA e um crédito de 50 000 AOA.

## Mapeamento aplicado

| Referência anterior | Conta persistida aplicada | Código PGC normalizado | Designação | ID interno |
|---|---|---:|---|---:|
| `accountId=4511` | `45.1.1` existente | `4511` | Caixa Repair Lubatec, correspondente a Caixa Kwanza | `60009` |
| `accountId=6131` | `61.3.1` criada | `6131` | Mercadorias — Mercado nacional | `90003` |

Para preservar a hierarquia do plano de contas, foram criadas também as contas agregadoras `61 — Vendas` e `61.3 — Mercadorias`, ambas não postáveis. A conta `61.3.1` é a conta postável utilizada na linha de crédito.

## Garantias da correcção

A alteração não apagou o lançamento, não alterou a sua descrição, período, estado, moeda, débito, crédito ou data. Apenas substituiu as duas referências internas órfãs por IDs existentes e tenant-aware. A operação foi executada pelo comando idempotente `pnpm db:repair:journal-3420001` e foi registada na cadeia append-only de auditoria com a correlação `repair:journal-entry:3420001:pgc-20260820`.

Foram registados eventos de criação para as três contas novas e o evento `JOURNAL_ORPHAN_REFERENCES_REPAIRED` para o lançamento. O evento inclui o estado anterior, o mapeamento posterior, os códigos PGC normalizados e a indicação de que os valores foram preservados.

## Validação posterior

A auditoria read-only verificou as 17 relações críticas e devolveu `ok: true`, com `orphanCount: 0` em todas as relações, incluindo `journalLines.accountId → chartAccounts.id`. O lançamento continua equilibrado: débito de 50 000 AOA e crédito de 50 000 AOA.

Esta correcção resolve a inconsistência referencial histórica. A validação contabilística da natureza económica da operação continua a ser responsabilidade do contabilista da Repair Lubatec; o sistema não inferiu novos valores nem criou documentos fiscais ou submissões AGT.
