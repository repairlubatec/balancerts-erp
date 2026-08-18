# Auditoria de botões e alinhamento — BALANCERTS.ERP

**Âmbito:** inspecção estática dos componentes React, handlers, procedures tRPC associados, estados de mutação e capturas visuais em 1280×720 e 390×844. **Não foram feitas alterações funcionais nesta auditoria.**

## Resultado executivo

A maioria dos botões principais tem handler real e destino identificável: Nova empresa, Ver todas, Actividade, navegação lateral, separadores, fechar separador, abrir módulo, criar série, criar rascunho, criar cliente/fornecedor/produto/conta, registar movimento de stock, gerar PDF, reprocessar submissão interna e exportar auditoria.

Foram, contudo, confirmadas **seis lacunas de comportamento** e **quatro problemas de alinhamento/clareza** que devem ser corrigidos antes de declarar a interface sem pontos mortos. Os problemas mais relevantes são a ausência de feedback nos comandos de imobilizado, a exportação sem tratamento visual de erro, o botão Filtros do Overview que apenas foca a pesquisa, o comando Editar que pode focar um formulário genérico sem registo seleccionado e o corte horizontal de alguns conteúdos densos em desktop.

## Matriz de acções

| Área/comando | Verificação | Resultado | Severidade |
|---|---|---|---|
| **Nova empresa** | `onOpenNewCompany` leva a `/empresas?new=company`; o formulário de empresa usa mutação real e invalida a lista. | Funcional, com feedback de sucesso/erro verificado no código. | OK |
| **Ver todas** | Abre `/empresas`. | Funcional. | OK |
| **Actividade / Abrir auditoria** | Abre `/auditoria`. | Funcional. | OK |
| **Pesquisar empresa** | Input controlado por `query` filtra as linhas. | Funcional. | OK |
| **Filtros no Overview** | O botão chama apenas `searchRef.current?.focus()`. Não abre filtros nem altera critérios. | Rótulo enganador: é “Focar pesquisa”, não “Filtros”. | P1 |
| **Linhas de empresas** | Duplo clique/Enter abre o contexto da empresa. A linha não tem botão visível de abrir. | Funcional, mas descoberta baixa; o chevron parece botão mas não é independente. | P2 |
| **Acções rápidas do Overview** | Os quatro primeiros itens chamam `onOpenAction(path)` e abrem rotas. | Funcional. | OK |
| **Command palette** | Filtra acções e fecha ao abrir uma rota. | Funcional; precisa estado vazio explícito quando nenhuma acção corresponde. | P2 |
| **Sidebar** | Links alteram a rota e os grupos recolhem/expandem. | Funcional. | OK |
| **Barra de menus — Ficheiro** | Vai para Empresas. | Responde, mas o significado é demasiado genérico; não abre menu de ficheiros nem Novo/Abrir/Exportar. | P2 |
| **Barra de menus — Editar** | Em Empresas abre nova empresa; em Facturação abre novo rascunho; nos restantes módulos tenta focar `operational-update-form`. | Potencialmente errado: em módulos sem esse formulário não há feedback nem acção visível. | **P1** |
| **Barra de menus — Ver** | Alterna a sidebar. | Funcional, embora o menu não mostre estado. | P2 |
| **Barra de menus — Operações** | Abre directamente Facturação. | Responde, mas não oferece escolha de Stock, Tesouraria ou Imobilizado apesar do nome plural. | P2 |
| **Barra de menus — Relatórios** | Abre Relatórios. | Funcional. | OK |
| **Barra de menus — Janela** | Abre o próximo módulo que não está nos separadores. | Funcional como “Abrir próxima janela”, mas não é um menu de janelas; falta lista das janelas abertas. | P2 |
| **Ajuda** | Abre `/?shortcuts=1`. | Funcional como painel de atalhos; não é ajuda contextual nem diagnóstico. | P2 |
| **Separador seleccionar** | Usa `role=tab`, `aria-selected` e altera rota. | Funcional e acessível. | OK |
| **Separador fechar** | Fecha todos menos o último e activa o anterior quando necessário. | Funcional; não existe confirmação para trabalho não guardado. | P2 |
| **Abrir módulo (+)** | Abre o próximo módulo não aberto. | Funcional, mas sem selector de módulo; comportamento pouco previsível para utilizadores. | P2 |
| **Filtrar/Procurar nos módulos** | Filtrar e Procurar fazem foco/scroll para a grelha e activam inputs de pesquisa/estado. | Funcional nos módulos com `supportsRecordControls`; não são filtros modais. | P2 |
| **Novo registo** | Facturação abre criação de rascunho; outros módulos focam o formulário operacional. | Funcional nos módulos cobertos; em módulos sem criação não aparece. | OK |
| **Criar cliente/fornecedor/produto/conta** | Mutações reais com invalidação e mensagem de sucesso. | Funcional, mas formulário genérico e sem feedback de erro detalhado por campo. | P1 |
| **Actualizar registo operacional** | Mutações reais por ID introduzido manualmente. | Funcional, mas UX frágil: exige ID e pode actualizar o tipo errado se o utilizador estiver noutra área. | **P1** |
| **Criar/actualizar activo fixo** | Mutações reais e invalidação de lista. | **Sem feedback de sucesso nem mensagem de erro** para criação/actualização; clique pode parecer ignorado. | **P1** |
| **Calcular depreciação** | Mutation real e mostra resultado/erro. | Funcional. Não publica depreciação contabilística. | P2 |
| **Registar movimento de stock** | Mutation real, valida empresa/período/código e mostra feedback. | Funcional; não mostra resultado de saldo nem invalida/recarrega a grelha de forma explícita. | P1 |
| **Guardar série** | Mutation real, invalida lista e mostra feedback. | Funcional. | OK |
| **CSV/XLSX de auditoria** | Gera ficheiro no browser a partir das linhas carregadas. | Funcional no sucesso, sem `try/catch`, sem estado “a exportar” e sem feedback quando o pedido falha. | **P1** |
| **CSV/XLSX fiscal** | Queries desactivadas são chamadas por `refetch` e descarregadas. | Sem tratamento visual de excepção; falha pode gerar erro de consola sem mensagem no painel. | **P1** |
| **Validar importação** | Seleccionar ficheiro chama pré-validação e cria lote de revisão. | Funcional, mas não desactiva re-selecção nem mostra progresso de leitura. | P2 |
| **Corrigir/confirmar lote** | Mutações reais condicionadas ao estado. | Funcional; falta confirmação explícita antes de uma confirmação definitiva. | P1 |
| **Gerar PDF fiscal** | Mutation real de PDF de preparação e link de download. | Funcional como preparação; não é emissão certificada. | Externo/P2 |
| **Imprimir modelo QR** | Abre janela e chama `print()`. | Se popup for bloqueado, retorna silenciosamente sem feedback; botão pode parecer sem resposta. | **P1** |
| **Reprocessar AGT** | Actualiza estado interno para PENDING. | Funcional apenas internamente; o rótulo deve impedir qualquer interpretação de comunicação real. | P2 |
| **Fecho** | Checklist/evaluate está ligado à lógica backend. | Não equivale a botão de fecho contabilístico definitivo; deve estar claramente rotulado como avaliação se não houver transacção de close. | **P0** |
| **Definições** | Os cartões navegam para áreas concretas. | Funcional como índice; não são editores de configuração completos. | P1 |

