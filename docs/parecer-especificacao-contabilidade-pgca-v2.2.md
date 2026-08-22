# Parecer técnico — Especificação do Motor Contabilístico PGCA v2.2

**Estado:** análise prévia, sem implementação  
**Objecto:** `MOTOR CONTABILÍSTICO PGCA — Versão 2.2`  
**Sistema analisado:** BALANCERTS.ERP  
**Conclusão preliminar:** **NÃO APROVADO PARA IMPLEMENTAÇÃO DIRECTA**

## 1. Âmbito e método

A especificação recebida define um motor contabilístico determinístico, auditável e compatível com o PGCA aplicável em Angola. A análise foi feita exclusivamente como revisão arquitectural. Não foram alterados código, schema, dados, permissões, routers, interfaces, migrações ou integrações.

Foram confrontados os requisitos da especificação v2.2 com os princípios vinculativos já aprovados para o BALANCERTS.ERP: o cadastro normativo PGCA como autoridade dos códigos e designações; a separação entre PGCA normativo e plano empresarial; o isolamento por organização e empresa; a activação apenas de informação confirmada; a imutabilidade do Ledger; o posting centralizado; a auditoria; e a ausência de inferências normativas. Também foram consultados o schema actual, os serviços PGCA/contabilidade, os testes existentes e os requisitos de interface desktop.

> Regra determinante da especificação: quando faltar informação normativa, deve ser devolvido `PGCA_DATA_REQUIRED`; o sistema não pode inventar, inferir, renomear, classificar ou mapear uma conta sem evidência normativa.

## 2. Compatibilidade global

A especificação é **conceptualmente compatível** com os Documentos 1 e 2 quanto à separação de bounded contexts, à integração operacional através de eventos/regras, ao controlo humano, à auditoria e à não-invenção. A arquitectura actual também já contém bases úteis: `pgcVersions`, `pgcSources`, `pgcAccounts`, `pgcMigrationMaps`, `accountingRules`, `chartAccounts`, `journalEntries`, `journalLines`, `openingBalances`, controlo de períodos, posting centralizado, estornos e testes tenant-aware.

Contudo, a versão 2.2 não pode ser executada literalmente sobre o schema actual. A implementação existente é uma **fundação parcial**, não uma realização completa da especificação. As entidades necessárias para classificação, mapeamento de apresentação, reclassificação contabilística e reclassificação de apresentação não estão representadas como contrato persistente autónomo. Além disso, alguns campos essenciais do contrato não existem e outros têm semântica diferente.

| Área | Estado actual | Compatibilidade | Classificação |
|---|---|---:|---:|
| Não-invenção PGCA e confirmação humana | Catálogo versionado, fontes e estados existentes | Parcialmente compatível | Alto |
| Plano empresarial ligado ao PGCA | `chartAccounts` não tem `pgcAccountId` nem `organizationId` directo | Incompatível para v2.2 | Alto |
| Classificação e apresentação | Não há entidades equivalentes completas | Incompatível | Bloqueador |
| Diário, linhas e Ledger | Posting, equilíbrio, período, estorno e imutabilidade parcial | Parcialmente compatível | Alto |
| Accounting Rules | Existe tabela versionada por `versionId`, mas sem todos os componentes exigidos | Parcialmente compatível | Alto |
| Reclassificações | Não há modelo completo das duas modalidades | Incompatível | Alto |
| Abertura | `openingBalances` existe, mas não tem `entry_type`/origem formal | Parcialmente compatível | Médio |
| Auditoria e multi-tenant | Implementados e testados em vários fluxos | Compatível com ressalvas | Médio |
| Interface desktop | Workbench sem scroll principal e operações por painel | Compatível | Informativo |

## 3. Bloqueadores

### B-01 — Ausência do motor de classificação e Presentation Mapping

**Secções afectadas:** 6, 7, 11, 25, 26, 27, 28, 30, 35 e 37 da especificação.

A especificação exige a cadeia `PGCA ACCOUNT → ACCOUNT CLASSIFICATION → PRESENTATION MAPPING → STATEMENT SECTION → STATEMENT LINE`. No schema actual não existem entidades persistentes equivalentes a `account_classification`, `presentation_mapping`, `statement`, `statement_section` e `statement_line` com as regras exigidas. Os relatórios existentes são derivados principalmente de `chartAccounts`, `journalEntries` e `journalLines`.

