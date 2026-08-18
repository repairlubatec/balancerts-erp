# BALANCERTS.ERP — Implementação da shell de software

## Objectivo

Esta versão transforma o BALANCERTS.ERP numa experiência de software operacional para Windows, macOS e PWA. A shell mantém os módulos existentes, a persistência tenant-aware e o motor contabilístico, mas passa a apresentar o ERP como um workspace contínuo em vez de uma sequência de páginas web isoladas.

## Arquitectura aplicada

| Camada | Implementação |
|---|---|
| Navegação | Sidebar persistente e redimensionável, com destaque do módulo activo. |
| Workspace | Barra de trabalho com separadores persistentes por módulo, fecho individual e abertura do próximo módulo disponível. |
| Estado | Separadores guardados em `localStorage` sob `balancerts.workspaceTabs`; a rota continua a ser a fonte de verdade. |
| Contexto | `ModuleContextBar` informa empresa activa, NIF e estado operacional antes das operações críticas. |
| Segurança visual | `ModuleSecurityNotice` explicita validação no servidor, idempotência e auditoria. |
| Dados | Queries, mutações, isolamento multi-tenant e integração AGT não foram alterados. |

## Atalhos

A shell suporta `Ctrl/Cmd + K` para abrir a central de comandos, `Ctrl/Cmd + W` para fechar o separador activo quando existe mais do que um e `Ctrl/Cmd + 1` a `9` para seleccionar os separadores visíveis. Os separadores também podem ser activados pelo teclado e as linhas das grelhas operacionais podem ser seleccionadas com `Enter` ou `Espaço`.

## Componentes principais

`client/src/components/WorkspaceTabBar.tsx` concentra o comportamento visual e interactivo dos separadores. `client/src/components/ModuleContextBar.tsx` concentra o contexto da empresa activa e a mensagem de segurança operacional. `client/src/components/DashboardLayout.tsx` gere a shell, a persistência da sessão de trabalho e os atalhos. `client/src/pages/Home.tsx` continua a coordenar os fluxos de negócio, mas já consome os componentes partilhados de shell.

## Validação

A validação desta ronda produziu os seguintes resultados:

| Verificação | Resultado |
|---|---|
| TypeScript | Aprovado, sem erros. |
| Vitest | 50 ficheiros e 178 testes aprovados. |
| Build de produção | Aprovado com aviso não bloqueante de chunks superiores a 500 kB. |
| Desktop 1280×720 | Shell, separadores, contexto e módulos verificados. |
| PWA/mobile 390×844 | Navegação móvel, conteúdo e adaptação vertical verificados. |
| Integração AGT | Continua desactivada por decisão de segurança; não foram enviados dados externos. |

## Decisões e limites

A primeira versão privilegia estabilidade: os fluxos persistentes de facturação, contabilidade, auditoria, stock, tesouraria, imobilizado e fiscalidade foram mantidos. A integração real com a AGT, credenciais, endpoints, homologação e declaração de certificação continuam fora do escopo automático e só devem ser activados com os elementos oficiais fornecidos pela equipa.