## Problemas visuais confirmados

| Local | Observação | Impacto |
|---|---|---|
| **Desktop 1280 px — cabeçalho** | O selector de empresa activa no topo direito fica parcialmente cortado porque o conteúdo excede a área disponível. | Pode impedir leitura/alteração do contexto activo. |
| **Desktop — grelhas densas** | As tabelas têm `min-width` elevado e recorrem a scroll horizontal. Isto é aceitável para software Windows, mas a affordance de scroll não é evidente e as colunas de acção ficam fora do viewport. | Utilizador pode pensar que faltam botões. |
| **Desktop — Facturação** | A barra de filtros e as colunas do formulário de série aproximam-se do limite horizontal; em 1280 px há compressão significativa. | Reduz legibilidade e torna o último comando menos descobrível. |
| **PWA 390 px — separadores** | A barra de tabs é horizontalmente rolável e mostra apenas parte dos separadores, comportamento correcto mas sem indicação visual de scroll. | Descorberta média; não é falha funcional. |
| **PWA 390 px — formulários** | Facturação e Stock refluem para uma coluna e os botões ficam largos e acessíveis. | Alinhamento global aprovado. |
| **PWA 390 px — Overview** | Pesquisa e Filtros ficam acessíveis, mas o input de pesquisa é estreito e o texto aparece truncado. | Aceitável, mas pode melhorar com botão de pesquisa dedicado. |
| **PWA — contexto activo** | A informação da empresa activa quebra em várias linhas de forma legível. | Aprovado. |
| **Todas as rotas** | O avatar “AM” parece interactivo, mas é apenas um `div` sem acção. | Risco de expectativa falsa; deve ser decorativo explícito ou abrir perfil. |
| **Barra superior** | Os símbolos de minimizar, maximizar e fechar no `DesktopMenuBar` são ícones decorativos, não controlos Electron. | Em Electron podem induzir o utilizador a clicar sem resultado. | **P1** |

## Veredicto

Não encontrei uma grande quantidade de botões completamente sem `onClick` ou `onSubmit`; a maioria está ligada. Encontrei, porém, **acções que respondem de forma incompleta**, isto é, executam apenas foco/scroll, não mostram erro, ou parecem controlos nativos sem o serem. Para o padrão comercial Windows pretendido, estes casos devem ser tratados como lacunas reais, mesmo quando não provocam uma excepção.

A correcção prioritária deve começar por: adicionar feedback completo aos activos fixos e exportações; transformar “Filtros” num filtro real ou renomeá-lo; impedir que Editar tente focar formulários inexistentes; dar feedback a popup bloqueado; e ligar os ícones de janela ao Electron ou apresentá-los claramente como decoração. Em paralelo, o cabeçalho e os formulários devem ser ajustados para que a área de comandos nunca seja cortada em 1280 px.
