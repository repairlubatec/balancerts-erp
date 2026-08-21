# Requisitos confirmados — Nova interface de Contabilidade

A interface deve ser tratada como software desktop operacional, não como página web. O contexto deve ficar no topo, com empresa, exercício e período seleccionáveis directamente, sem depender do botão “Alterar contexto” para mudanças normais.

O selector de exercício deve permitir mudar de ano mantendo a mesma empresa; o selector de período deve listar os períodos do exercício seleccionado. A mudança deve actualizar imediatamente o espaço de trabalho, sem redireccionamento desnecessário, mantendo empresa, exercício e período coerentes.

Depois do contexto deve aparecer imediatamente a área de trabalho contabilística. As funções não devem ser apresentadas numa lista vertical longa: devem usar abas horizontais, grupos funcionais e grelha de cartões compactos. Os grupos pedidos são Operações, Tesouraria, Terceiros, Fiscal, Existências, Ativos, Fecho e Consultas/Relatórios. As acções rápidas permanentes são Novo lançamento, Importar documento, Pesquisar, Balancete e Fecho.

O contexto deve controlar as operações e impedir gravações acidentais no período errado. Deve indicar de forma compacta o estado do exercício e do período, incluindo situações de exercício/período encerrado. O fluxo deve preservar permissões, dados e funcionalidades existentes.

Critérios de validação do PDF: trocar 2026→2025; trocar Agosto→Setembro; trocar empresa; abrir lançamentos e voltar; abrir documentos e voltar; confirmar que empresa/ano/período permanecem correctos; testar período fechado; testar exercício encerrado; testar permissões.

## Verificação visual da referência

A imagem tem 1.632 × 327 px e foi dividida em três recortes horizontais. O primeiro recorte confirma uma janela desktop compacta com título “Contabilidade”, subtítulo “SESSÃO OPERACIONAL · ANGOLA”, linha de módulo e faixa de empresa activa. O contexto financeiro surge num cartão claro com ícone de calendário e três controlos compactos: empresa, exercício e período. O segundo recorte é uma zona de transição quase vazia, sem novos elementos legíveis; não foram inferidos componentes a partir dela.

O terceiro recorte confirma, no lado direito, o selector de empresa no topo, atalhos de teclado, notificações, avatar do utilizador, a mensagem “Todas as operações deste módulo aplicam-se a esta empresa” e o botão azul “Alterar contexto”. A implementação deve conservar a mensagem de escopo, mas tornar os selectors de exercício/período directos conforme o PDF.
