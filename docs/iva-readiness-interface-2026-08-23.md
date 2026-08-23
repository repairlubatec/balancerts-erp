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

## Filtro da cadeia normativa

A listagem dos cinco diplomas IVA passou a incluir um filtro acessível com três opções: **Todos**, **Em falta** e **Confirmados**. A opção seleccionada é apresentada no próprio painel, acompanhada pela contagem visível face ao total de cinco diplomas.

O filtro altera apenas a apresentação local da lista. A percentagem de conclusão, o estado de prontidão, os bloqueios, as exportações e a política `CONFIRMED_ONLY` continuam a ser calculados sobre a cadeia completa. Quando uma categoria não contém elementos, o painel apresenta um estado vazio em português sem interpretar a ausência como confirmação.

## Notificações das exportações

As exportações CSV e PDF do estado de prontidão IVA apresentam agora um toast de sucesso em português somente depois de a descarga ser preparada. A notificação identifica o formato e mostra o nome do ficheiro gerado, permitindo ao utilizador reconhecer imediatamente o resultado.

Falhas na preparação da descarga não apresentam uma confirmação positiva: são comunicadas por uma mensagem de erro separada. O toast não altera o estado normativo, não confirma diplomas e não transforma a exportação numa operação de escrita.

## Pesquisa e histórico de exportações

A cadeia normativa IVA dispõe agora de pesquisa local por nome, código ou função normativa. A pesquisa combina-se com os filtros de estado **Todos**, **Em falta** e **Confirmados**, sem alterar a contagem global, a percentagem ou a política `CONFIRMED_ONLY`.

As exportações bem-sucedidas são registadas num histórico local limitado aos cinco ficheiros mais recentes da sessão do navegador. Cada entrada conserva apenas os dados necessários para permitir um novo download ou a abertura do ficheiro num separador separado; não há persistência no servidor nem alteração de fontes normativas. O toast de sucesso inclui a acção **Abrir ficheiro**, com tratamento explícito para bloqueios do navegador.

## Pesquisa, histórico e abertura de exportações

O painel IVA passou a permitir pesquisa local por nome, código ou função normativa, combinável com os filtros de estado da cadeia. As exportações CSV e PDF concluídas são mantidas num histórico local limitado aos cinco ficheiros mais recentes da sessão actual, permitindo descarregar novamente o conteúdo sem repetir a consulta ou o processo de geração.

O toast de sucesso inclui a acção **Abrir ficheiro**, que cria um URL temporário e abre a exportação num novo separador. O histórico e os URLs temporários não são persistidos no servidor; a funcionalidade não confirma diplomas, não modifica fontes normativas e não altera a política `CONFIRMED_ONLY`.

## Refinamentos avançados do fluxo IVA

Foi acrescentado um `AlertDialog` antes de limpar uploads simulados. A confirmação explica que o ficheiro, a pré-visualização e o progresso local serão removidos, enquanto a prontidão real apenas será relida; cancelar mantém o estado intacto.

A selecção ou arrastar de um PDF executa uma validação simulada do nome contra o catálogo visual dos cinco diplomas. Um nome compatível apresenta um aviso informativo; uma divergência apresenta uma mensagem de atenção. Esta validação é heurística, não constitui confirmação humana, não cria evidência e não activa regras.

Os diplomas passaram a ter etiquetas temáticas e nível de importância visíveis, com filtros separados por área temática e importância. A lista suporta ordem normativa, ordem alfabética e data de carregamento. Quando disponível, a data é obtida do `createdAt` real da fonte normativa, sempre dentro do escopo da organização; na ausência de data, é preservada a ordem normativa.

O histórico de exportações passou a estar sempre visível. Sem ficheiros, apresenta um estado vazio explicativo. Com ficheiros, permite ordenar por mais recentes, mais antigas ou tipo de ficheiro. O histórico continua limitado à sessão do navegador, sem persistência adicional no servidor.

A suite global validou 132 ficheiros e 524 testes, incluindo 21 testes direccionados do painel e simulador. O TypeScript terminou sem erros.
