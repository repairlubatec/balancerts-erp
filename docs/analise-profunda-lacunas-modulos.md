# Análise profunda de lacunas — BALANCERTS.ERP

**Data:** 18 de Agosto de 2026  
**Âmbito:** análise estática do código, contratos tRPC, schema Drizzle, RBAC, testes existentes, shell Windows/Electron e revisão visual das rotas principais.  
**Regra desta fase:** não foram implementadas alterações funcionais; o resultado é um diagnóstico priorizado para orientar a próxima fase.

## Conclusão executiva

O BALANCERTS.ERP tem uma base técnica sólida: existe isolamento por organização/empresa, RBAC, auditoria, numeração transaccional, documentos, motor contabilístico, fiscalidade normativa, importação com revisão, preparação de PDF/QR, relatórios, reconciliação e um conjunto significativo de testes backend. O sistema já não é apenas uma maqueta visual.

Contudo, **ainda não deve ser apresentado como um ERP comercial completo**. A lacuna principal está na distância entre o backend preparado e a superfície operacional do utilizador. A UI concentra muitos módulos numa tabela genérica, enquanto várias operações críticas existem apenas como procedures tRPC ou funções internas. Há também linhas demonstrativas residuais e fallback de dados que podem fazer a interface parecer operacional quando uma consulta ainda está a carregar ou quando um contrato de módulo não está ligado.

A prioridade máxima é eliminar qualquer aparência de dados fictícios, transformar os fluxos contabilísticos, de tesouraria, documentos e fecho em jornadas ponta a ponta, e corrigir a prontidão SAF-T para usar contagens reais. A integração AGT continua correctamente bloqueada por dependência externa, mas a configuração e a validação local devem ser expostas de forma mais completa.

## Classificação utilizada

| Nível | Significado |
|---|---|
| **P0 — bloqueador comercial/fiscal** | Pode causar informação falsa, emissão fiscal incorrecta, perda de confiança ou impedir uma operação essencial. Deve ser resolvido antes de demonstração comercial. |
| **P1 — lacuna funcional alta** | A operação existe parcialmente, mas o utilizador não consegue concluir o fluxo normal pela interface. |
| **P2 — lacuna importante** | Funcionalidade útil ou de controlo existe no backend, mas falta acabamento, cobertura de aceitação ou integração de UX. |
| **P3 — melhoria** | Não bloqueia o uso principal, mas aumenta qualidade, produtividade, manutenção ou distribuição. |

## Matriz módulo por módulo

