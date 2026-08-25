# BALANCERTS.ERP — Auditoria independente P0, P1 e P2

**Data da auditoria:** 25 de Agosto de 2026  
**Âmbito:** código de produção, schema Drizzle, routers tRPC, persistência MySQL/TiDB, testes Vitest, TypeScript, build, logs e interface renderizada.  
**Conclusão executiva:** **P0, P1 e P2 não estão 100% implementadas sem ressalvas.** A maior parte dos fluxos locais existe e foi validada, mas foram identificadas lacunas técnicas relevantes que impedem declarar encerramento integral: exportadores aceitam linhas fornecidas pelo cliente em vez de obterem sempre a fonte persistente; o fecho expõe auditoria como verificação não bloqueante; o Stock não valida explicitamente o período e referências opcionais antes de gravar; a depreciação não confirma a existência e o escopo do activo; e o exportador SAF-T local não restringe os documentos ao período seleccionado.

## 1. Critério de auditoria

Um item só foi considerado **Implementado** quando existe código executável no servidor, persistência ou integração real correspondente, autorização server-side e teste ou evidência visual coerente. A presença de um componente, uma descrição no `todo.md` ou um checkpoint não foi aceite isoladamente como prova. Um item foi classificado como **Parcial** quando o fluxo principal existe, mas há uma lacuna de integridade, escopo, segurança ou exactidão que pode produzir resultado incorrecto. **Bloqueado** significa que o sistema protege correctamente uma operação que não pode ser declarada pronta sem evidência oficial. **Externo** significa que depende de ambiente, certificado, credenciais ou aceitação fora do sandbox.

## 2. Resultado consolidado

| Frente | Resultado da auditoria | Evidência principal | Conclusão |
|---|---|---|---|
| P0 — Fallbacks, PGCA, regras, documentos, contabilidade, tesouraria e fecho | **Parcialmente implementada** | `server/routers.ts`, `server/db.ts`, `server/pgc.ts`, `server/closing.ts`, testes integrados | Os fluxos locais existem e estão protegidos, mas permanecem ressalvas no fecho, em fallbacks internos e em atomicidade/conferência de referências. |
| P1 — Clientes/Fornecedores | **Implementada** | `getCounterpartiesForUserCompany`, `createCounterpartyForUser`, `updateCounterpartyForUser`, schema e testes integrados | Ficha, escopo, alteração condicionada por documentos e auditoria estão implementados. |
| P1 — Stock | **Parcialmente implementada** | `recordStockMovement`, `transferStockBetweenWarehousesForUser`, contagens, valorização e reconciliação | O ciclo existe, mas período, documento de origem e lançamento de origem não são validados explicitamente antes de gravar um movimento. |
| P1 — Imobilizado | **Parcialmente implementada** | `fixed-assets.ts`, `createFixedAssetForUser`, `updateFixedAssetForUser`, `postDepreciation` | O ciclo de vida e a depreciação matemática existem, mas o posting não confirma o activo no escopo e não há estado persistente de depreciação no activo. |
| P1 — Relatórios | **Implementada com limitação de volume** | `server/reports.ts`, helpers de relatórios e `ControlReportsPanel.tsx` | Diário, Razão, Balancete, Resultados, Balanço e reconciliações usam dados persistentes; não há paginação no carregamento completo. |
| P1 — SAF-T | **Parcialmente implementada** | `getSaftReadinessForUserCompany`, `getSaftLocalExportForUserCompany`, `buildSaftReadiness` | A prontidão e o bloqueio AGT são reais, mas o pacote local tem problemas de escopo temporal e de completude de campos. |
| P1 — Definições | **Implementada** | `DefinitionsPanel.tsx`, contexto de empresa/organização/períodos/séries | O posto mostra contexto persistente, acessos, normas, séries e estado da integração AGT. |
| P2 — Controlo e qualidade | **Implementada com ressalvas** | `permissions.ts`, `exports.scope.test.ts`, matriz e checklist P2 | RBAC, isolamento, auditoria, idempotência e fronteira SAADI foram cobertos; exportadores ainda confiam em linhas enviadas pelo cliente. |

## 3. P0 — Confronto técnico

### 3.1 P0.1 — Remoção de fallbacks e dados demonstrativos