Sem esta cadeia não é possível cumprir de forma determinística contas dependentes do saldo, contas retificadoras, Situação Líquida autónoma, sinais de apresentação, rubricas diferentes por demonstração ou a validação `UNMAPPED_ACCOUNT`. Também não é possível provar que o Balanço e a Demonstração de Resultados foram produzidos pelo motor especificado, em vez de uma classificação implícita no relatório.

**Risco:** demonstrações financeiramente incorrectas ou juridicamente não defensáveis, sobretudo em contas cujo tratamento depende do saldo e em contas retificadoras.

**Correcção documental recomendada:** aprovar primeiro um modelo de domínio para classificação e apresentação, com cardinalidades, regras de vigência, prioridades, sinais, agregação, conflitos e imutabilidade. A implementação só deve começar depois de esse modelo ser compatibilizado com os Documentos 1 e 2 e com o Documento de testes/rollback.

### B-02 — Catálogo PGCA actual não contém todos os atributos normativos exigidos

**Secções afectadas:** 3, 4, 8, 9, 10, 11, 12, 13, 24, 30, 34, 36 e 37.

A tabela actual `pgcAccounts` tem `code`, `name`, hierarquia, `accountType`, `nature`, `balanceType`, `acceptsEntries`, vigência e estado de validação. Não tem, com a semântica da especificação, `account_type` nos valores `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`, `MEMORANDUM`; `normal_balance`; `behavior_type`; `is_contra_account`; `is_balance_dependent`; `requires_partner`; `requires_tax`; `requires_currency`; `requires_reconciliation`; `path`; e uma classificação normativa formal separada.

A diferença entre `accountType = CLASS/GROUP/MOVEMENT/ANALYTICAL` e `account_type = ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE/MEMORANDUM` não é meramente nominal: são dimensões diferentes. A primeira descreve o grau/uso da conta; a segunda descreve a natureza contabilística. O schema actual também possui `nature` e `balanceType`, mas não os transforma num contrato completo equivalente a `normal_balance` e `behavior_type`.

A revisão normativa actual confirmou códigos/designações de um subconjunto e manteve a activação de movimentos bloqueada onde falta evidência primária. Portanto, não é permitido preencher estes campos por primeiro dígito, por nome auxiliar ou por analogia.

**Risco:** falsa conformidade normativa e publicação de regras que o cadastro ainda não suporta literalmente.

**Correcção documental recomendada:** tratar os atributos ausentes como dados normativos a confirmar, não como defaults de implementação. Para cada campo deve existir fonte, página, hash, estado e regra de não-invenção. Onde a fonte não informar, o valor deve permanecer pendente e bloquear a operação correspondente com `PGCA_DATA_REQUIRED`.

## 4. Problemas altos