| Módulo | O que está realmente implementado | Lacunas verificáveis | Nível |
|---|---|---|---|
| **Minhas Empresas / Overview** | Consulta empresas persistentes, selecciona contexto activo, apresenta indicadores derivados, actividade de auditoria, acções rápidas e preferência pela Repair Lubatec. O tenant descartável é ocultado apenas na apresentação. | A Overview ainda depende de agregações limitadas e apresenta indicadores resumidos. A acção “Ver todas” leva à grelha, mas não existe uma área dedicada de pesquisa avançada, ordenação, detalhe ou gestão de ciclo de vida empresarial. | P2 |
| **Empresas** | Lista tenant-aware, criação de empresa, activação com confirmação, representante legal, exercício e período; existem guards de configuração READY/PENDING e auditoria. | Não há edição completa dos dados mestres depois da criação: morada, NIF, regime, actividade, contactos e forma legal não têm um fluxo de actualização completo. Falta uma vista de detalhe empresarial com histórico, exercícios, períodos, representantes e configuração fiscal reunidos. | **P1** |
| **Contabilidade** | Há queries de diário, balancete, razão, saldo e posting protegido por RBAC; existem validação de lançamento, reversão e cadeias de origem. | A UI principal é essencialmente leitura. Não existe no ecrã uma jornada completa para criar lançamento, validar, publicar, reverter, escolher período/contas, consultar razão por conta ou corrigir um rascunho. O backend de `accounting.post`, `reversal` e `currency.convert` não está convertido num posto de trabalho contabilístico completo. | **P0** |
| **Tesouraria** | Listagem de contas e movimentos, criação/actualização de contas, queries de pagamentos, criação/actualização de pagamentos e reconciliação bancária no backend. | A interface expõe sobretudo contas e movimentos. Não existe uma jornada completa para registar recebimento/pagamento, associar documento, escolher método, confirmar/cancelar, importar extracto, executar reconciliação e tratar diferenças. A procedure `reconciliation.bank` não tem posto de trabalho correspondente. | **P0** |
| **Facturação** | Séries persistentes, auditoria de séries, numeração reservada, criação de rascunho, tabela real de documentos, QR e ferramentas de exportação/PDF. | O formulário força `ivaRegime: "EXCLUSAO"`, `currency: "AOA"`, `counterpartyType: "CUSTOMER"`, imposto zero e apenas uma linha. Não selecciona cliente por catálogo, não calcula IVA conforme o regime da empresa, não permite várias linhas, descontos, retenções, vencimento, moeda, notas de crédito ou transições completas. Isto pode produzir documentos fiscalmente incorrectos fora da Repair Lubatec. | **P0** |
| **Documentos** | Consulta persistente, transições de estado no backend, actualização de linhas/impostos, arquivo, QR, PDF de preparação, importação e revisão comercial. | A tabela não apresenta um fluxo claro para validar, emitir, contabilizar, cancelar ou corrigir um documento existente. As procedures `documents.transition`, `updateItem`, `updateTax` e `archive` existem, mas a UI genérica não oferece um detalhe documental completo nem comandos condicionados ao estado. | **P0** |
| **Clientes** | Lista tenant-aware, criação e actualização básica de contraparte, importação validada e exportação. | O formulário genérico cobre nome, NIF, email e alguns campos mínimos, mas não oferece detalhe, histórico de documentos, saldos, contactos completos, endereços estruturados, arquivo/inactivação ou pesquisa avançada. Falta selecção de cliente no fluxo de facturação; actualmente o utilizador introduz um ID manualmente. | **P1** |
| **Fornecedores** | Lista tenant-aware, criação/actualização básica, ageing de fornecedores no backend e importação/exportação. | O fluxo é praticamente o mesmo dos clientes, sem ficha completa, conta corrente operacional, documentos de compra, pagamentos ligados e selecção contextual no módulo financeiro. | **P1** |
| **Stock** | Catálogo de produtos/serviços, criação/actualização, movimentos persistentes, valorização média ponderada e reconciliação backend. O painel fiscal indevido foi removido. | A grelha principal mostra produtos, não um diário completo de movimentos. Não existe gestão de armazéns/localizações, inventário físico, ajustes controlados, transferências, consulta de custo médio por artigo ou reconciliação visual. A procedure de reconciliação de stock não tem posto de trabalho correspondente. | **P1** |
| **Imobilizado** | Lista, criação, actualização/disposição, cálculo de depreciação e posting auditado no backend. | O front-end mostra criação e cálculo, mas não oferece uma jornada completa de aquisição, colocação em uso, depreciação mensal por período, contas contabilísticas, baixa, alienação, mapa de activos ou lançamento de depreciação. `fixedAssets.postDepreciation` fica sem comando operacional claro. | **P1** |
| **Fiscalidade** | Regras normativas versionadas, cálculo IVA, calendário, evidências de pré-homologação, consola AGT e validações locais. | A página não oferece configuração fiscal completa por empresa: regras, taxas, códigos, retenções, motivos de isenção, séries AGT, estabelecimento e chave não estão reunidos num assistente operacional. A consola de submissões só permite reprocessamento interno; não há comunicação AGT real por decisão correcta de segurança, mas a UI deve distinguir melhor “preparado”, “validado localmente” e “bloqueado externamente”. | **P1** |
| **Relatórios** | Balancete, diário, razão, demonstração de resultados, balanço, reconciliação, ageing, IVA, rastreabilidade e readiness SAF-T existem no backend. | A UI apresenta apenas um resumo com poucas linhas e três cartões de ageing/reconciliação. Não há visualizadores dedicados para cada relatório, filtros de período/conta, drill-down, impressão/exportação autoritativa ou comparação de períodos. A exportação SAF-T bloqueia deliberadamente quando necessita validação externa. | **P1** |
| **Fecho** | Checklist ligado a `closing.evaluate`, validação de reabertura, razão obrigatória e auditoria de reabertura. | Avaliar checklist não é o mesmo que fechar contabilisticamente um período. Não foi identificada na interface uma operação transaccional completa para fechar período, bloquear lançamentos, gerar evidência, seleccionar responsável e reabrir com autorização. O processo deve distinguir “checklist aprovado” de “período fechado”. | **P0** |
| **Auditoria** | Eventos append-only, antes/depois, correlação, filtros por empresa, entidade, acção, actor e datas; RBAC de auditor. | Falta paginação/limites de consulta para históricos grandes, detalhe dedicado de evento, exportação padronizada do trilho completo e confirmação visual de retenção/imutabilidade. A aceitação existente comprova queries, mas não uma sessão longa de auditoria no browser. | P2 |
| **Definições** | Índice de áreas e navegação para configurações existentes. | É o maior ponto de “índice sem posto de trabalho”: não existe um centro completo para perfis, permissões, séries, regimes, regras normativas, integrações, preferências, exercícios, moeda e parâmetros da empresa. Muitas opções estão distribuídas por módulos ou só existem como procedure. | **P1** |
| **AGT / pré-homologação** | Adaptador configurável, fila persistente, payloads, QR, referências de assinatura, estabelecimentos, séries e estados de submissão preparados. | Sem endpoint, credenciais, XSD/serviço oficial e validação da AGT, não pode haver comunicação real nem declaração de certificação. Esta não é uma falha interna. A lacuna interna é faltar um modo “simulação local” mais explícito e um painel completo para validar todos os pré-requisitos antes de receber as chaves. | Externo + P2 interno |

