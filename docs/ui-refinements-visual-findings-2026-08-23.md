# Registo visual — refinamentos do painel IVA

Data: 23 de Agosto de 2026.

A captura desktop da rota `/pgca` confirma que o BALANCERTS.ERP mantém a linguagem de software operacional: barra lateral persistente, barra de menus, separadores de trabalho e superfície de alta densidade. O cabeçalho do módulo PGCA está visível com acções agrupadas e sem alteração da navegação global.

A captura de página completa confirma que o conteúdo normativo e os painéis continuam dentro da superfície do módulo, sem introdução de uma página de marketing ou de um cabeçalho duplicado. A grelha do módulo permanece compacta e adequada à visualização desktop; a captura completa é naturalmente alta por conter os painéis normativos, tabelas e histórico em sequência.

A nova alternância de tema está montada no cabeçalho do painel IVA e usa o estado persistente do `ThemeContext`. O agrupamento de diplomas é calculado a partir da primeira etiqueta temática, preserva a ordem da ordenação activa e mantém cada código uma única vez. O estado vazio do histórico contém uma acção explícita de nova exportação, ligada ao fluxo CSV existente.

A confirmação do AlertDialog do simulador já possui cobertura Vitest para abertura, cancelamento sem perda de estado e confirmação com reposição local e callback de prontidão. A validação visual final do modo escuro deve ser feita após abrir o painel IVA no preview e activar o botão “Modo escuro”, uma vez que a captura automática não executa interacções.


A captura móvel em 375×812 mantém a barra de menu, os separadores e a janela operacional em formato de software. Os controlos do cabeçalho PGCA passam para linhas empilhadas, permanecem legíveis e não criam um scroll global horizontal visível; os selectores continuam acessíveis dentro da janela.

A validação visual desktop e móvel está concluída para este conjunto de alterações. A alternância de modo escuro foi coberta por teste de componente, incluindo o estado acessível antes e depois da mudança.


Na captura da Home em 1280×720, os eventos recentes e os alertas do dashboard aparecem com rótulos em português, incluindo “Referências órfãs do lançamento corrigidas”, “Empresa actualizada”, “Lançamento contabilístico publicado” e “Documento emitido”. O shell desktop mantém a densidade operacional e não mostra os códigos ingleses desses eventos.


Na verificação da rota Contabilidade em 1280×720, a barra de comandos aparece antes do contexto financeiro e mostra “Importar” no modo de importação e “Novo lançamento” no modo de novo lançamento. As queries `entry=import` e `entry=new` são reconhecidas pelo shell, com indicação operacional no separador e sem depender de deslocamento para o formulário.


Na captura da página SAADI em 1280×720, o módulo mantém a apresentação de software autónomo, o contexto da empresa Repair Lubatec e a indicação de que não altera registos operacionais. A selecção de snapshots é disponibilizada no bloco de capturas quando existem múltiplas fontes, mantendo a escolha separada das consultas de desvios e proveniência.


Na verificação do shell desktop em 1280×720, a barra de janelas mantém a navegação compacta e o contador passou a apresentar “Janelas”, sem o termo inglês “Windows”. A rota Contabilidade mostra os comandos Filtrar, Procurar, Atalhos e Importar no topo do conteúdo operacional.


Na captura da página Balancerts IA em 1280×720, o shell mantém navegação compacta e os textos operacionais visíveis permanecem em português. O painel apresenta claramente IA local, modo offline, custo e fonte normativa, sem alterar a fronteira de confirmação humana.
