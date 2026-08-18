# Auditoria funcional completa

## Síntese

A auditoria percorreu as rotas, queries, mutações, command palette, navegação por separadores, criação/actualização de registos, importação/pre-validação, relatórios, auditoria, fiscalidade, Documentos, Fecho e Definições. O resultado actual é operacional para os fluxos internos cobertos pelo ERP. A integração real AGT permanece deliberadamente desactivada.

| Área | Resultado | Evidência |
|---|---|---|
| Overview e command palette | Operacional | Navegação, pesquisa, Nova empresa, auditoria e acções `?new=` testadas |
| Empresas | Operacional | Criação PENDING, configuração, exercícios/períodos e activação protegida |
| Facturação | Operacional em preparação | Séries, rascunho, validações, dados persistentes e auditoria |
| Contabilidade | Operacional | Diário persistente, selecção, traceabilidade e permissões |
| Clientes/Fornecedores | Operacional | Criação, actualização, isolamento e exportação/pre-validação |
| Stock | Operacional | Catálogo, movimentos, persistência, reconciliação e auditoria |
| Tesouraria | Operacional | Contas, transacções, reconciliação e estados persistentes |
| Imobilizado | Operacional | Activos, actualização, depreciação e affordances de posting |
| Fiscalidade | Operacional em preparação | Normas, evidências e consola AGT sem comunicação externa |
| Relatórios | Operacional | Reconciliação, antiguidade e percursos de traceabilidade |
| Auditoria | Operacional | Eventos tenant-aware e acções duplicadas preservadas por ID |
| Documentos | Corrigido | Passou a consultar `documents.list` no próprio módulo; estado vazio não mostra linhas demonstrativas |
| Fecho | Corrigido | Checklist chama `closing.evaluate`, apresenta blockers e não fecha períodos automaticamente |
| Definições | Corrigido | Índice abre as configurações reais de Empresas, Facturação, Fiscalidade e Auditoria |

## Defeitos encontrados e correcções

O módulo Documentos tinha uma lacuna: a query persistente só era activada em Facturação, permitindo fallback para dados de demonstração. A rota passou a activar `documents.list` e a grelha usa os registos persistidos tenant-aware. Foi adicionada uma regressão que exige zero linhas quando a consulta está vazia.

A área Fecho apresentava apenas uma grelha sem acção visível, embora o backend já tivesse `closing.evaluate`. Foi adicionado um checklist de validação com verificações críticas e não críticas; o resultado informa blockers e não executa um fecho destrutivo. A área Definições foi convertida de grelha vazia em índice operacional para as configurações já implementadas.

## Validação

A suite final passou com **51 ficheiros e 182 testes**, incluindo 16 testes de integração da Home. TypeScript, build de produção, screenshots desktop/PWA e verificação de logs foram executados. O aviso histórico de Fast Refresh sobre exportações da Home foi observado durante HMR; não representa erro de produção e o erro histórico de `React is not defined` no DashboardLayout já não existe no código actual, que importa React explicitamente.

Persistência, isolamento multi-tenant, RBAC, auditoria, motor contabilístico, dados Repair Lubatec e preparação AGT foram preservados. Nenhum endpoint AGT, credencial ou homologação foi activado.