| ID | Localização | Divergência | Risco | Correcção documental |
|---|---|---|---|---|
| A-01 | Secção 5 | `chartAccounts` não possui `organization_id`, `pgca_account_id`, `is_official`, `is_analytical` e `status`; guarda `parentCode` e nomes sem relação explícita ao cadastro PGCA | Empresa pode alterar ou perder a proveniência da conta oficial | Definir relação explícita e tenant-aware entre conta empresarial e conta PGCA; separar designação oficial de designação empresarial; impedir mapeamento sem PGCA confirmado |
| A-02 | Secções 16–18 | `accountingRules` não possui `condition_expression`, `debit_rule`, `credit_rule`, `tax_rule`, `currency_rule`, `partner_rule` e `version` como contrato completo; usa referências directas a contas PGCA | Regras incompletas, conflito de prioridades e cálculo não determinístico | Definir DTO semântico, versão imutável, vigência, prioridade, conflito e fonte; exigir validação normativa antes de activar |
| A-03 | Secções 20–23 | `journalEntries` não possui `organization_id`, `exercise_id`, `entry_number`, `entry_date`, `document_type`, `document_id`, `source_system`, `source_event_id`, `pgca_version`, `accounting_rule_id` e `accounting_rule_version` | Auditoria e reconstrução histórica incompletas; versão usada no posting pode não ser demonstrável | Mapear o contrato lógico para entidades persistentes sem quebrar históricos; nenhum POSTED pode ficar sem versão e origem identificáveis |
| A-04 | Secção 21 | `journalLines` não possui descrição, parceiro, imposto, montante estrangeiro, centro de custo ou projecto com a semântica pedida | Perda de detalhe analítico, fiscal e de reconciliação | Definir quais campos são obrigatórios por regra/evento e como preservar dados históricos; não adicionar defaults normativos sem evidência |
| A-05 | Secção 22 | O schema usa `idempotencyKey` único, mas não impõe a chave composta `source_system + source_event_id` | Um mesmo evento de origem pode não ser identificável de forma uniforme entre módulos | Formalizar origem/evento como contrato de domínio e manter compatibilidade com a chave existente através de migração não destrutiva posterior |
| A-06 | Secções 14–15 | Não existem modelos completos para `ACCOUNTING_RECLASSIFICATION` e `PRESENTATION_RECLASSIFICATION` | Correcções podem ser feitas por edição, ou a apresentação pode alterar o Ledger indevidamente | Separar as duas operações, com estados, aprovação, auditoria, vigência e proibição de edição destrutiva |
| A-07 | Secções 27–30 | Relatórios actuais não demonstram a cadeia de classificação/mapeamento nem validam universalmente `UNMAPPED_ACCOUNT` | Balanço/DR podem parecer reconciliados sem cumprir o contrato de apresentação | Introduzir validação explícita por demonstração e impedir validação oficial quando faltar classificação ou mapping |
| A-08 | Secções 32 e 37 | `openingBalances` tem `reason`, mas não um `entry_type` controlado com `previous_exercise`, `manual_opening`, `migration`, `initial_setup` | Aberturas não são semanticamente uniformes nem facilmente auditáveis | Definir enum/DTO de origem e transições; manter saldo de abertura como lançamento controlado, nunca como inserção directa no Ledger |
| A-09 | Secções 33–35 | A suite actual cobre equilíbrio, posting, PGCA, isolamento, reversão e relatórios, mas não cobre toda a matriz obrigatória da v2.2 | O critério de aceitação não é verificável integralmente | Criar plano de testes antes da implementação, incluindo contas de terceiros devedoras/credoras, retificadoras, saldo-dependentes, conflitos, migração e reclassificações |

## 5. Problemas médios e baixos

| Classificação | Observação | Consequência | Recomendação |
|---|---|---|---|
| Médio | A especificação usa nomes SQL em `snake_case`, enquanto o projecto usa convenção Drizzle/camelCase (`pgcAccounts`, `journalEntries`) | Risco de confusão entre contrato lógico e schema físico | Manter nomes internos actuais ou definir um mapeamento formal; não exigir renomeação global |
| Médio | `fiscalExercises` e `fiscalPeriods` existem, mas nem todas as tabelas contabilísticas têm foreign keys completas para organização, exercício e período | Integridade referencial desigual | Incluir no plano de integridade referencial e migração segura; não executar nesta fase |
| Médio | O contrato exige `RULE_CONFLICT`, mas o mecanismo actual de criação/listagem de regras não demonstra todos os critérios de conflito entre níveis | Uma regra pode ser seleccionada sem determinismo | Especificar algoritmo de selecção, empate, vigência e bloqueio |
| Médio | O contrato exige `CONTRA_ACCOUNT_WITHOUT_TARGET`, mas não há alvo retificador persistente | Não há como validar o requisito | Remeter para o modelo de classificação/apresentação antes de activar contas retificadoras |
| Baixo | A especificação não fixa limites de paginação, tamanho de lote, timeouts ou limites de memória | Consultas e importações podem ser indiscriminadas | Definir limites operacionais no documento de testes e segurança |
| Baixo | A especificação não fixa uma matriz de permissões por operação | RBAC pode ser interpretado apenas por módulo | Criar matriz server-side por procedimento, com segregação de funções e aprovação humana |

## 6. Confronto com os princípios dos Documentos 1 e 2

A especificação respeita o princípio de que o BALANCERTS.ERP continua a ser o sistema operacional e contabilístico. Não introduz escrita externa nem delega o Ledger a outro sistema. Também respeita a necessidade de snapshots/proveniência apenas na medida em que exige versões, fontes e auditoria; os detalhes de reconciliação e rollback devem permanecer nos documentos próprios.

