# Verificação pós-correcção — painel IVA

**Data:** 26 de Agosto de 2026

Após a correcção do input de `normative.ivaAccounts`, o shell do BALANCERTS.ERP foi recarregado no navegador autenticado. A interface deixou o estado transitório «A carregar módulo…» e exibiu a empresa Repair Lubatec, os alertas de alto risco, os filtros CSV/PDF, a actividade recente, o estado fiscal `IVA EXCLUSAO` e o indicador de preparação do motor contabilístico.

A consulta deixou de impedir o carregamento do módulo. Os erros anteriores relacionados com a chave `regime` permanecem apenas como histórico nos logs, com timestamps anteriores à correcção. A verificação foi de leitura apenas: não foram submetidas operações contabilísticas nem alterados dados.
