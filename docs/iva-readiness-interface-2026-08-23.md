# Interface de prontidão IVA — 23 de Agosto de 2026

## Entrega

A área de Contabilidade normativa do BALANCERTS.ERP passou a apresentar um painel dedicado ao estado da prontidão IVA. O painel mostra o resultado das validações server-side, o número de regras activas, os mapeamentos 34.5-IVA activos, as fontes confirmadas e a situação de cada um dos cinco diplomas exigidos na cadeia normativa.

Quando a cadeia está incompleta, cada diploma em falta recebe indicação visual própria, com ícone de alerta, estado **Em falta** e tooltip contendo o título completo e a explicação do bloqueio. A interface não reduz a falha a um código técnico e mantém a identificação temporal dos diplomas: Lei n.º 7/19, Decreto Presidencial n.º 180/19, Decreto Executivo n.º 134/19, Lei n.º 17/19 e Lei n.º 14/23.

## Simulação local de PDF

Foi acrescentado o painel **Simulação de envio de evidência IVA**. O utilizador pode seleccionar um PDF local e executar o percurso visual de simulação. O fluxo apresenta o ficheiro, o tamanho, o tipo e um identificador de teste não probatório.

A simulação é deliberadamente apenas de interface. Não chama procedimentos tRPC, não envia bytes para a API, não grava no armazenamento, não cria submissão na fila, não confirma diplomas, não activa regras e não altera a prontidão IVA. O aviso de segurança fica visível no próprio painel. O formulário real de evidência primária mantém-se separado e continua sujeito a revisão humana.

## Validação

Foram criados testes para os estados bloqueado e pronto, identificação dos diplomas em falta, tradução do erro `IVA_CADEIA_NORMATIVA_INCOMPLETA`, selecção de PDF, activação do botão de simulação e confirmação de que o fluxo não é normativo. Os testes direccionados passaram com 8 testes aprovados; a suite global passou com 129 ficheiros e 501 testes aprovados. O TypeScript terminou sem erros e a página `/pgca` foi verificada visualmente em viewport desktop.

## Limite funcional

A simulação não prova a legibilidade, autenticidade, integridade jurídica ou adequação do PDF. Para produzir evidência utilizável, o utilizador deverá usar o formulário de submissão primária e concluir a revisão humana correspondente. A política `CONFIRMED_ONLY` permanece inalterada.
