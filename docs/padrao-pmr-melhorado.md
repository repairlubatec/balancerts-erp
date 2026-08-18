# Padrão PMR melhorado no BALANCERTS.ERP

## Direcção

O BALANCERTS.ERP passa a adoptar uma linguagem claramente próxima da organização PMR: trabalho orientado por tarefas, selecção persistente de empresa, navegação por áreas, grelhas, notificações e contexto sempre visível. A implementação não copia textos, conteúdos, logótipo ou identidade proprietária; transforma os princípios observados numa experiência própria, mais ordenada e adequada às regras fiscais angolanas.

## Organização funcional

| Grupo | Módulos BALANCERTS.ERP |
|---|---|
| Contexto | Minhas Empresas, Empresas |
| Financeira | Contabilidade, Tesouraria |
| Comercial | Facturação, Clientes, Fornecedores, Documentos |
| Operações | Stock, Imobilizado |
| Controlo | Fiscalidade, Relatórios, Fecho, Auditoria |
| Sistema | Definições |

A barra lateral usa grupos expansíveis, com o grupo da rota activa mantido aberto. O estado de expansão é persistido localmente. Os separadores continuam a ser a unidade de navegação entre janelas de trabalho e mantêm Ctrl/Cmd+1–9, Ctrl/Cmd+W e abertura de novos módulos.

## Padrão de tarefa

Cada módulo passa a iniciar pelo contexto da empresa activa e por uma toolbar de tarefa com a área funcional, Filtrar, Procurar, Atalhos e Novo registo quando aplicável. O conteúdo vem depois em painéis rectangulares, grelhas densas e formulários compactos. A Overview usa a mesma lógica com comandos, indicadores auxiliares, tabela de empresas autorizadas, actividade auditada e resumo operacional.

## Organização superior

A melhoria sobre a referência PMR está na separação rigorosa de níveis: a lateral responde a “onde estou”, a toolbar responde a “o que posso fazer”, a grelha responde a “que registos existem” e o painel de detalhe responde a “o que estou a editar ou validar”. Isto reduz a mistura de navegação, indicadores e formulários que caracterizava a aparência anterior de dashboard.

## Validação

A validação final executou TypeScript, 50 ficheiros com 178 testes Vitest, build de produção e screenshots das rotas principal, Contabilidade e Facturação em 1280×720 e 390×844. A comunicação AGT real permanece desligada; os módulos mantêm persistência, RBAC, auditoria, isolamento tenant-aware e preparação normativa.

## Referências públicas consultadas

[1]: https://pmr.pt/interface/ "Interface | PMR Software"
[2]: https://pmr.pt/produtos/ "Produtos | PMR Software"
[3]: https://demo.pmr.pt/ "PMR Interface Demo"

A página Interface descreve organização por tarefas, tabelas, notificações, selecção por empresa, estatísticas e arquivo digital [1]. A página Produtos separa Gestão Financeira, Gestão Comercial, Recursos Humanos e API [2]. A demo pública confirma a existência de uma entrada de aplicação centrada em contexto e acesso ao sistema [3].
