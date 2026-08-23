# BALANCERTS.ERP — Especificação Técnica da Cadeia Normativa do IVA

**Versão:** 1.0 — fase documental autorizada  
**Data:** 23 de Agosto de 2026  
**Estado:** proposta para aprovação; não implementada

## 1. Objectivo e fronteiras

Esta especificação define como o BALANCERTS.ERP deverá representar, seleccionar, provar e activar regras angolanas de IVA com preservação histórica. Ela não altera código, schema, dados, permissões, routers, interfaces, migrações ou integrações. A implementação só poderá começar depois da aprovação formal desta especificação e da confirmação humana das entradas normativas elegíveis.

O princípio central é separar **fonte jurídica**, **versão temporal**, **regra material**, **regra contabilística**, **modelo declarativo** e **estado de confirmação**. Uma regra não é activável apenas por existir num PDF ou por ser a mais recente.

## 2. Fontes primárias e cadeia temporal

| Código | Fonte | Função | Vigência/efeito | Estado no catálogo |
|---|---|---|---|---|
| IVA-L719 | Lei n.º 7/19, de 24 de Abril | Aprova o Código originário | Código entra em vigor em 01-07-2019 | Fonte histórica confirmada |
| IVA-DP18019 | Decreto Presidencial n.º 180/19, de 24 de Maio | Regulamenta o Código e cria a conta 34.5-IVA | Vigência desde 01-07-2019 | Regulamento confirmado |
| IVA-DE13419 | Decreto Executivo n.º 134/19, de 10 de Junho | Aprova modelos declarativos e anexos | Vigência na publicação | Modelos confirmados |
| IVA-L1719 | Lei n.º 17/19, de 13 de Agosto | Altera a Lei n.º 7/19 e o Código | Vigência desde 01-10-2019 | Alteração histórica confirmada |
| IVA-L1423 | Lei n.º 14/23, de 28 de Dezembro | Altera, revoga e republica o Código | Versão central consolidada desde a publicação | Fonte consolidada confirmada |

A resolução de uma regra deverá considerar a data do facto tributário, o momento de exigibilidade, o regime do sujeito passivo, a matéria concreta e a disposição vigente. A Lei n.º 14/23 é a base consolidada para a configuração actual, mas não apaga a Lei n.º 7/19 nem a Lei n.º 17/19 para documentos históricos.

Cada fonte deve possuir `sourceId`, diploma, tipo, data de publicação, início de vigência, fim de vigência quando conhecido, hash SHA-256, páginas, URL institucional, estado de confirmação e relações `amends`, `repeals`, `republishes`, `regulates` e `approvesModels`.

## 3. Precedência normativa

A selecção deve seguir esta ordem determinística: primeiro a matéria e a data aplicável; depois a disposição consolidada vigente; depois a alteração específica vigente; depois o regulamento compatível; por fim o modelo declarativo correspondente. Um regulamento ou formulário nunca pode criar uma taxa material que contradiga o Código. Se duas regras de igual matéria e vigência forem compatíveis apenas parcialmente, o motor deve devolver `NORMATIVE_CONFLICT`, não escolher silenciosamente.

A republicação é uma operação de reconstrução: cada artigo consolidado deve manter ligação às disposições alteradas e revogadas. O catálogo deverá permitir consultar tanto “regra vigente em 2026” como “regra aplicável em 2019/2020”, conservando texto, artigo, página e hash da fonte.

## 4. Modelo semântico de regra

Cada regra fiscal deverá conter, no mínimo, `ruleId`, `sourceId`, `article`, `paragraph`, `annex`, `subjectMatter`, `regime`, `operationType`, `taxBaseMethod`, `rate`, `exemptionType`, `deductionTreatment`, `withholdingTreatment`, `effectiveFrom`, `effectiveTo`, `exigibilityRule`, `priority`, `confirmationState`, `confirmedBy`, `confirmedAt`, `evidencePage` e `evidenceHash`.

