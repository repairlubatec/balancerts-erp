# BALANCERTS.ERP — Matriz da cadeia normativa e temporal do IVA angolano

**Estado:** análise documental preparatória; não é activação normativa nem parecer jurídico externo.

## 1. Princípio de interpretação

A existência de um diploma posterior não elimina automaticamente o valor histórico dos diplomas anteriores. O motor deve seleccionar a regra pela data juridicamente relevante da operação, pela matéria regulada e pelo estado de vigência, preservando a fonte anterior para reconstrução histórica. A Lei n.º 14/23 não deve ser aplicada retroactivamente a operações regidas por versões anteriores, e o Decreto Presidencial n.º 180/19 e o Decreto Executivo n.º 134/19 não devem ser tratados como se fossem o próprio Código do IVA.

## 2. Cadeia normativa preliminar

| Ordem temporal e normativa | Fonte | Função jurídica a modelar | Estado documental |
|---|---|---|---|
| 1 | Lei n.º 7/19, de 24 de Abril | Aprovação originária do Código do IVA; base histórica das regras iniciais | Confirmada como fonte institucional; PDF local ainda não arquivado neste projecto |
| 2 | Decreto Presidencial n.º 180/19, de 24 de Maio | Regulamento subordinado ao Código; reembolso, restituição, registo de operações e regras/código contabilístico do IVA | Matéria confirmada por referência institucional/pública; PDF oficial e anexos contabilísticos ainda requerem arquivo e conferência literal |
| 3 | Lei n.º 17/19, de 13 de Agosto | Alteração legislativa ao regime/Código do IVA; deve prevalecer sobre disposições incompatíveis da versão originária a partir da sua vigência | Confirmada como fonte institucional; PDF local ainda não arquivado neste projecto |
| 4 | Decreto Executivo n.º 134/19, de 10 de Junho | Aprovação dos modelos declarativos do IVA e procedimentos de disponibilização/preenchimento/submissão | Confirmado no Portal do Contribuinte/AGT como modelo declarativo; PDF e anexos ainda requerem arquivo e conferência literal |
| 5 | Lei n.º 14/23, de 28 de Dezembro | Primeira alteração/republicação do Código do IVA; regras vigentes apenas desde a sua entrada em vigor, salvo disposições específicas | PDF local arquivado, 77 páginas, hash `d9fa7e618a32a134853e761126e7851c331f5620a0eee87be4ce7aae380545d6`; análise visual prévia existente |

A ordenação acima não significa que o Decreto Executivo n.º 134/19 seja posterior à Lei n.º 17/19: a sequência cronológica exacta deve conservar as datas de publicação e entrada em vigor separadamente da hierarquia normativa. Em particular, o Decreto Executivo de 10 de Junho de 2019 deve ser colocado cronologicamente antes da Lei n.º 17/19 de 13 de Agosto de 2019, mas continua subordinado ao Código e ao regulamento aplicáveis à sua matéria.

## 3. Vigência e precedência

O motor deve possuir, para cada regra, fonte, artigo, diploma, versão, início e fim de vigência, estado, matéria e eventual norma que altere ou revogue. Uma alteração legislativa não deve ser representada pela simples substituição de texto num catálogo actual: deve criar uma versão histórica com relação explícita à regra anterior. O regulamento deve ser consultado apenas na matéria que lhe é atribuída e não pode contrariar a lei. Os modelos declarativos devem ser versionados como procedimentos/formulários, separados das regras de incidência, taxa, isenção e dedução.

## 4. Conta 34.5-IVA e subcontas

A referência à conta **34.5-IVA** e às respectivas subcontas é tratada como requisito de conferência literal do Decreto Presidencial n.º 180/19 e dos seus anexos. O registo de confirmação deverá incluir o código exacto, a designação exacta, a hierarquia, a natureza, cada subconta, a regra de movimentação, a página do PDF e o hash da fonte. Até essa conferência, o catálogo contabilístico não deve activar, renomear ou inferir contas 34.5 com base em transcrições ou sugestões de IA.

Esta conta deve ser ligada semanticamente ao fluxo documento fiscal → operação IVA → lançamento → conta IVA → apuramento → declaração, mas a sua existência no regulamento não autoriza presumir que todas as operações ou regimes utilizem a mesma subconta. O regime, a natureza da operação, o IVA liquidado/suportado/dedutível/não dedutível, as regularizações e o apuramento devem permanecer distinguíveis.

## 5. Confronto preliminar com o código actual

| Área | Estado actual observado | Lacuna face à cadeia primária |
|---|---|---|
| Motor fiscal | `FiscalRule` contém código, regime, datas, taxa e evidência | Não contém fonte legal estruturada, artigo, hierarquia, revogação, isenção, dedutibilidade, método de cálculo ou natureza da autoridade |
| Selecção temporal | `activeFiscalRule` escolhe a primeira regra compatível por regime/data | Não resolve sobreposição, prioridade normativa, conflitos, versão republicada ou regra histórica alterada |
| Cálculo | `calculateIva` aplica taxa percentual simples e zera EXCLUSAO | Não distingue incidência, isenção, dedução, cativação, regularização, importação, regimes especiais ou fundamento legal |
| Catálogo normativo | Inclui Lei n.º 14/23 e fontes fiscais gerais | Não inclui ainda Lei n.º 7/19, Lei n.º 17/19, Decreto Presidencial n.º 180/19 e Decreto Executivo n.º 134/19 como cadeia relacionada |
| Documentos fiscais | `documentTaxes` guarda regime, taxa, base, imposto e ligação opcional a regra | Não guarda artigo, fonte, versão, natureza da operação, isenção, dedutibilidade, decisão de vigência ou prova completa do cálculo |
| Contas | `chartAccounts` guarda código, nome, pai e vigência por empresa | Não existe no modelo actualmente verificado uma confirmação explícita da conta 34.5 e subcontas com fonte, página e regra de movimentação |
| Declarações/AGT | Calendário 2026 e SAF-T têm regras operacionais simplificadas | Não estão ligados de forma determinística aos modelos do Decreto Executivo n.º 134/19, à versão do Código e à regra aplicada em cada documento |
| Relatórios | Resumos reconciliam totais aritméticos | Não demonstram qual artigo/diploma/taxa/regime fundamentou cada cálculo nem todo o tratamento contabilístico |

## 6. Decisão de segurança documental

A cadeia está suficientemente definida para orientar a auditoria, mas não para activar novas regras. Permanecem pendentes o arquivo dos PDFs oficiais em falta, a conferência literal dos anexos do Decreto Presidencial n.º 180/19 — especialmente 34.5 e subcontas — e a reconstrução de vigências/alterações a partir dos textos completos. A Lei n.º 14/23 já tem uma análise local, mas deve ser relacionada formalmente com as versões 7/19 e 17/19 sem apagar o histórico.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado "Portal do Contribuinte — Imposto sobre o Valor Acrescentado"
[3]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ "Decreto Presidencial n.º 180/19 — referência pública de consulta"
[4]: https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/ "Decreto Executivo n.º 134/19 — referência pública de consulta"
[5]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ "Lei n.º 14/23 — referência pública de consulta"
