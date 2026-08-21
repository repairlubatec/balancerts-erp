# Matriz de implementação — requisitos financeiros angolanos

## Âmbito

Este documento converte o conteúdo integral de `pasted_content_13.txt` em frentes implementáveis no BALANCERTS.ERP. A regra técnica é preservar o fluxo `Empresa → Exercício → Período → PGCA`, manter Kz/AOA como moeda funcional quando configurada, impedir lançamentos fora do período aberto, exigir autorização server-side e não activar contas, taxas ou obrigações normativas sem fonte confirmada.

| Área do documento | Resultado alvo | Estado observado no projecto | Próxima acção técnica |
|---|---|---|---|
| Contabilidade | PGC/PGCA, lançamentos, documentos, Diário, Razão, Balancete, apuramentos, fecho, demonstrações e auditoria | Base operacional e PGCA integrado em lançamentos manuais, CSV, saldos, regularizações, tesouraria, salários, estornos e depreciações | Completar regras automáticas por operação e relatórios dependentes de regras confirmadas |
| Fiscalidade | IVA suportado/liquidado/dedutível, apuramento, retenções e obrigações | Regimes Angola, resumo IVA, calendário AGT e validações fiscais persistentes já disponíveis; taxas não devem ser inventadas | Criar catálogo versionado de retenções/IVA apenas com diploma confirmado e ligar a documentos/pagamentos |
| Tesouraria | Dashboard, caixa, bancos, recebimentos, pagamentos, contas a receber/pagar, transferências, reconciliação, adiantamentos, fluxo de caixa, compromissos e financiamento | Contas de caixa/banco, pagamentos, transacções, reconciliação e publicações contabilísticas já existem | Completar estados de aprovação, alocações parciais/múltiplas, compromissos e previsões |
| Caixa | Abertura, fundo, entradas, saídas, reforço, sangria, transferências, adiantamento, reembolso, fecho e conferência | Contas e transacções persistentes existem; conferência/reconciliação existe para banco | Implementar ciclo explícito de sessão de caixa, diferença justificada e autorização |
| Bancos | Banco, conta, número, IBAN, moeda, titular, agência, conta contabilística, saldo inicial e estado | Cash accounts e movimentos bancários existem; moeda funcional é suportada | Acrescentar campos bancários em falta de forma não destrutiva e validar formato/ACL |
| Recebimentos | Total/parcial, vários documentos, vários recebimentos, adiantamento, devolução, diferença e desconto autorizado | Payments ligados a documentos e contas de tesouraria já existem | Implementar alocação persistente de pagamentos a documentos e estados de saldo |
| Pagamentos | Total/parcial, múltiplas facturas, adiantamentos, despesas, impostos, salários e fornecedores | Payments, aprovação/execução contabilística base e integração com documentos já existem | Completar alocações, retenções, aprovação por segregação e mapa de vencimentos |
| Retenções | Bruto, retenção e líquido; taxa versionada por natureza e vigência | Estrutura fiscal versionada existe, mas não se deve assumir taxa sem fonte | Criar regras documentais confirmadas e calcular retenção no servidor |
| IVA em tesouraria | Separar valor facturado de recebido/pago e manter ligação ao fiscal/PGCA | Documentos, pagamentos e resumo IVA existem | Expor saldos em aberto e IVA associado por documento/pagamento |
| Reconciliação bancária | Importar Excel/CSV/OFX, comparar, sugerir correspondências e exigir tratamento para divergências | Reconciliação bancária persistente existe, com diferença e estado | Completar importadores delimitados e motor de matching auditável, sem confirmação automática irreversível |
| Contas a receber/pagar | Vencido, hoje, 7 dias e 30 dias com navegação para clientes/fornecedores | Aging de clientes/fornecedores e relatórios persistentes existem | Expor agregados temporais no dashboard de Tesouraria com filtros tenant-aware |
| Fluxo de caixa | Realizado, previsto, comprometido e saldo projectado | Dashboard financeiro e tesouraria base existem | Definir fontes e estados para previsão/compromisso; não misturar valores reais com estimativas |
| Obrigações ao Estado | IVA, Imposto Industrial, retenções, Segurança Social, outros, guias, vencimento e estado | Calendário/validação AGT existe; execução externa ainda não | Criar catálogo de obrigações e anexos apenas como controlo interno; submissão AGT fica externa |
| Salários | Folha → líquido → Tesouraria → pagamento → banco → Contabilidade | Folha valida PGCA e posting normativo existe | Ligar pagamento de folha a fluxo de aprovação e reconciliação |
| Aprovação de pagamentos | Criado → aprovação → aprovado → autorizado → executado → conciliado | RBAC e segregação base já existem | Fechar máquina de estados própria e impedir auto-aprovação conforme política |
| Moedas | Kz primeira classe; USD/EUR/outras com câmbio, data, original, Kz e diferenças | Multimoeda com taxa, fonte, data e moeda funcional existe | Completar visualização e diferenças cambiais nos relatórios/tesouraria |
| Relatórios de Tesouraria | Caixa, bancos, recebimentos, pagamentos e financeiros | Relatórios contabilísticos/fiscais e reconciliação já existem | Expor livros/extractos/mapas com filtros por empresa/período e exportação auditada |
| Arquitectura normativa | Regras com descrição, diploma, artigo, vigência, taxa, regime e estado | Metamodelo PGCA/fonte normativa/versionamento/workflow já existe | Reutilizar metamodelo para IVA/retenções e bloquear activação sem validação |
| Segurança e auditoria | Isolamento, RBAC, segregação, idempotência, auditoria e reconciliação | Cobertura extensa de backend e testes existe | Acrescentar testes para cada nova mutação e garantir nenhuma escrita externa automática |

## Dependências externas não simuláveis

A integração bancária real exige credenciais, formatos e autorização do banco. A homologação AGT exige endpoint, credenciais e documentação oficiais. A validação EXE/MSI e assinatura Windows exige máquina e certificado fora do sandbox. Estes pontos serão preparados com contratos, estados, logs e rollback, mas não serão falsamente declarados como concluídos.

## Critério de implementação

Nenhum valor fiscal, taxa de retenção, conta PGCA, IBAN, saldo, correspondência bancária ou obrigação será inventado. Dados de demonstração só podem ser usados em testes explicitamente isolados; não podem aparecer como métricas de produção.