A autoridade da fonte deve ser separada da natureza do dado. Assim, uma taxa pode ser `LEGAL_NORM`, enquanto a classificação de um produto pode ser `USER_PROVIDED` ou `AI_SUGGESTED` até confirmação. Apenas a combinação de fonte confirmada, regra confirmada, classificação suficiente e vigência compatível pode produzir um cálculo activável.

## 5. Taxas e regimes da versão consolidada

O artigo 19.º da Lei n.º 14/23 confirma o quadro seguinte:

| Situação | Taxa | Condição de aplicação |
|---|---:|---|
| Taxa geral | 14% | Importações, transmissões de bens e prestações de serviços |
| Regime simplificado | 7% | Sujeito passivo enquadrado no regime |
| Hotelaria e restauração | 7% | Só quando cumpridas cumulativamente as obrigações legais |
| Bens alimentares/insumos agrícolas | 5% | Apenas os bens constantes dos Anexos I e II |
| Regime especial de Cabinda | 1% | Bens sujeitos ao regime especial, excluindo Anexo III |

O motor não deve aceitar apenas uma taxa enviada pelo cliente. Deve resolver o regime, a natureza da operação, a classificação do bem/serviço, o anexo aplicável, a exigibilidade e as condições cumulativas. A cativação de 50% prevista no artigo 21.º é tratamento de imposto cativo e não uma taxa de IVA.

Isenção, não sujeição, exclusão, taxa reduzida e taxa zero devem ser estados semânticos distintos. O resultado deve explicar sempre a norma, artigo, fonte, vigência, base, taxa ou motivo de não liquidação.

## 6. Conta 34.5-IVA e lançamentos

O regulamento cria no PGC a conta **34.5 — IVA**. A estrutura confirmada é:

| Conta | Designação |
|---|---|
| 34.5.1 | IVA suportado |
| 34.5.2 | IVA dedutível |
| 34.5.3 | IVA liquidado |
| 34.5.4 | IVA regularizações |
| 34.5.5 | IVA apuramento |
| 34.5.6 | IVA a pagar |
| 34.5.7 | IVA a recuperar |
| 34.5.8 | IVA reembolsos pedidos |
| 34.5.9 | IVA liquidações oficiosas |

O quarto grau deve suportar as subcontas do regulamento: existências, meios fixos e investimentos, outros bens e serviços; operações gerais, IVA de caixa, autoconsumos/operações gratuitas e operações especiais; regularizações mensais, pró-rata definitivo e outras regularizações anuais; apuramento normal ou de caixa; IVA a pagar, a recuperar e estados dos reembolsos.

As regras de movimentação devem ser importadas do Anexo I como regras contabilísticas confirmadas, nunca inferidas pelo nome da conta. Cada movimento automático deverá guardar `accountCode`, `sourceRuleId`, `normativeEvidence`, `entryType`, `debitOrCredit`, `counterAccountPolicy`, `periodId`, `documentId` e `auditCorrelationId`. O lançamento só pode ser publicado se o período estiver aberto, a conta estiver confirmada/postável, a regra estiver activa e débito for igual a crédito.

## 7. Modelos declarativos

O Decreto Executivo n.º 134/19 é a fonte dos modelos e não das taxas materiais. O módulo declarativo deverá modelar versões dos seguintes conjuntos: declaração de início/alteração/cessação, declaração periódica e anexos, regime transitório, restituição, mapa de fornecedores, regularização de créditos de cobrança duvidosa/incobráveis, anexo de clientes, anexos de fornecedores e sector petrolífero.

Cada campo declarativo deverá possuir `modelVersion`, `fieldCode`, `labelLiteral`, `sourcePage`, `requiredWhen`, `valueType`, `calculationOrigin`, `validationRule` e `submissionState`. O sistema deve distinguir valor calculado, valor proveniente de documento, valor introduzido pelo utilizador e valor pendente de confirmação. Alterações dos modelos devem criar nova versão e não reescrever declarações já emitidas.

## 8. Fluxo de confirmação e activação

