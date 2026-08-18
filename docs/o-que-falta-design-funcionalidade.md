# O que falta no BALANCERTS.ERP — design e funcionalidade

## Síntese

O BALANCERTS.ERP já tem uma shell Windows-first convincente, navegação agrupada, tabs, contexto de empresa, RBAC, auditoria, base fiscal angolana, documentos, relatórios e preparação AGT. O que falta não é uma nova aparência geral; é transformar a base preparada em postos de trabalho completos e eliminar comportamentos que ainda parecem demonstração.

## Design

A moldura ainda precisa de um refinamento final do chrome Windows: o selector de empresa no cabeçalho fica cortado em 1280px, os ícones de minimizar/maximizar/fechar são decorativos no renderer e os menus Ficheiro/Operações/Janela executam acções únicas em vez de apresentarem menus reais. Os formulários densos devem manter a produtividade sem esconder comandos fora do viewport.

O Overview e as grelhas devem eliminar qualquer fallback demonstrativo e distinguir sempre carregamento, vazio, erro e dados reais. O botão “Filtros” do Overview deve abrir filtros reais ou chamar-se “Focar pesquisa”. O avatar, chevrons e cartões que parecem clicáveis devem ter acção real ou deixar de parecer interactivos.

Falta ainda uma biblioteca visual de estados para sucesso, erro, aviso, confirmação, validação e operações irreversíveis. Isto é essencial para uma aplicação empresarial: cada clique deve confirmar o que aconteceu, explicar uma rejeição e indicar a próxima acção.

## Funcionalidade operacional

A facturação é a prioridade máxima. O actual formulário cria apenas um rascunho com uma linha, cliente por ID, AOA, regime EXCLUSÃO e imposto zero. Falta cliente seleccionado por ficha, múltiplas linhas, cálculo IVA dependente da empresa, descontos, retenções, vencimento, notas de crédito, séries por tipo e transições completas de validar/emitir/contabilizar/anular.

Contabilidade tem backend para posting, reversão, diário, razão e relatórios, mas falta um posto de trabalho para criar, validar, publicar e reverter lançamentos. Tesouraria tem contas e procedures de pagamentos/reconciliação, mas falta registar recebimentos/pagamentos, ligar documentos, importar extractos e resolver diferenças.

Fecho tem avaliação e reabertura protegida, mas falta a operação transaccional de fechar um período, bloquear lançamentos, gerar evidência e reabrir com autorização. Relatórios precisam de visualizadores próprios, filtros de período/conta, drill-down, exportação server-side e impressão formal.

Clientes, fornecedores, catálogo, stock e imobilizado têm criação básica, mas faltam fichas completas, histórico, inactivação, armazéns, inventário físico, transferências, movimentos contabilísticos de activos e baixa/alienação com rastreabilidade.

## Fiscalidade e AGT

A prontidão SAF-T ainda precisa de contagens reais de clientes, fornecedores, produtos e regras fiscais; actualmente algumas são fornecidas como zero. A exportação SAF-T final permanece correctamente bloqueada até validação externa, mas deve existir validação local completa e inequívoca.

A integração AGT real não é uma lacuna interna enquanto não houver endpoint, credenciais, XSD/serviço oficial e autorização. O que pode ser concluído já é o adaptador configurável, o validador local, a fila interna, a evidência de pré-homologação e os estados claros “preparado”, “validado localmente” e “bloqueado externamente”.

## Segurança, testes e distribuição

O RBAC backend é uma boa base, mas a UI deve ocultar ou desactivar comandos incompatíveis por perfil. Faltam testes de aceitação autenticados que comprovem no browser os fluxos reais: empresa, série, cliente, produto, rascunho, validação, contabilização, pagamento, reconciliação, fecho e reabertura.

O Electron disponibiliza uma janela com tabs internas, não múltiplas BrowserWindows nativas. O instalador Windows está preparado para EXE/NSIS e MSI, mas ainda faltam URL HTTPS de produção, assinatura de código, actualização, diagnóstico de versão e teste em Windows real.

## Prioridade

P0: remover dados demonstrativos; fechar facturação/documentos; criar contabilidade/tesouraria operacionais; implementar fecho real; corrigir readiness SAF-T.

P1: fichas auxiliares completas; relatórios dedicados; feedback universal de botões; UX RBAC; testes E2E autenticados; chrome Electron funcional.

P2: menus Windows completos; múltiplas janelas nativas; personalização, atalhos contextuais, impressão e refinamentos de densidade.

## Veredicto

A base é suficientemente forte para continuar sem reescrita, mas ainda não deve ser vendida como ERP completo até os P0 serem fechados e os fluxos ponta a ponta serem provados com dados persistentes e testes autenticados. A homologação AGT permanece uma dependência oficial externa e não deve ser simulada.
