# Revisão visual desktop do BALANCERTS.ERP

## Objectivo

A primeira shell de separadores ainda mantinha uma aparência dominante de dashboard web. Esta revisão substitui essa composição por uma moldura de aplicação operacional, inspirada nos materiais visuais do PMR disponíveis no workspace e adaptada ao produto contabilístico/fiscal angolano.

## Critérios aplicados

| Área | Decisão implementada |
|---|---|
| Moldura | Menu principal escuro, barra de separadores, barra de trabalho, área central e barra de estado inferior. |
| Navegação | Módulos apresentados como painel lateral operacional e separadores persistentes, com fecho e reabertura. |
| Densidade | Menos cartões flutuantes, menos sombras, raios discretos, grelhas compactas e cabeçalhos de tabela mais baixos. |
| Overview | Substituído o conjunto de cartões por toolbar de comandos, indicadores compactos, tabela de empresas autorizadas, actividade e resumo operacional. |
| Marca | BALANCERTS.ERP usa a combinação azul/verde/preto derivada do logótipo real do workspace. |
| Interacção | Mantidos Ctrl/Cmd+K, Ctrl/Cmd+W, Ctrl/Cmd+1–9, foco de filtros, Enter em linhas e command palette. |
| PWA | Em viewport estreito, o menu horizontal pode deslocar-se, os controlos de janela são ocultados e os módulos mantêm leitura vertical. |

## Alterações principais

Foi criado o componente `DesktopMenuBar`, com menus Ficheiro, Editar, Ver, Operações, Relatórios e Janela, além de ajuda e controlos de janela visuais. A `DashboardLayout` passou a usar esta moldura juntamente com a barra de estado e os separadores de workspace.

Foi criado o `DesktopOverviewPanel`, que mantém as queries persistentes existentes mas apresenta a informação num modelo de software: toolbar, grelha de empresas, foco de pesquisa, actividade auditada e resumo operacional. Os módulos existentes mantêm os seus contratos tRPC, mutações, isolamento tenant-aware, RBAC, auditoria e estados fiscais.

Foram adicionados tokens CSS `desktop-shell` para reduzir raios e sombras de cartões, compactar cabeçalhos e conteúdos, densificar tabelas e preservar foco visível. Nenhuma comunicação real com a AGT foi activada.

## Validação

A suite completa terminou com **50 ficheiros e 178 testes aprovados**. O TypeScript e o build de produção foram aprovados. Foram verificadas as rotas `/`, `/contabilidade` e `/facturacao` em viewport desktop de 1280×720 e em viewport PWA de 390×844. As alterações não introduziram novas dependências nem alteraram o motor contabilístico.

## Limites deliberados

Esta alteração é visual e estrutural. A integração AGT real, credenciais, endpoints, homologação e validação oficial continuam bloqueados até existirem dados e autorização da AGT. A aparência PMR foi usada como referência de linguagem e organização, não como cópia de marca ou de software proprietário.