O fluxo obrigatório é `IMPORTED → OCR_REVIEWED → VISUALLY_CONFIRMED → HUMAN_APPROVED → ACTIVE`, com estados negativos `NEEDS_EVIDENCE`, `CONFLICTED`, `REJECTED` e `SUPERSEDED`. A confirmação humana deve registar utilizador, papel, data UTC, páginas, hash, nota e decisão. Uma fonte confirmada não torna automaticamente todas as regras dela activas.

A activação deve ser por regra ou lote limitado, exigir pré-condições verificáveis, produzir simulação antes/depois, impedir duplicação por chave idempotente e gerar auditoria append-only. Uma regra activa não deve ser apagada; deve ser substituída por nova versão, mantendo o histórico e permitindo rollback lógico para a versão anterior aprovada.

## 9. Segurança e não-regressão

A autorização será exclusivamente server-side, com isolamento por `organizationId` e `companyId`, RBAC por procedimento e segregação entre revisão, activação, publicação contabilística e auditoria. O Operador não pode activar regra; o Contabilista pode propor e rever conforme matriz; o Auditor pode consultar e auditar, mas não publicar; o Administrador pode aprovar a configuração dentro do escopo autorizado. Nenhuma API de IVA poderá aceitar `companyId` sem validar a pertença à organização da sessão.

As consultas deverão ser paginadas e limitadas. Exportações, downloads de evidência e relatórios devem respeitar ACL e auditoria. O motor deve impedir acesso horizontal, alterações pós-aprovação, publicação com evidência ausente, uso de regra expirada e resolução silenciosa de conflitos.

## 10. Critérios de aceitação

| ID | Critério verificável |
|---|---|
| IVA-S01 | Uma operação de 2026 resolve a Lei n.º 14/23 e mostra artigo, vigência, página e hash |
| IVA-S02 | Uma operação histórica resolve a versão vigente na data, sem retroactividade |
| IVA-S03 | 34.5 e subcontas não ficam postáveis sem confirmação humana do regulamento e Anexo I |
| IVA-S04 | A cativação de 50% é calculada separadamente da taxa de liquidação |
| IVA-S05 | Taxas de 5%, 7% e 1% exigem regime, classificação e condição/anexo compatíveis |
| IVA-S06 | Um conflito entre regras devolve erro estruturado e não publica lançamento |
| IVA-S07 | Cada valor declarativo aponta para documento, cálculo, utilizador ou evidência normativa |
| IVA-S08 | Alterar uma regra cria versão e não modifica lançamentos históricos |
| IVA-S09 | Operador e utilizador de outra organização são bloqueados antes da consulta/escrita |
| IVA-S10 | Reprocessamento idempotente não cria regra nem lançamento duplicado |
| IVA-S11 | Rollback lógico restaura a versão anterior e mantém auditoria completa |
| IVA-S12 | A suite existente permanece com 119 ficheiros e 444 testes aprovados, acrescida dos testes novos |

## 11. Ordem de implementação futura

A implementação deve seguir esta ordem: esquema de fontes e relações temporais; catálogo de artigos e anexos; regras materiais; regras contabilísticas da conta 34.5; modelos declarativos; resolução versionada do motor; confirmação humana; publicação contabilística; relatórios; testes de aceitação e rollback. Nenhuma etapa pode activar automaticamente dados pendentes da fila PGCA ou substituir regras actualmente operacionais sem migração aprovada e backup verificável.

## 12. Estado e decisão

A especificação está **pronta para aprovação documental**, mas não autoriza por si só a implementação. A aprovação deverá confirmar expressamente o modelo de precedência, as regras de activação da conta 34.5, o tratamento de versões históricas e o mapa de responsabilidades humanas. Depois da aprovação, a implementação poderá ser iniciada por incrementos pequenos, cada um com testes, revisão visual quando aplicável e checkpoint.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado "Portal do Contribuinte — IVA"
[3]: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao "AGT — Legislação do IVA"
