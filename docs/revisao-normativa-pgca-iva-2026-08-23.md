# Revisão normativa PGCA/IVA — 23 de Agosto de 2026

**Estado:** reforço técnico concluído; não constitui parecer jurídico externo nem activação de regras não confirmadas.

## Resultado da auditoria

A revisão confirmou que o catálogo PGCA/IVA já separa inventário de revisão e dados operacionais. O PGCA mantém 754 registos catalogados, dos quais 20 estão confirmados visualmente e 734 permanecem pendentes. No IVA existem 9 regras catalogadas, com apenas uma confirmada para a taxa geral de 14% do artigo 19.º da Lei n.º 14/23. Estes números e estados permanecem sujeitos à política `CONFIRMED_ONLY` descrita no relatório de catálogo integral.

A cadeia IVA também permanece temporal e funcionalmente diferenciada: a Lei n.º 7/19 conserva o regime originário, o Decreto Presidencial n.º 180/19 é regulamento subordinado, o Decreto Executivo n.º 134/19 trata de modelos declarativos, a Lei n.º 17/19 altera o regime original e a Lei n.º 14/23 constitui a referência central da versão consolidada actual. A presença de uma fonte na cadeia não autoriza, por si só, activar taxas, isenções, deduções, cativação, regularizações ou a conta 34.5-IVA sem prova literal suficiente.

## Alteração implementada

O avaliador server-side de prontidão IVA passou a exigir, além de regras `ACTIVE`, mapeamento 34.5-IVA `ACTIVE` e fonte confirmada, a presença identificável e confirmada dos cinco códigos estruturantes seguintes:

| Código | Função na cadeia |
|---|---|
| `IVA-LAW-7-19` | Fonte histórica originária do Código do IVA |
| `IVA-DP-180-19` | Regulamento do Código e matéria contabilística do IVA |
| `IVA-DE-134-19` | Modelos e procedimentos declarativos |
| `IVA-LAW-17-19` | Alteração legislativa ao regime originário |
| `IVA-LAW-14-23` | Alteração e republicação do Código do IVA |

Quando faltar qualquer código, a prontidão devolve `IVA_CADEIA_NORMATIVA_INCOMPLETA` e lista `missingChainSources`. A consulta à base de dados passou a transportar o código da fonte, impedindo que cinco estados confirmados sem identidade documental sejam confundidos com cobertura normativa real.

Esta alteração é uma **guarda de segurança**, não uma importação de diplomas, não altera lançamentos históricos, não cria contas, não activa a conta 34.5-IVA e não marca automaticamente fontes como confirmadas.

## Validação

Foram executados os testes normativos, de fontes normativas e fiscais, com **22 testes aprovados**, além da suite completa com **127 ficheiros e 496 testes aprovados**. A verificação TypeScript terminou sem erros. Foram cobertos o estado vazio, a aprovação humana sem activação, a cadeia completa e o bloqueio determinístico de uma cadeia incompleta.

## Pendências reais

Continuam pendentes a conferência literal e o arquivo local dos PDFs oficiais da Lei n.º 7/19, Lei n.º 17/19, Decreto Presidencial n.º 180/19 e Decreto Executivo n.º 134/19, bem como a confirmação visual da conta 34.5-IVA e respectivas subcontas. Também permanecem pendentes as 734 contas PGCA e 8 regras IVA ainda não confirmadas. Nenhuma destas pendências foi resolvida por inferência, OCR não legível ou sugestão de IA.

> A prontidão operacional continua deliberadamente bloqueada quando a cadeia, as fontes, as regras ou os mapeamentos não cumprem os estados exigidos. Esta decisão protege a não-regressão e evita apresentar como vigente uma regra cuja prova primária ainda não foi conferida.

## Referências internas

[1]: `docs/normative-catalog-complete-review-2026-08-22.md` — catálogo integral e estados de confirmação.
[2]: `docs/matriz-cadeia-normativa-iva-angola-2026-08-23.md` — cadeia temporal e funções normativas.
[3]: `server/normative.ts` — avaliação server-side de prontidão e códigos de bloqueio.
[4]: `server/normative.test.ts` — cobertura unitária da política de prontidão.
