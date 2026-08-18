# Auditoria visual Windows/macOS Desktop

## Resultado

A auditoria procurou áreas que ainda pudessem parecer uma página web: shell, navegação, Overview, módulos, 404, login, loading, erro global, diálogos, menus, auditoria, relatórios e PWA. A conclusão é que as áreas funcionais principais já apresentam uma moldura de aplicação, barras de comando, separadores, grelhas e painéis operacionais. Foram corrigidos os desvios encontrados nos estados periféricos.

| Área auditada | Achado | Correcção |
|---|---|---|
| Login | Ecrã genérico centrado e texto inglês | Janela de acesso BALANCERTS.ERP com barra de título, estado seguro e comando Entrar |
| Loading | Skeleton baseado em cartões arredondados | Skeleton de aplicação com menu lateral, barra de título, tabs e grelhas planas |
| 404 | Gradiente, cartão flutuante, animação e texto web | Painel interno de erro com código, barra de título e Voltar à área principal |
| Erro global | Mensagem genérica com botão web | Janela de recuperação com detalhe técnico recolhível e Reiniciar janela |
| Módulos | Já conformes após a uniformização anterior | Confirmados em Overview, Contabilidade e Facturação |
| PWA | Risco de corte no grupo de pesquisa | Pesquisa e Filtros quebram de modo controlado em 390px |

## Critérios desktop confirmados

A shell mantém menu superior, barra lateral agrupada, separadores, statusbar, contexto de empresa e comandos compactos. As áreas de negócio usam grelhas e formulários densos, sem sombras ou raios típicos de landing pages. O foco de teclado é visível e o movimento respeita prefers-reduced-motion.

## Nota técnica

Os logs apresentaram apenas avisos conhecidos de Fast Refresh durante alterações no módulo Home, além das mensagens normais de ligação Vite e React DevTools. Não foram encontrados erros de execução nas capturas finais. A validação executou TypeScript, 51 ficheiros/179 testes Vitest, build de produção e screenshots das rotas principal, Contabilidade, Facturação e 404 em desktop e PWA.

A camada fiscal, persistência, RBAC, isolamento tenant-aware, auditoria e comunicação AGT não foram alterados por esta auditoria.