## Lacunas transversais

### 1. Dados demonstrativos residuais — P0

`Home.tsx` mantém `moduleData` com empresas, documentos, clientes, stock, tesouraria, relatórios e auditoria fictícios. A construção de `displayRows` usa dados reais em muitos módulos, mas termina com `data.rows` como fallback. Isso cria o risco de mostrar linhas demonstrativas durante loading, indisponibilidade ou falta de ligação de uma consulta. Para um produto comercial, o contrato deve ser: **loading mostra loading; zero registos mostra estado vazio; erro mostra erro; nunca mostra dados fictícios**.

### 2. Backend mais completo do que a UI — P0/P1

Há procedures para posting contabilístico, reversão, pagamentos, reconciliação bancária, depreciação, transições documentais, reabertura, SAF-T e movimentos de stock que não correspondem a postos de trabalho completos na interface. A existência de um endpoint testado não torna o fluxo comercial utilizável por um operador.

### 3. SAF-T readiness incompleta — P0 fiscal

`getSaftReadinessForUserCompany` calcula contagens de períodos, contas, lançamentos e documentos, mas fornece `customerCount`, `supplierCount`, `productCount` e `taxRuleCount` como zero. Como existem tabelas e queries para esses domínios, a prontidão SAF-T pode estar subestimada ou incorrecta. Antes de homologação, a matriz deve usar contagens persistentes reais e regras de cobertura verificáveis.

### 4. Exportações não são necessariamente autoritativas — P1

`exports.csv` e `exports.xlsx` recebem as linhas pelo cliente. Isto é útil para exportar a grelha filtrada, mas não deve ser confundido com um relatório fiscal oficial ou uma exportação íntegra da base de dados. Para relatórios fiscais e SAF-T, a exportação deve ser gerada no servidor a partir de dados tenant-aware e de um snapshot identificável.

### 5. Importação parcialmente transaccional — P1

