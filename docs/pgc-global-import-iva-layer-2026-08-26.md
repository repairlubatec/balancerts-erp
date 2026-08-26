# Implementação global PGCA-82-01 + camada IVA 2019

**Sistema:** BALANCERTS.ERP  
**Data:** 26 de Agosto de 2026  
**Estado:** integração estrutural concluída; activação contabilística permanece protegida por `fail-closed`.

## Resultado

As 765 entradas anteriormente pendentes foram integradas na versão canónica **PGCA-82-01**, associadas à fonte do Decreto n.º 82/01 e gravadas com o estado `NEEDS_NORMATIVE_VALIDATION`. A importação foi executada de forma idempotente: na primeira execução foram inseridos 765 registos e, na repetição, foram inseridos 0 registos e preservados 776.

O total persistido na versão é 792 contas: 776 provenientes do pacote técnico e 16 confirmações visuais anteriores que não tinham correspondência no pacote. Existem 27 contas com estado `CONFIRMED` e 765 com estado `NEEDS_NORMATIVE_VALIDATION`. Não existem códigos duplicados nem pais hierárquicos em falta. As contas staged não foram marcadas como movimentáveis, não receberam natureza contabilística inventada e não foram activadas para posting.

| Verificação | Resultado |
|---|---:|
| Registos do pacote | 776 |
| Inseridos na primeira execução | 765 |
| Preservados na repetição idempotente | 776 |
| Total persistido na versão | 792 |
| Confirmados | 27 |
| Pendentes de validação normativa | 765 |
| Códigos distintos | 792 |
| Pais em falta | 0 |
| Alteração de estado da versão | Nenhuma; permanece `UNDER_REVIEW` |

## Composição versionada

Foi criada a consulta protegida `pgc.composedCatalog`, que recebe `organizationId`, `versionId` e uma data `asOf`. O resultado inclui a versão-base, as contas vigentes nessa data, as camadas normativas vigentes, o número de camadas efectivamente aplicadas e o indicador `postingReady`.

A composição temporal respeita `effectiveFrom` e `effectiveTo`. Para uma data anterior a 2019, as camadas IVA de 2019 não aparecem como vigentes. Para uma data posterior, aparecem relacionadas ao PGCA-82-01. Uma camada só é considerada `appliedForPosting` quando a própria camada e a sua fonte estão confirmadas; além disso, a versão-base precisa estar `ACTIVE` e todas as contas precisam estar `CONFIRMED`.

| Camada | Diploma | Tipo | Vigência registada | Estado |
|---|---|---|---|---|
| IVA-LEI-7-19 | Lei n.º 7/19 | Código IVA | 2019-07-01 | CONFIRMED |
| IVA-CONTAS-180-19 | Decreto Presidencial n.º 180/19 | Contas fiscais IVA | 2019-05-24 | CONFIRMED |
| IVA-DECLARACOES-134-19 | Decreto Executivo n.º 134/19 | Modelos declarativos | 2019-06-10 | CONFIRMED |
| IVA-LEI-17-19 | Lei n.º 17/19 | Alteração IVA | 2019-10-01 | CONFIRMED |
| IVA-LEI-14-23 | Lei n.º 14/23 | Alteração/republicação IVA | 2024-01-01 | CONFIRMED |

A interface do assistente PGCA mostra agora o número total de contas do catálogo composto, as camadas IVA vigentes, as camadas pendentes e o estado `Staged / revisão` ou `Pronto para posting`. Com o estado actual, a interface deve mostrar `Staged / revisão`, porque a versão PGCA continua `UNDER_REVIEW` e existem 765 contas sem validação normativa completa.

## Garantias de segurança

A integração não criou uma versão “PGCA com IVA”, não apagou o plano canónico e não alterou movimentos contabilísticos históricos. A camada IVA é uma relação normativa posterior. O sistema continua a impedir posting em contas que não tenham natureza, regra de movimentação, fonte e estado de validação compatíveis.

A importação global está preparada para ser reutilizada por todas as empresas cadastradas. A Repair Lubatec não é a origem da validade normativa; é apenas a empresa de teste usada para validar o isolamento e a apresentação. Quando a cobertura normativa for confirmada, as mesmas contas e camadas poderão ser disponibilizadas de forma consistente às restantes empresas, sem repetir a importação.

## Validação técnica

Foram aprovados TypeScript e os testes de composição PGCA: **2 testes do catálogo composto**, além dos testes PGCA de validação, workflow e importação visual. A repetição do importador comprovou `insertedCount: 0`, demonstrando idempotência.

## Referências

[1]: https://lex.ao/docs/presidente-da-republica/2001/decreto-n-o-82-01-de-16-de-novembro/ "Decreto n.º 82/01 — Plano Geral de Contabilidade"

[2]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-7-19-de-24-de-abril/ "Lei n.º 7/19 — Código do IVA"

[3]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-17-19-de-13-de-agosto/ "Lei n.º 17/19 — alteração ao Código do IVA"

[4]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ "Decreto Presidencial n.º 180/19 — contas e regulamento do IVA"

[5]: https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/ "Decreto Executivo n.º 134/19 — modelos declarativos IVA"

[6]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ "Lei n.º 14/23 — alteração e republicação do Código do IVA"
