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

## Refinamentos da simulação

A simulação passou a apresentar uma barra de progresso acessível entre 0% e 100%, com estado de processamento, botão de simulação temporariamente bloqueado e conclusão automática apenas no estado final. O progresso é uma animação local e não representa transmissão de dados.

O botão **Limpar e repor** remove o PDF, o identificador de teste, o progresso e o resultado local. Em seguida, solicita uma nova leitura da prontidão IVA no painel pai, sem alterar fontes, regras, contas ou confirmações. Assim, o estado mostrado volta a reflectir exclusivamente os dados validados no servidor.

Os cartões e tooltips da cadeia utilizam agora verde para diplomas confirmados e vermelho para diplomas em falta. A cor acompanha sempre uma etiqueta textual e um ícone, não sendo usada como único meio de comunicação.

## Drag-and-drop, resumo e exportação

O simulador de evidência IVA passou a aceitar selecção por arrastar e largar na zona identificada, mantendo a validação de extensão/tipo PDF e o mesmo fluxo local do selector de ficheiros. Ficheiros que não sejam PDF são rejeitados sem criar estado simulado.

O painel de prontidão mostra a conclusão da cadeia normativa como contagem e percentagem, por exemplo **3/5 · 60%**, acompanhada por barra de progresso acessível. A cor vermelha sinaliza cadeia incompleta e a verde sinaliza os cinco diplomas confirmados; a informação textual permanece sempre presente.

Foram adicionados os comandos **CSV** e **PDF**. O CSV é construído no cliente a partir do resultado actualmente visível e inclui os cinco diplomas, estados, funções, bloqueios e regras por regime. O PDF é gerado no servidor através do procedimento protegido `normative.exportIvaReadinessPdf`, com validação server-side do papel e da organização. Ambos são relatórios de consulta e não confirmam diplomas, não activam regras e não persistem o PDF simulado.

A exportação PDF usa a mesma data de vigência consultada pelo painel e devolve o estado de prontidão, contagem percentual, lista de diplomas em falta, bloqueios e repartição por regime. O procedimento é permitido apenas para papéis com leitura normativa; o Operador é bloqueado antes da consulta.

## Pré-visualização local do PDF simulado

O simulador apresenta agora uma pré-visualização incorporada do PDF seleccionado antes da simulação, através de um URL temporário criado no navegador. O conteúdo permanece local: não é enviado para a API, não é guardado no armazenamento e não cria evidência normativa.

Quando o utilizador selecciona outro ficheiro ou usa **Limpar e repor**, o URL temporário anterior é revogado e o painel de pré-visualização é removido. Se o ambiente não suportar visualização incorporada, é mostrado um aviso em português sem bloquear o teste do fluxo local.