A importação de clientes/produtos percorre as linhas e cria registos individualmente. É necessário confirmar se uma falha intermédia faz rollback integral ou deixa um lote parcialmente gravado. A revisão de documentos está correctamente bloqueada antes de uma confirmação comercial, mas precisa de teste de aceitação com ficheiro anonimizado real.

### 6. RBAC correcto no backend, mas UX incompleta — P1

A matriz RBAC é clara, mas o shell apresenta a mesma navegação geral a diferentes papéis. Quando um operador tenta uma função não autorizada, a experiência deve desactivar ou ocultar o comando com explicação contextual, em vez de depender exclusivamente de um erro `FORBIDDEN` da API.

### 7. Aceitação browser insuficiente — P1

A suite de 187 testes é forte em lógica, router, isolamento e happy paths backend. Os testes de Home usam hooks tRPC simulados, portanto validam a ligação da interface, não a persistência real após um clique autenticado. Faltam testes de aceitação reais para: criar empresa, configurar Repair Lubatec, criar série, criar cliente, criar produto, criar rascunho, validar/emitir, contabilizar, registar pagamento, reconciliar, fechar e reabrir.

### 8. Electron ainda é shell remoto — P1 de distribuição

O Electron cria uma única `BrowserWindow`, com tabs dentro do renderer. Portanto, o produto tem múltiplos separadores, mas não múltiplas janelas nativas independentes. O wrapper também exige `BALANCERTS_DESKTOP_URL`; sem URL HTTPS de produção, a aplicação instalável não é autónoma. O builder prepara EXE/NSIS e MSI, mas assinatura, actualização automática, diagnóstico de versão e publicação comercial continuam pendentes.

## Ordem recomendada de execução

| Ordem | Trabalho | Motivo |
|---|---|---|
| 1 | Remover todos os fallbacks demonstrativos e criar estados explícitos de loading/vazio/erro | Elimina o maior risco de confiança e de demonstração enganosa. |
| 2 | Reestruturar Facturação/Documentos | Corrige regime IVA, linhas, clientes, totais, transições e emissão antes de qualquer uso comercial. |
| 3 | Criar posto contabilístico e tesouraria | Liga posting, reversão, pagamentos e reconciliação às operações que uma empresa realmente executa. |
| 4 | Implementar fecho real de período e relatórios dedicados | Separa checklist de fecho contabilístico e dá valor operacional ao controlo. |
| 5 | Completar fichas de clientes, fornecedores, catálogo, stock e imobilizado | Fecha os auxiliares que alimentam facturação, contabilidade e SAF-T. |
| 6 | Corrigir contagens e readiness SAF-T | Prepara uma validação local mais credível sem declarar homologação. |
| 7 | Criar testes E2E autenticados e modo de aceitação | Prova que os cliques persistem realmente, em vez de apenas passar mocks. |
| 8 | Fechar distribuição Windows | Definir URL de produção, assinatura de código, instalador final, actualização e suporte de versões. |

## Veredicto

O projecto está **tecnicamente bem encaminhado, mas funcionalmente incompleto para venda a uma empresa grande**. Não encontrei evidência de que a base precise de ser reescrita; encontrei uma necessidade clara de fechar a camada operacional entre o backend já preparado e a UI. As prioridades P0 são dados demonstrativos, facturação/documentos, contabilidade/tesouraria e fecho real. A AGT permanece uma dependência externa legítima e não deve ser simulada como integração concluída.

> Esta análise não constitui certificação fiscal, homologação AGT, parecer jurídico ou garantia de conformidade. A validação oficial depende da AGT e de testes de aceitação com dados reais anonimizados.

## Base técnica consultada

A análise foi baseada principalmente em `client/src/pages/Home.tsx`, `client/src/components/DashboardLayout.tsx`, `client/src/components/AgtConsolePanel.tsx`, `client/src/components/FiscalDataToolsPanel.tsx`, `server/routers.ts`, `server/db.ts`, `server/permissions.ts`, `drizzle/schema.ts`, `electron/main.mjs`, `electron-builder.yml` e nos testes Vitest existentes em `client/` e `server/`.