**Resultado: Parcial.** A interface principal deixou de usar o catálogo genérico como fallback de registos, e as telas verificadas mostram estados persistentes, vazios ou bloqueados em vez de dados de demonstração. Contudo, ainda existem fallbacks em código de produção:

| Localização | Evidência | Impacto |
|---|---|---|
| `server/pgc.ts:484–489` | `fallbackAccount` cria uma representação `ID-{id}` com estado `NOT_CONFIRMED` quando a conta não é encontrada | Em simulação, não publica dados e fica bloqueado; é um fallback defensivo, não um dado demonstrativo, mas mantém uma representação sintética no motor. |
| `server/db.ts:3629–3633` | `operationalId(code, fallback)` usa a conta operacional configurada como fallback quando não existe PGC activo | O processamento salarial pode continuar com `chartAccounts` quando não há versão PGCA activa; isso deve ser uma decisão normativa explícita, não um fallback silencioso, se o requisito for PGCA obrigatório. |
| `server/balancerts-ia/providers.ts:53` | Existe fallback local determinístico quando o runtime de IA falha | É aceitável apenas para sugestões consultivas; deve permanecer claramente separado de qualquer decisão contabilística ou publicação. |

**Conclusão:** a remoção de dados demonstrativos da UI foi implementada, mas a regra “nenhum fallback residual” não está provada como integralmente satisfeita no servidor.

### 3.2 P0.2 e P0.3 — PGCA-82-01 e regras de movimentação

**Resultado: Implementados no âmbito seguro, não homologados.** O workflow PGCA valida fontes, hierarquia, níveis, classe, pais, tipos de conta, relações movimentáveis, duplicados, extensões reservadas e regras dependentes de evidência. A activação está protegida por confirmação e aprovação humana. A interface distingue preparação interna, pendência normativa e homologação externa.

A auditoria não encontrou prova de que todas as contas ou regras do diploma oficial estejam confirmadas; encontrou, pelo contrário, bloqueios explícitos e correctos. Portanto, **“PGCA protegido e pronto para revisão” está implementado; “PGCA integralmente activo e confirmado” não está implementado nem deve ser declarado.**

### 3.3 P0.4 — Facturação e Documentos

**Resultado: Implementado.** O schema contém séries, documentos, linhas e impostos. Os routers expõem criação de rascunho, validação, emissão, contabilização, cancelamento, importação com revisão e exportação. A reserva de numeração é persistente e as transições são server-side. Os testes integrados verificam documento, linha, imposto, lançamento ligado ao documento e auditoria.

A ressalva é a mesma dos exportadores descrita na secção P2: os procedimentos `exports.csv` e `exports.xlsx` recebem `rows` do cliente, logo a exportação não é, por si só, prova de que os valores foram obtidos da base de dados.

### 3.4 P0.5 — Contabilidade e Tesouraria

**Resultado: Implementado com ressalva de integridade operacional.** Lançamentos, pagamentos, recebimentos, reconciliação, referências, idempotência, estornos e actualização da interface existem no servidor e são exercitados pelo teste integrado `expanded-modules.test.ts` e por testes de permissões.

A auditoria confirma que as operações críticas passam por `roleProcedure`, `assertCompanyReady`, escopo de organização/empresa e auditoria. Não foi encontrada uma regressão de chave React nos relatórios ou lançamentos: o painel de relatórios usa chave composta para linhas.

### 3.5 P0.6 — Fecho real de período

**Resultado: Parcial.** O fecho consulta dados persistentes e bloqueia documentos pendentes, impostos pendentes, revisões contabilísticas pendentes e transacções de tesouraria não reconciliadas antes de alterar o estado para `CLOSED`. A reabertura exige motivo e é auditada.

Foram identificadas duas ressalvas:

1. Em `getFiscalPeriodCloseReadinessForUser`, `BANK_RECONCILED` e `AUDIT_COMPLETE` são marcados como `blocking: false`. A mutação de fecho repete a verificação de tesouraria, mas não repete nem bloqueia `openAudit`. Assim, podem existir pendências de auditoria abertas e o período ainda ser fechado.
2. A sequência prontidão → novas consultas → `UPDATE fiscalPeriods` não está encapsulada numa transacção com bloqueio de concorrência. Em concorrência, uma operação pode alterar os dados entre a verificação e o fecho.

