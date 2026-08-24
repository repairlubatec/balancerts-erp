# Auditoria intermédia — módulo de Contabilidade

**Data:** 25 de Agosto de 2026.  
**Âmbito:** incorporação PGCA, lançamentos, relatórios e interface desktop.

## Evidência actual do PGCA

A base de dados contém uma única versão `PGCA-82-01`, na organização 1, com estado `UNDER_REVIEW`. A consulta corrigida por subconsultas independentes devolveu 27 contas PGCA, 27 confirmadas, 2 fontes, 2 fontes confirmadas e zero regras contabilísticas activas. Portanto, o plano não está activo nem completamente incorporado como versão operacional: permanece em revisão e não cumpre os pré-requisitos de validação/activação do workflow.

O workflow confirma que a validação exige todas as contas e fontes confirmadas; a activação exige versão `VALIDATED`, contas/fontes confirmadas e cobertura completa das operações contabilísticas obrigatórias. Sem regras activas, a activação está bloqueada.

## Evidência contabilística persistida

A base contém 18 contas no plano de contas operacional `chartAccounts`, 1 lançamento, 2 linhas e 0 regras contabilísticas. Existe 1 lançamento `POSTED` e `APPROVED`. Esta base permite validar a mecânica de demonstração para o conjunto persistido, mas não sustenta a afirmação de que todo o PGCA foi incorporado ou que todos os fluxos automáticos estão prontos.

## Evidência dos relatórios

Os construtores de relatórios filtram lançamentos `POSTED` e `APPROVED`, agregam por código e calculam balancete, diário, razão, demonstração de resultados e balanço. A demonstração de resultados usa prefixos `6` e `7`; o balanço usa prefixos `1/2`, `3/4` e `5`, incluindo o resultado líquido no capital próprio. Existem também resumo IVA, antiguidade de saldos, registo fiscal, reconciliação de origem documental e reconciliação agregada.

A rota `/relatorios` foi visualmente verificada em janela desktop. Apresenta o balancete com contas `45.1.1 — Caixa Repair Lubatec` e `61.3.1 — Mercadorias — Mercado nacional`, totais de débito/crédito equilibrados em 50.000,00 AOA e reconciliação 5/5. Também expõe exportação CSV, Excel, impressão/arquivo PDF, gráficos e antiguidade de saldos. A interface é profissional e não usa scroll global na janela; as áreas extensas usam contenção própria.

A verificação visual não prova, por si só, que os mapas cubram todos os movimentos legais do PGCA. A cobertura actual é a dos dados persistidos e das regras implementadas, não uma homologação normativa.

## Pontos a confirmar na fase seguinte

É necessário confrontar a lista de 714 contas em staging com as 27 contas PGCA persistidas e as 18 contas operacionais, confirmar se os 714 registos foram apenas pré-análise ou se existe um processo de importação ainda não aplicado, e verificar se os relatórios permitem seleccionar explicitamente o exercício/período em todos os mapas. Também é necessário testar exportações com dados reais persistidos, limites de listagem, estados vazios e rastreabilidade dos relatórios.

Até à conclusão destas verificações, a conclusão provisória é: **relatórios funcionais para o conjunto persistido e reconciliado; plano PGCA ainda não completamente incorporado nem activo**.
