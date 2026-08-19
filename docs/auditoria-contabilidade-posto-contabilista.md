# Auditoria funcional — posto de Contabilidade do BALANCERTS.ERP

**Autor:** Manus AI  
**Data:** 19 de Agosto de 2026  
**Âmbito:** Contabilidade angolana, experiência desktop, isolamento por empresa e preparação PGC/SAF-T AO.

## Conclusão executiva

O módulo actual já possui uma base segura de dupla entrada: exercícios e períodos, contas por empresa, diário, linhas de diário, validação de débito/crédito, lançamento persistente, reversão, fecho/reabertura auditados e construtores de balancete, diário, razão, demonstração de resultados e balanço no servidor. Contudo, a interface expõe essencialmente um formulário de lançamento e indicadores genéricos. Isto não constitui ainda um posto de trabalho completo para um contabilista.

O Decreto n.º 82/01 aprova o Plano Geral de Contabilidade e estabelece a sua aplicação obrigatória às sociedades comerciais e empresas públicas que exerçam actividade em Angola ou tenham sede em Angola [1]. O mesmo diploma apresenta como componentes das demonstrações financeiras o balanço, a demonstração de resultados, a demonstração de fluxos de caixa e as notas às contas [1]. A fonte pública consultada também atribui ao Ministro das Finanças competência para alterar nomenclatura, código, conteúdo e introdução ou eliminação de contas [1]. Por isso, o ERP deve tratar o plano como **versão parametrizável com origem e vigência**, não como uma lista fixa e não auditável.

A OCPCA descreveu posteriormente a necessidade de revisão e actualização do PGC, referindo os Decretos n.º 82/01 e n.º 40/02 e a necessidade de aproximação às normas internacionais [2]. Assim, o sistema pode oferecer uma base PGCA com versão identificada, regras de vigência e importação de actualizações, mas não deve declarar que uma versão é oficialmente actualizada sem publicação ou activo oficial verificável.

## Inventário actual e lacunas

| Área | Existente | Lacuna comercial que deve ser fechada |
|---|---|---|
| Exercícios e períodos | Exercício, mês, estado, fecho e reabertura auditados | Calendário de exercícios, criação assistida de todos os períodos, período de apuramento e bloqueios visíveis |
| Plano de contas | Código, nome, conta-pai, lançável e vigência | Navegador hierárquico, criação/edição controlada, importação de plano, classes/tipos, conta analítica, contas de terceiros e versão PGCA |
| Lançamentos | Dupla entrada, validação e publicação | Documento de suporte, diário, data contabilística, centro de custo, entidade, moeda, anexos, pré-visualização, aprovação e correcção por estorno |
| Diário e razão | Construtores no servidor | Consultas por período/diário/conta/documento, saldo progressivo, pesquisa, exportação e impressão |
| Balancete | Construtor no servidor | Mapa com saldos iniciais, movimentos, saldos finais, comparação entre períodos e validação de equilíbrio |
| Demonstrações financeiras | Balanço e resultados no servidor | Fluxos de caixa, notas às contas, comparativos, assinatura/preparação e exportação documental |
| Apuramentos | Avaliação de fecho e regras fiscais existentes | Apuramento de IVA, resultados, regularizações, depreciações, acréscimos/diferimentos e período 13 auditado |
| Importação | Ferramentas fiscais tabulares noutras áreas | Importação contabilística com pré-validação, mapeamento, erros por linha, idempotência e aprovação humana |
| Auditoria | Cadeia e eventos de mutações críticas | Evidência por lançamento, filtros, origem, utilizador, aprovação e ligação ao arquivo digital |
| Segurança | RBAC e isolamento por empresa | Permissões específicas para alterar plano, lançar, validar, aprovar, fechar e reabrir |

## Escopo funcional necessário

O posto contabilístico deve ser organizado em quatro zonas de trabalho: **Plano de contas**, **Movimentos**, **Mapas e relatórios** e **Fecho e apuramentos**. Cada zona deve respeitar a empresa e o exercício seleccionados, mostrar o estado do período e impedir operações incompatíveis com um período fechado.

O Plano de contas deve suportar classes e subcontas hierárquicas, contas lançáveis, vigência, natureza/saldo, contas analíticas e mapeamento para relatórios e SAF-T. A cópia ou actualização de uma versão deve criar uma evidência de origem, data e operador; contas com movimentos não devem ser apagadas fisicamente.

Os Movimentos devem permitir escolher diário, data, descrição, documento de suporte, entidade, centro de custo, moeda, taxa de câmbio e linhas de débito/crédito. O lançamento deve ser guardado como rascunho antes da publicação quando a organização exigir revisão. Depois de publicado, a correcção deve ocorrer por estorno ou lançamento de rectificação, nunca por edição destrutiva.

Os Mapas devem fornecer diário, razão, balancete, balanço, demonstração de resultados, fluxos de caixa, extracto por conta, antiguidade e mapas de reconciliação. Todos devem permitir período, intervalo de datas, conta, diário e exportação em formato tabular, mantendo a identificação da empresa, moeda e exercício.

O Fecho deve executar verificações bloqueantes: período aberto, diário equilibrado, contas válidas, documentos contabilísticos coerentes, reconciliações, apuramentos necessários e ausência de lançamentos pendentes. O encerramento deve gerar eventos auditados e o sistema deve suportar reabertura justificada com permissão específica.

## Decisão de implementação

A próxima implementação deve começar pelo núcleo de contas e mapas, porque sem plano de contas navegável o contabilista não consegue trabalhar autonomamente. Em seguida devem ser ligados filtros de período aos relatórios existentes e criada a janela de ferramentas contabilísticas. Só depois devem ser adicionados apuramentos e importação contabilística, sempre sem dados fictícios e com testes de isolamento.

A arquitectura manterá a integração AGT desligada até existirem credenciais, endpoint, XSD e autorização de homologação. A preparação SAF-T AO continuará local e validável, sem declarar certificação.

## Referências

[1]: https://angolex.com/paginas/decreto-presidencial/plano-geral-de-contabilidade-angolano-82a-01a.html "AngoLEX — Decreto n.º 82/01, Plano Geral de Contabilidade"

[2]: https://www.ocpcangola.org/files/ANEXOS/201710240456384.pdf "OCPCA — Normalização Contabilística em Angola"

[3]: https://pt.scribd.com/document/388433477/PGC-Decreto-n%C2%BA82-01-ATF-edicoestecnicas-pdf "Cópia pública do PGC — Decreto n.º 82/01"