Existe, contudo, uma fronteira importante: a especificação v2.2 é mais detalhada do que os Documentos 1 e 2 em classificação de demonstrações, contas retificadoras, reclassificações e atributos do cadastro. Esses detalhes podem ser derivados, mas não devem ser tratados como já aprovados pelos Documentos 1 e 2 sem uma matriz de correspondência formal. A aprovação da especificação contabilística deve, portanto, distinguir requisitos já vinculativos de decisões novas que precisam de validação documental.

A separação entre `organizationId`, `companyId`, conta PGCA e conta empresarial deve ser preservada. O contrato recebido usa `organization_id` no cadastro empresarial, mas deve deixar explícito que uma conta empresarial pertence a uma **empresa operacional** dentro da organização, enquanto o cadastro normativo é versionado por organização e não é editável pela empresa. Esta clarificação é necessária para não criar acesso horizontal ou uma associação directa que ignore o tenant.

## 7. O que pode ser implementado directamente depois da aprovação

Podem ser preparados, sem alterar ainda o sistema, os DTOs e schemas de validação para: selecção explícita de conta PGCA confirmada; resolução de conta empresarial para conta PGCA; rejeição `PGCA_DATA_REQUIRED`; validação de equilíbrio; imutabilidade pós-posting; origem e idempotência; estados de abertura; e matriz de permissões contabilísticas.

Também pode ser preparada uma matriz de testes e uma especificação de migração não destrutiva. Essas preparações não devem activar contas ou regras que continuem `NEEDS_HUMAN_CONFIRMATION`, nem devem criar demonstrações oficiais com classificações inferidas.

## 8. O que exige decisão adicional antes da implementação

Exigem decisão documental adicional o significado exacto de `account_type` versus grau da conta; a origem normativa de `normal_balance` e `behavior_type`; o modelo de contas retificadoras e seus alvos; as regras de saldo-dependência; a forma de aprovação de reclassificações; a hierarquia de prioridades das Accounting Rules; e a cadeia completa de classificação e Presentation Mapping.

A especificação também deve esclarecer se as demonstrações financeiras serão consideradas “oficiais” dentro do ERP apenas depois de todas as contas utilizadas terem classificação e mapping confirmados, ou se haverá um estado explícito de preparação/rascunho. Esta distinção é essencial para não apresentar como validada uma demonstração construída com dados incompletos.

## 9. Parecer formal

**NÃO APROVADO PARA IMPLEMENTAÇÃO DIRECTA.**

A especificação v2.2 é uma boa base conceptual e está alinhada com os princípios de não-invenção, auditoria, imutabilidade, multi-tenant e posting centralizado. Porém, existem **dois bloqueadores**: a ausência do motor persistente de classificação/Presentation Mapping e a insuficiência dos atributos normativos do cadastro PGCA actual. Existem ainda problemas altos no plano empresarial, Accounting Rules, Journal Entry, idempotência, reclassificações, demonstrações, abertura e cobertura de testes.

A recomendação é corrigir primeiro a especificação através de uma matriz de correspondência entre cada requisito v2.2, os Documentos 1 e 2 e as entidades actuais. Depois deve ser aprovado um modelo de dados incremental e um plano de migração/rollback. Só então poderá ser autorizada implementação faseada, começando por contratos de leitura e validação, sem activar regras de movimento que não tenham confirmação normativa primária.

## Referências

[1]: file:///home/ubuntu/upload/pasted_content.txt "MOTOR CONTABILÍSTICO PGCA — Especificação Técnica Consolidada v2.2"
[2]: file:///home/ubuntu/balancerts-erp/drizzle/schema.ts "Schema actual do BALANCERTS.ERP"
[3]: file:///home/ubuntu/balancerts-erp/server/pgc.ts "Serviço PGCA e validações normativas"
[4]: file:///home/ubuntu/balancerts-erp/server/accounting.ts "Invariantes contabilísticas e transições documentais"
[5]: file:///home/ubuntu/balancerts-erp/docs/interface-reference/accounting-interface-requirements.md "Requisitos confirmados da interface desktop de Contabilidade"
