# Matriz de lacunas de contas operacionais PGCA

**Data:** 27 de Agosto de 2026  
**Versão:** PGCA-82-01  
**Estado:** preparação controlada; sem activação produtiva

## Conclusão executiva

A pesquisa documental identificou contas e contrapartidas concretas para as seis operações, mas a base de dados não contém ainda os pares completos de contas movimentáveis necessários para criar regras contabilísticas utilizáveis. A consulta read-only confirmou 10 contas `MOVEMENT`, `acceptsEntries = 1` e `validationStatus = CONFIRMED`.

As contas lançáveis actualmente confirmadas são: `4511 Caixa`, `4512 Caixa`, `4531 Salários`, `6111 Mercado nacional`, `6112 Mercado estrangeiro`, `6121 Mercado nacional`, `6122 Mercado estrangeiro`, `6131 Mercado nacional`, `6141 Mercado nacional` e `6142 Mercado estrangeiro`. Estas contas permitem testar apenas subconjuntos muito restritos de tesouraria, vendas e pagamentos específicos; não permitem criar regras universais sem uma condição de documento e de imposto claramente delimitada.

## Comparação por operação

| Operação | Códigos exigidos pela fonte/modelo | Situação na base | Consequência |
|---|---|---|---|
| Compras | `21`, `22–29`, `32`, eventualmente `34.5.1/34.5.2` | Não há conta lançável de compras, existências, fornecedor ou IVA confirmada | Não criar regra de compra; faltam débito de aquisição/inventário e crédito de fornecedor/tesouraria com contexto completo |
| Vendas | `31/32`, `43/45`, `61`, `34.5.3` quando tributável | Existem contas de vendas `6111`, `6112`, `6121`, `6122`, `6131`, `6141`, `6142` e Caixa `4511/4512`; não há cliente nem IVA 34.5 lançável confirmado | Pode ser preparado um rascunho condicionado a venda a pronto e regime sem IVA aplicável, mas não uma regra geral de vendas |
| Stock | `21`, `22–29` e custo das existências | Não há contas de existências/custo lançáveis confirmadas | Não criar posting de entradas, saídas, consumos ou inventário |
| Tesouraria | `43`, `44`, `45`, `48` e conta de contrapartida | Só existem `4511` e `4512` como Caixa lançável; os restantes grupos não estão completos como pares operacionais | Não criar regra geral de recebimento/pagamento; falta contrapartida documentada por evento |
| Salários | `36.1`, `36.3`, `43/45`, `63`, `34.3` | Existe `4531 Salários`, mas não estão confirmadas contas de remunerações, custos, IRT e retenções lançáveis | Não criar folha salarial automática; `4531` representa meio monetário destinado a salários e não substitui custo, remuneração ou imposto |
| Imobilizado | `37.1`, `37.2`, contas de imobilizado `11–18`, `43/45`, IVA de meios fixos se aplicável | Não há pares completos de compras/vendas de imobilizado e contas de activo lançáveis confirmadas | Não criar regra de aquisição, amortização ou alienação de imobilizado |

## Camada IVA

O Decreto Presidencial n.º 180/19 cria no PGCA o código `34.5 — IVA` e as subcontas de IVA suportado, dedutível, liquidado, regularizações, apuramento, a pagar, a recuperar e reembolsos pedidos. A fonte define movimentos concretos: `34.5.1` debita-se nas aquisições; `34.5.2` debita-se pelo IVA dedutível e transfere-se para o apuramento; `34.5.3.1` credita-se pelo IVA das facturas ou documentos equivalentes; `34.5.5.1` apura o regime normal; `34.5.6.1` representa IVA a pagar; e `34.5.7.1` representa IVA a recuperar.

Estas referências estão formalizadas no código como `DRAFT_ONLY`. A base não tem ainda as subcontas 34.5 confirmadas como contas lançáveis. Consequentemente, nenhuma regra pode receber `ivaAccountId` por aproximação do código de grupo.

## Decisão de activação

A existência de fontes `CONFIRMED` — incluindo o Decreto n.º 82/01, a Lei n.º 7/19, a Lei n.º 17/19, o Decreto Presidencial n.º 180/19, a Lei n.º 14/23, o Decreto Executivo n.º 134/19, o II, o IRT, o IP e o IS — prova a proveniência documental. Não preenche, por si só, os campos `debitAccountId`, `creditAccountId`, `ivaAccountId`, `documentType`, `taxType`, `calculationBase`, `taxRate`, `effectiveFrom` e `sourceId` de uma regra utilizável.

A activação deve aguardar a confirmação literal das contas movimentáveis em falta, a criação de regras por evento e documento, a aprovação humana auditada e a simulação integrada cálculo → posting → SAF-T. O estado `UNDER_REVIEW` e os 0 active rules são, neste ponto, resultados correctos do desenho fail-closed.

## Fontes

[1]: https://lex.ao/docs/conselho-de-ministros/2001/decreto-n-o-82-01-de-16-de-novembro/ "Decreto n.º 82/01 de 16 de Novembro"
[2]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ "Decreto Presidencial n.º 180/19 de 24 de Maio"