A interface mostra o estado real e não é a fonte da decisão; contudo, a declaração de que todos os cinco critérios são igualmente bloqueantes não corresponde ao código actual.

## 4. P1 — Confronto técnico dos módulos principais

### 4.1 Clientes e Fornecedores

**Resultado: Implementado.** O servidor filtra por `companyId` e `organizationAccessCondition`, permite criação e actualização auditadas, e impede alteração de uma contraparte quando já existem documentos emitidos, contabilizados ou cancelados. O teste integrado verifica cliente, fornecedor, alteração, listagem e ligação documental. O schema contém dados de identificação, endereço, contacto, moeda, prazo e limite de crédito.

### 4.2 Stock

**Resultado: Parcial.** O ciclo persistente inclui armazéns, entradas, saídas, transferências, contagens, valorização média e reconciliação com o razão. Transferências usam transacção para criar saída e entrada, verificam armazéns da mesma empresa, disponibilidade e idempotência por `transferGroupId`.

A lacuna está em `recordStockMovement`: há validação de empresa, armazém e valores, mas `periodId`, `sourceDocumentId` e `journalEntryId` não são confirmados explicitamente como existentes e pertencentes à mesma empresa antes da inserção. A própria transferência também recebe `periodId` sem uma validação equivalente. Isso pode criar movimentos com período inválido ou referências órfãs se a integridade não for garantida apenas por constraints físicas.

### 4.3 Imobilizado

**Resultado: Parcial.** A validação do ciclo de vida impede entrada em uso anterior à aquisição, baixa sem data/motivo e dados de alienação em activo ainda activo. A depreciação linear valida custo, valor residual, vida útil e meses decorridos. Criação, actualização, listagem e auditoria são persistentes.

O procedimento `fixedAssets.postDepreciation` valida escopo do utilizador e constrói um lançamento equilibrado, mas não carrega o activo por `assetId` para confirmar que existe, pertence à empresa indicada, está activo, está em uso e ainda tem base depreciável. O `assetId` é usado na descrição e na auditoria. Além disso, o posting não actualiza um acumulado ou estado de depreciação persistente no activo. Portanto, o lançamento matemático existe, mas o ciclo contabilístico completo do activo não está demonstrado como fechado.

### 4.4 Relatórios

**Resultado: Implementado com limitação.** `getJournalRowsForUserCompany` filtra por empresa, organização, estado `POSTED`, revisão `APPROVED` e período opcional. Os builders produzem Balancete, Diário, Razão com filtro de conta, Demonstração de Resultados, Balanço, IVA, antiguidade, origem documental e reconciliação. O `ControlReportsPanel` chama queries tRPC reais, apresenta estados persistentes/vazios/erro e usa chaves compostas para linhas.

A limitação é de escala: as queries carregam o conjunto completo do período/empresa, e `getReportTraceForUserCompany` faz carregamentos adicionais por cada documento de origem. Não existe paginação ou limite de consulta no relatório base. A protecção de exportação a 10.000 linhas não resolve este risco de leitura indiscriminada.

### 4.5 SAF-T

**Resultado: Parcial.** A prontidão usa contagens persistentes de contas, lançamentos, documentos, clientes, fornecedores, produtos e regras fiscais. O resultado distingue `submissionEligible: false`, `externalSubmission: NOT_CONFIGURED` e `AGT_VALIDATION_REQUIRED`. A interface mostra cobertura incompleta e pendências sem afirmar homologação.

O exportador local apresenta três problemas verificáveis:

1. Em `getSaftLocalExportForUserCompany`, os lançamentos são filtrados pelo período, mas `getDocumentsForUserCompany(userId, companyId)` devolve documentos da empresa sem filtro explícito para o período seleccionado.
2. `customerNif`, códigos de produto e descrição de produto são emitidos como `undefined`, e saldos de abertura/fecho das contas são preenchidos com zero. Isso pode ser insuficiente para um pacote SAF-T completo.
3. A prontidão não é chamada dentro do exportador local; o pacote devolve XML local mesmo com `submissionEligible: false`, o que é aceitável para preparação interna, mas deve ser apresentado inequivocamente como pacote não submetível.

