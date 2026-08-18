# Revisão comercial Windows-first — BALANCERTS.ERP

## Objectivo

Esta revisão concentrou-se na experiência de utilização de uma aplicação empresarial Windows-first. O critério aplicado foi simples: uma acção visível deve executar uma operação real, abrir o destino correcto ou comunicar claramente porque uma operação está bloqueada por regra de negócio, permissão ou dependência externa.

## Correcções funcionais

A grelha **Empresas** passou a tratar a selecção de uma linha como mudança real do contexto activo. Ao seleccionar uma empresa, o identificador é persistido no armazenamento local, a empresa torna-se o contexto usado pelos módulos seguintes e a rota conserva o foco pelo NIF. Isto evita que o utilizador clique numa empresa e continue inadvertidamente a operar sobre outra.

Os comandos **Filtrar** e **Procurar** dos módulos com controlos de registo deixaram de ser simples deslocamentos para formulários. Existe agora uma área de pesquisa textual e filtragem por estado na grelha, com contagem de registos visíveis, limpeza dos filtros e foco de teclado. Na Facturação, os comandos continuam a apontar para os destinos específicos de séries e criação de documento, em vez de um formulário genérico.

O menu **Editar** recebeu comportamento concreto. Em Empresas abre a criação de empresa; em Facturação abre o fluxo de novo documento; nos módulos com edição operacional foca o formulário de actualização. Foram removidos atalhos para uma empresa fictícia e para uma reconciliação bancária sem painel completo, evitando apresentar como pronta uma função que ainda não tem ciclo ponta a ponta.

## Experiência Windows-first

A moldura da aplicação foi refinada com chrome de janela mais contrastado, superfícies operacionais compactas, botões quase quadrados, estados de foco acessíveis, separadores semanticamente marcados como tabs e contador de janelas abertas. A barra de estado identifica o estado operacional do sistema e o pipeline manual passou a executar Windows como primeiro alvo, produzindo os artefactos definidos para a distribuição Windows. A preparação macOS permanece no electron-builder, mas não é requisito da primeira distribuição.

A experiência PWA foi preservada. A validação visual confirmou o comportamento em desktop 1280×720 e em viewport móvel 390×844, sem reintroduzir overflow conhecido na pesquisa ou nos separadores.

## Validação

A suite final executou **53 ficheiros de teste e 186 testes aprovados**. TypeScript, build de produção e `git diff --check` passaram. Foram também revistos visualmente Overview, Empresas e Facturação. O build produz o bundle web e o servidor, enquanto os binários nativos Windows continuam dependentes de execução num runner Windows e, para distribuição assinada, dos certificados da empresa.

## Limites explícitos

A comunicação real com a AGT continua deliberadamente desactivada. QR, PDF, hash, filas, validações locais, pré-homologação e adaptadores permanecem preparados, mas o software não declara certificação nem homologação sem endpoint, credenciais, XSD/códigos oficiais e validação formal da AGT.

Esta revisão melhora a base comercial e elimina pontos mortos identificados; não substitui o teste de aceitação da empresa com utilizadores reais, dados de negócio anonimizados e aprovação dos fluxos contabilísticos/fiscais antes da venda.
