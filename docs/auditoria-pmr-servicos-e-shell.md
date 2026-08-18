# Auditoria PMR — serviços e experiência desktop

**Data:** 18 de Agosto de 2026

## Conclusão

A comparação confirmou que o PMR apresenta mais do que contabilidade e facturação: destaca gestão de tarefas, empresas e reporting, contabilidade, recursos humanos, ticketing, apoio ao cliente, arquivo digital, tabelas/notificações, estatística, visualização/edição de PDFs, selecção por empresa e suporte entre aplicações. A área de produtos também apresenta contabilidade geral, analítica e orçamental, activos, tesouraria, vendas, stocks, compras, encomendas, POS, obras, gestão de pessoal, API, entidades e artigos.

O BALANCERTS.ERP já cobre melhor o núcleo angolano de empresa, facturação, documentos, clientes, fornecedores, tesouraria, stock, imobilizado, contabilidade, fiscalidade, relatórios, fecho, auditoria, SAF-T local, QR/PDF/hash e configuração AGT desligada. As lacunas funcionais mais relevantes face ao PMR são um centro de tarefas/notificações, arquivo digital associado a entidades e documentos, visualizador de PDF, compras/encomendas/POS/obras, contabilidade analítica/orçamental, recursos humanos/ticketing e uma API pública documentada. Estes módulos devem ser classificados como expansão posterior; não devem ser simulados com dados demonstrativos.

## Diferença de shell

O shell actual já tem menu superior, sidebar redimensionável, tabs persistentes, atalhos Ctrl+1..9 e Ctrl+W, selector de empresa e barra de estado. Contudo, tabs sozinhas continuam a comunicar uma aplicação web. Foi introduzido nesta execução um contentor de janela interna com título de módulo, contexto operacional, foco visual, minimizar, maximizar/restaurar e fechar. A moldura preserva o conteúdo real do módulo e os contratos tRPC.

## Implementação desta execução

A janela interna é apresentada dentro da área central, com barra de título, ícone do módulo, controlos Windows e estado minimizado restaurável. O modo maximizado usa uma camada posicionada sobre a área de trabalho, sem perder a navegação lateral ou a barra de estado. O PWA mantém a refluidez através de media queries.

## Próximas lacunas prioritárias

| Prioridade | Lacuna | Decisão |
|---|---|---|
| P1 | Janelas internas e janela activa | Implementada no shell actual |
| P1 | Centro de tarefas e notificações accionáveis | Implementar sem dados fictícios |
| P1 | Arquivo digital com ACL, versão e origem | Implementar usando S3 e metadados persistentes |
| P1 | Visualizador de PDF numa janela interna | Implementar com documentos reais e estado vazio honesto |
| P2 | Compras, encomendas, POS e obras | Planear como módulos de negócio separados |
| P2 | Analítica e orçamento | Planear com modelos contabilísticos próprios |
| P2 | RH, ticketing e apoio | Só implementar com requisitos e dados de domínio definidos |
| P2 | API pública | Documentar e expor apenas contratos autorizados |

## Referências externas

[1]: https://pmr.pt/interface/ "PMR Interface"
[2]: https://pmr.pt/produtos/ "PMR Produtos"
[3]: https://pmr.pt/servicos/ "PMR Serviços"
[4]: https://pmr.pt/ "PMR Software"

A análise não considera testemunhos ou alegações comerciais como requisitos técnicos. Também não altera a separação entre preparação AGT e comunicação real.
