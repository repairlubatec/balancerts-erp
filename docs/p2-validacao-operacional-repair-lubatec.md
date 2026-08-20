# P2 — Validação operacional da Repair Lubatec

**Projecto:** BALANCERTS.ERP  
**Empresa:** Repair Lubatec  
**Modo:** validação técnica controlada e somente leitura  
**Data:** 20 de Agosto de 2026

## Nota de responsabilidade

Sou uma IA e não substituo um contabilista certificado, auditor ou responsável fiscal. Este documento regista evidência técnica do comportamento do sistema e dos dados persistidos; qualquer operação contabilística, fiscal ou laboral consequente deve ser confirmada pelo responsável da Repair Lubatec.

## Estado inicial persistido

A empresa real encontra-se identificada no tenant `companyId=1`, ligada à organização `organizationId=1`, com NIF `5001121871`, moeda funcional AOA, regime de IVA EXCLUSÃO e estado de configuração READY. Existe um exercício fiscal de 2023 em estado OPEN e o período 09/2023 também está OPEN.

A verificação foi executada pelo comando read-only `pnpm db:validate:repair`. O utilitário não cria, actualiza nem elimina registos e pode ser repetido pela equipa técnica.

| Área persistida | Contagem observada | Interpretação operacional |
|---|---:|---|
| Empresas | 1 no tenant real | Ficha Repair Lubatec disponível |
| Exercícios fiscais | 1 | Exercício 2023 aberto |
| Períodos fiscais | 1 | Setembro de 2023 aberto |
| Plano de contas | 15 | Inclui as contas PGC corrigidas e publicadas |
| Lançamentos contabilísticos | 1 | Lançamento 3420001 corrigido e equilibrado |
| Documentos comerciais | 1 | Documento persistido com itens, imposto e série |
| Contrapartes | 1 | Contraparte persistida para o documento |
| Pagamentos | 3 | Movimentos persistidos no tenant |
| Transacções de tesouraria | 3 | Fluxo persistido e disponível para reconciliação |
| Contas de caixa | 1 | Conta de caixa disponível |
| Ficheiros e versões | 1 + 1 | Arquivo com versão persistida |
| Eventos de auditoria tenant-aware | 31 | Histórico da empresa disponível |
| Colaboradores e contratos | 0 | Não há dados RH reais persistidos |
| Folhas e itens salariais | 0 | Não é possível validar cálculo salarial real sem colaboradores |
| Produtos, armazéns e movimentos de stock | 0 | Não há dados de stock reais persistidos |
| Compras e recepções | 0 | Não há ciclo de compras real persistido |
| Extractos bancários | 0 | Integração bancária ainda não ligada |
| Submissões AGT | 0 | Homologação e credenciais AGT pendentes |

Os números acima são contagens do tenant real. Os testes automáticos podem usar um tenant descartável separado para testar isolamento, permissões e limpeza; esses dados não devem ser interpretados como actividade da Repair Lubatec.

## Ciclos validados

Foram executados quatro ficheiros de integração tenant-aware, com **12 testes aprovados em 12**: ciclo operacional, integração de base de dados, acções em massa de tarefas RH e integração específica da Repair Lubatec. A bateria modular adicional cobriu Contabilidade, Comercial, Compras, Stock, RH, Auditoria, Arquivo, Fiscalidade e Relatórios, com **52 testes aprovados em 52**.

A integração específica da Repair Lubatec confirmou as superfícies contabilísticas derivadas do lançamento autorizado: balancete, diário, razão, demonstração de resultados, balanço, painel financeiro e rastreabilidade. O lançamento mantém 50 000 AOA a débito e 50 000 AOA a crédito.

| Módulo | Estado da validação P2 | Limite actual |
|---|---|---|
| Empresas | Validado com ficha real | Não foram criadas novas empresas nesta ronda |
| Exercício | Validado com 2023 e período 09/2023 | O período continua aberto |
| Contabilidade | Validada com dados reais persistidos e testes de reconciliação | Amostra real limitada a um lançamento |
| Comercial | Contratos, estados, numeração, impostos e permissões testados | Apenas um documento comercial persistido |
| Tesouraria | Contratos, pagamentos, caixa e reconciliação testados | Não existe extracto bancário importado |
| Compras | Router, fornecedores e recepções testados | Não existem compras reais no tenant |
| Stock | Movimentos, posting e reconciliação testados | Não existem produtos, armazéns ou movimentos reais |
| RH | Cálculo, RBAC, tarefas e segregação testados | Não existem colaboradores ou folhas reais |
| Auditoria | Cadeia, isolamento e exportação testados; eventos reais disponíveis | A contagem organizacional inclui histórico técnico acumulado |
| Arquivo | Hash, ACL, versões, destinatários e falhas auditadas | Envio SMTP real continua bloqueado pelo erro 535 |

## Conclusão P2

A P2 está **tecnicamente validada para os fluxos que possuem dados persistidos e para os contratos cobertos por testes**. Não está correcto declarar a validação empresarial completa de RH, Stock, Compras ou banca, porque esses módulos não têm dados reais da Repair Lubatec no tenant. Também não está correcto declarar o envio por email real, AGT ou integração bancária como concluídos.

O próximo passo seguro é obter ficheiros reais anonimizados ou autorização para cenários controlados de escrita nos módulos sem dados. Esses cenários devem ser identificáveis, reversíveis ou descartáveis e nunca devem ser confundidos com movimentos fiscais ou contabilísticos definitivos. A validação de RH requer colaboradores, contratos e uma folha de teste; a de Stock requer produtos, armazém e movimentos; a de Compras requer fornecedores e uma recepção; a bancária requer extracto e credenciais do banco.

## Cenários controlados descartáveis executados

Além da leitura do tenant real, foram executados dois cenários em ambiente descartável, sem tocar na Repair Lubatec. O ciclo E2E descartável passou 1/1 e criou/limpou uma empresa temporária, exercício, período, série, documento, lançamento, movimento de stock, ficheiro, depreciação, estorno, reconciliação, fecho e reabertura com auditoria. O fluxo de importação e revisão passou 1/1 e criou/limpou produtos e lotes temporários, cobrindo CSV, XLSX, revisão de linhas inválidas, confirmação, hash PDF, ACL e isolamento.

Estes cenários comprovam que o sistema suporta escrita controlada e limpeza tenant-aware. Não substituem dados reais da Repair Lubatec e não cobrem uma folha salarial real, compras reais ou uma reconciliação bancária com extracto real.