### 4.6 Definições

**Resultado: Implementado.** `DefinitionsPanel` consulta a organização, empresa, moeda, regime IVA, períodos, séries, cobertura normativa, configuração AGT e memberships. A interface informa que a integração AGT está apenas preparada localmente e sem comunicação externa activa. A gestão de memberships é apresentada com controlo de papel.

## 5. P2 — Controlo, qualidade e aceitação

### 5.1 RBAC e isolamento

**Resultado: Implementado.** O catálogo de papéis inclui `admin`, `contabilista`, `financeiro`, `operador`, `auditor` e `user`. `roleProcedure` executa autenticação e consulta permissões efectivas por empresa. O wildcard global só é aceite para `admin`; um override `*` não eleva um papel operacional. Os testes provam segregação de lançamento, auditoria, recursos humanos e wildcard.

A auditoria confirma que os principais routers operacionais usam `roleProcedure`. As funções persistentes aplicam adicionalmente `organizationAccessCondition`, `companyId` e, quando aplicável, `organizationId`.

### 5.2 Auditoria, idempotência e concorrência

**Resultado: Implementado para os fluxos cobertos.** O schema de lançamentos contém `idempotencyKey` único; tesouraria e integrações possuem chaves/correlação; transferências têm grupo idempotente; eventos de auditoria têm organização, empresa, actor, estado anterior, estado posterior, correlação, hash e cadeia. Os testes dirigidos cobrem idempotência, reconciliação, auditoria, fecho e isolamento.

A ressalva é que a existência de idempotência num fluxo não significa que todas as mutações tenham transacção atómica. O fecho e alguns updates de ciclo de vida ainda devem ser revistos para garantir comportamento concorrente determinístico.

### 5.3 Exportações e downloads

**Resultado: Parcial.** `exports.csv` e `exports.xlsx` passaram a exigir `organizationId`, `companyId`, `kind`, limite máximo de 10.000 linhas e confirmação server-side de que a empresa pertence ao utilizador e à organização. Os testes `server/exports.scope.test.ts` confirmam autorização e rejeição de empresa fora do escopo.

Contudo, depois de validar o escopo, o servidor serializa directamente `input.rows`. Um utilizador autorizado pode fornecer linhas arbitrárias, incluindo valores que não correspondem à persistência. Isto não permite acesso horizontal, mas quebra a garantia de que uma exportação do ERP representa dados oficiais do ERP. A correcção adequada é fazer o procedimento receber filtros e obter as linhas no servidor, ou aceitar um snapshot assinado gerado pelo servidor.

### 5.4 Fronteira SAADI

**Resultado: Implementado com limitação temporal.** `server/saadi-erp-read.ts` expõe envelopes com `organizationId`, `companyId`, origem `BALANCERTS.ERP`, versão do serviço, classificação `ACTUAL_REALIZED`, autoridade ERP e `integrityHash`. O módulo faz leituras e não tem procedimento de escrita de volta no ERP. Os testes SAADI verificam contratos, permissões, persistência, leitura ERP e ausência de mutação operacional indevida.

Em `readSaadiOperationalSummary`, o parâmetro opcional `periodId` é devolvido no envelope, mas as agregações de documentos, pagamentos, tesouraria, stock, trabalhadores e impostos não o usam nos filtros. Assim, a resposta pode ser apresentada como resumo da empresa inteira enquanto aparenta estar associada a um período. A fronteira de escrita está protegida, mas a semântica temporal do contrato é incompleta.

## 6. Evidência de qualidade e interface

A validação independente executada durante esta auditoria produziu **149 ficheiros de teste aprovados e 581 testes aprovados**. O TypeScript terminou sem erros e o build de produção terminou com sucesso. O build emitiu apenas avisos de chunks superiores a 500 kB, não erros de compilação.

A revisão visual dos postos de Contabilidade, Tesouraria, Facturação, Relatórios, Stock, Imobilizado, Definições e Fiscalidade confirmou:

- contexto persistente da empresa Repair Lubatec e organização activa;
- estados vazios e contagens reais, sem catálogo demonstrativo visível;
- controles de operação agrupados por posto, sem depender de um formulário escondido depois de um scroll global;
- bloqueio visível da cobertura PGCA/SAF-T e distinção entre preparação interna e homologação AGT;
- presença dos separadores Diário e Razão no posto de Relatórios;
- mensagens em português nos módulos observados.

