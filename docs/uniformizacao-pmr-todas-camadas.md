# Uniformização PMR em todas as camadas

## Objectivo

Esta ronda aplicou a linguagem PMR melhorada ao conjunto da aplicação BALANCERTS.ERP, e não apenas à página inicial. A referência foi convertida em princípios de software orientado por tarefas, com organização própria do ERP e sem copiar conteúdos, textos ou identidade proprietária.

## Camadas uniformizadas

| Camada | Aplicação da linguagem PMR |
|---|---|
| Shell | Moldura de aplicação, menu escuro, barra de estado, contexto e separadores rectangulares |
| Navegação | Grupos Contexto, Financeira, Comercial, Operações, Controlo e Sistema; acordeão persistente |
| Módulos | Toolbar de tarefa com Filtrar, Procurar, Atalhos e Novo registo |
| Grelhas | Cabeçalhos compactos, linhas densas, selecção por foco e estados vazios honestos |
| Formulários | Inputs, selects e textareas planos, foco azul consistente e raios discretos |
| Diálogos e menus | Superfícies planas, cabeçalhos cinza-operacionais, bordas finas e ausência de sombras web |
| Relatórios e auditoria | Painéis rectangulares, informação hierárquica e rastreabilidade preservada |
| PWA | Pesquisa adaptada a ecrãs estreitos, overflow controlado, foco acessível e redução de movimento |

## Tokens globais

Os tokens PMR foram definidos no CSS global para que componentes próprios e componentes portaled partilhem a mesma linguagem: superfície quase branca, painel cinza-claro, linhas cinza-azuladas, texto operacional escuro, azul de comando e verde de estado positivo. A aplicação reduz raios e sombras de cartões web, mas conserva estados de foco e contraste suficientes para navegação por teclado.

## Garantias funcionais

As alterações foram visuais e de composição. Persistência, queries tRPC, isolamento tenant-aware, RBAC, auditoria, motor contabilístico, dados da Repair Lubatec e preparação AGT não foram alterados. Foi acrescentado um teste unitário à toolbar de tarefa para cobrir os comandos principais.

## Validação

A validação final executou TypeScript, 51 ficheiros com 179 testes Vitest, build de produção e screenshots em desktop e PWA móvel. Foi detectado e corrigido um overflow real no grupo de pesquisa da Overview em 390px; o campo e o botão Filtros passaram a quebrar de forma controlada.

A comunicação AGT real permanece desactivada. A interface mostra preparação e evidências internas, não certificação ou homologação oficial.
