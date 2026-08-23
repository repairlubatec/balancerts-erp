# Nota de validação visual — painel IVA

A captura desktop de `/pgca` confirma que a página mantém o enquadramento de software: barra lateral persistente, barra de menus, separadores de área de trabalho e controlos compactos. O painel IVA foi integrado depois do painel de confirmação normativa, no mesmo fluxo administrativo.

A captura de página inteira mostra que o conteúdo da página é extenso e requer navegação vertical global. O novo painel não cria uma área de rolagem interna própria; as tabelas usam apenas overflow horizontal para preservar colunas em ecrãs estreitos. A primeira captura de viewport não mostra o painel porque ele fica abaixo do cabeçalho e dos indicadores PGCA; a estrutura está correcta, mas a validação interactiva de botões deve ser feita com o painel visível no ambiente autenticado.

Não foram observados erros de compilação no servidor durante o HMR e o TypeScript permanece sem erros. A implementação mantém os estados em português e o acesso de revisão condicionado ao papel administrativo no cliente, sem substituir a autorização server-side.