Os logs mostraram um pedido abortado durante actividade de captura/recarregamento (`BadRequestError: request aborted`), mas não mostraram erro persistente de TypeScript, falha de build ou excepção funcional nova durante a validação. O aviso de chunks grandes deve permanecer como risco de desempenho, especialmente para distribuição PWA/desktop.

## 7. Itens não implementados localmente e dependências externas

Os seguintes itens não foram falsamente considerados concluídos:

| Estado | Itens |
|---|---|
| Externo | Restauro real para destino MySQL/TiDB isolado, com URL, hosts permitidos, fingerprint e atestado de isolamento. |
| Externo | Validação de instaladores EXE/MSI numa máquina Windows limpa. |
| Externo | Certificado e assinatura de código Windows. |
| Externo | Credenciais, endpoint e homologação oficial AGT. |
| Externo | Documentação e credenciais de integração bancária. |
| Externo | Aceitação formal com utilizadores Repair Lubatec e dados anonimizados. |
| Bloqueado correctamente | Activação integral do PGCA e regras que carecem de confirmação visual/humana da fonte oficial. |

## 8. Classificação final e recomendações

A classificação final desta auditoria é **NÃO CONFORME PARA DECLARAÇÃO DE IMPLEMENTAÇÃO INTEGRAL DE P0–P2**, embora o produto tenha uma base local substancial e funcional.

As correcções prioritárias são:

1. Fazer o fecho bloquear auditoria aberta ou documentar formalmente que auditoria é apenas indicador não bloqueante; em ambos os casos, alinhar o teste, a UI e a regra de negócio.
2. Validar `periodId`, `sourceDocumentId` e `journalEntryId` no Stock antes de inserir movimentos, com escopo de organização/empresa e constraints adequadas.
3. Validar `assetId`, período e contas no posting de depreciação; impedir depreciação acima do valor depreciável e persistir o acumulado/estado correspondente.
4. Alterar exportadores para obterem dados persistentes no servidor, recebendo filtros em vez de linhas arbitrárias do cliente.
5. Filtrar documentos SAF-T pelo período e completar NIF de cliente, dados de produto e saldos de abertura/fecho quando o formato exigir esses campos.
6. Corrigir `periodId` no resumo operacional SAADI ou remover a aparência de escopo temporal quando o resumo for global.
7. Rever atomicidade/concor­rência do fecho e das mutações de ciclo de vida.
8. Reduzir risco de volume com paginação/limites nos relatórios base e dividir chunks frontend grandes antes da distribuição desktop/PWA.

Depois destas correcções, recomenda-se nova auditoria independente P0–P2 e nova execução da aceitação por ciclo. As dependências externas devem continuar separadas do estado de implementação local.

## Referências internas de evidência

1. `drizzle/schema.ts` — entidades persistentes de organizações, empresas, períodos, lançamentos, documentos, Stock, activos, auditoria e SAADI.
2. `server/routers.ts` — contratos tRPC, RBAC, fecho, Imobilizado, Stock, exportações, relatórios e PGCA.
3. `server/db.ts` — persistência, escopo tenant-aware, fecho, Stock, Imobilizado, relatórios e SAF-T.
4. `server/reports.ts` — builders de Diário, Razão, Balancete, Resultados, Balanço, IVA, reconciliação e prontidão SAF-T.
5. `server/fixed-assets.ts` e `server/fixed-assets-posting.ts` — ciclo de vida e posting de depreciação.
6. `server/saadi-erp-read.ts` — envelopes e leitura BALANCERTS.ERP → SAADI.
7. `server/permissions.ts` e `server/permissions.test.ts` — matriz RBAC e segregação do wildcard.
8. `server/expanded-modules.test.ts` — evidência integrada dos fluxos persistentes e isolamento.
9. `server/exports.scope.test.ts` — testes de escopo tenant-aware dos exportadores.
10. `docs/p2-control-matrix.md` e `docs/p2-acceptance-checklist.md` — intenção operacional e critérios de aceitação, usados apenas como apoio, não como prova isolada.
