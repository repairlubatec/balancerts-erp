# BALANCERTS.ERP — Parecer documental da cadeia normativa do IVA angolano

**Data:** 23 de Agosto de 2026.  
**Estado:** auditoria documental concluída para as fontes recebidas; implementação e activação normativa continuam condicionadas.

## Conclusão executiva

A documentação recebida confirma a cadeia definida pelo utilizador. A **Lei n.º 7/19** é a fonte originária do Código do IVA e deve ser preservada para histórico. A **Lei n.º 17/19** altera o regime original com vigência própria e deve permanecer como versão intermédia. O **Decreto Presidencial n.º 180/19** é o regulamento do Código e contém o código contabilístico do IVA, incluindo a conta **34.5 — IVA**, subcontas e regras de movimentação. O **Decreto Executivo n.º 134/19** aprova os modelos declarativos e formulários operacionais. A **Lei n.º 14/23** altera e republica o Código e é a peça central da versão consolidada actualmente utilizada.

A regra correcta para o software não é “usar o diploma mais recente para tudo”. É seleccionar a regra pela matéria e pela data juridicamente relevante, mantendo relações explícitas entre versão originária, alterações, regulamento, modelos e republicação. Nenhuma regra nova foi activada nesta auditoria.

## Fontes preservadas

| Fonte | PDF local | Páginas | SHA-256 | Função |
|---|---|---:|---|---|
| Lei n.º 7/19 | `lei-7-19-iva.pdf` | 25 | `cf8539472eded39afdeaadf8887aa85ccade46a39869318730b360b4e2eed3d8` | Código originário e histórico |
| Lei n.º 17/19 | `lei-17-19-iva.pdf` | 4 | `e5d9fe6ae66e67303ed364e4a61b443e86bb9c46fb99964ff42977fc5ca06b82` | Alteração do regime original |
| Decreto Presidencial n.º 180/19 | `decreto-presidencial-180-19-iva.pdf` | 12 | `1178226f04a13abf6fbd9ab4e6830a92f7d5a5bcc2ae826457ee8eeb273b5694` | Regulamento e código contabilístico IVA |
| Decreto Executivo n.º 134/19 | `decreto-executivo-134-19-modelos-iva.pdf` | 16 | `fd9fcfa6e5b118b56f1664689ed4a8d75ed64208873ac6499d027686b8350fdb` | Modelos declarativos e formulários |
| Lei n.º 14/23 | `lei-14-23-iva-oficial-recebida.pdf` | 77 | `d9fa7e618a32a134853e761126e7851c331f5620a0eee87be4ce7aae380545d6` | Alteração e republicação consolidada |

O PDF recebido da Lei n.º 14/23 tem o mesmo hash do PDF anteriormente preservado como `lei-14-23-iva.pdf`, confirmando identidade binária entre os dois ficheiros.

## Cadeia normativa e temporal

| Diploma | Data/publicação | Vigência confirmada | Relação com a cadeia |
|---|---|---|---|
| Lei n.º 7/19 | 24 de Abril de 2019; DR I Série n.º 55 | Código entra em vigor em 1 de Julho de 2019 | Fonte originária |
| Decreto Presidencial n.º 180/19 | 24 de Maio de 2019; DR I Série n.º 72 | Entra em vigor em 1 de Julho de 2019 | Regulamento subordinado ao Código |
| Decreto Executivo n.º 134/19 | 10 de Junho de 2019; DR I Série n.º 78 | Entra em vigor na publicação | Modelos declarativos, ao abrigo do artigo 73.º e do artigo 2.º do regulamento |
| Lei n.º 17/19 | 13 de Agosto de 2019; DR I Série n.º 104 | Entra em vigor em 1 de Outubro de 2019 | Alteração da Lei n.º 7/19 e do Código |
| Lei n.º 14/23 | 28 de Dezembro de 2023; DR I Série n.º 246 | Entra em vigor na data da publicação | Alteração, revogações e republicação integral do Código |

A cronologia deve ser distinguida da hierarquia: o Decreto Executivo é cronologicamente anterior à Lei n.º 17/19, mas é juridicamente subordinado ao Código e ao regulamento habilitante. A Lei n.º 14/23 consolida o Código para a versão actual, mas não reescreve a história das operações anteriores.

## Confirmações do Decreto Presidencial n.º 180/19

A leitura visual integral confirmou no artigo 20.º que é criado no PGC aprovado pelo Decreto n.º 82/01 o código de contas para contabilização das operações activas e passivas do IVA, designado **34.5 — IVA**. O mesmo artigo cria as contas 34.6 — Certificado de Crédito Fiscal a Compensar, 63.5 — IVA e 75.3.1.2 — IVA.

O artigo 21.º confirma o desdobramento principal da conta 34.5: IVA suportado, IVA dedutível, IVA liquidado, IVA regularizações, IVA apuramento, IVA a pagar, IVA a recuperar, IVA reembolsos pedidos e IVA liquidações oficiosas. O artigo 22.º confirma o desdobramento de quarto grau e permite outros desdobramentos justificados tecnicamente conforme a especificidade da actividade. O mesmo artigo remete as regras de movimentação para o Anexo I.

O Anexo I confirma as subcontas para existências, meios fixos e investimentos, outros bens e serviços, operações gerais, IVA de caixa, autoconsumo e operações gratuitas, operações especiais, regularizações mensais e anuais, apuramento normal ou de caixa, IVA a pagar, IVA a recuperar e estados dos reembolsos. A fonte deve ser usada literalmente, porque o OCR confunde por vezes pontos, vírgulas e algarismos; o catálogo definitivo deve conservar página, imagem, texto confirmado e hash.

## Confirmações do Decreto Executivo n.º 134/19

O artigo 1.º aprova os modelos declarativos anexos. A base legal visível remete para o artigo 73.º do Código aprovado pela Lei n.º 7/19 e para o artigo 2.º do Decreto Presidencial n.º 180/19. O diploma aprova, entre outros, a declaração de início, alteração e cessação, a declaração periódica e anexos, modelos do regime transitório, restituição, mapa de fornecedores e regularização de créditos de cobrança duvidosa e incobráveis.

As páginas anexas confirmam o Modelo 7, anexos de clientes e fornecedores, anexo do sector petrolífero, regularização de créditos, pedido de restituição, declaração do regime transitório e mapa de fornecedores para regime transitório/não sujeição. O diploma entra em vigor na data da publicação, 10 de Junho de 2019. Estes modelos não devem ser confundidos com novas taxas ou alteração do Código.

## Confirmações da Lei n.º 17/19

A leitura integral confirma a natureza de lei alterativa, não de novo Código autónomo. A lei altera disposições da Lei n.º 7/19 e artigos do Código, com impacto em apuramento, cadastro, imposto de consumo incorporado, valor tributável nas importações, imposto cativo, direito à dedução, transmissão de bens e prestações de serviços. A vigência inicia-se em 1 de Outubro de 2019. O documento deve ser preservado como camada histórica intermédia.

## Confirmações da Lei n.º 14/23

A leitura visual da identificação, do artigo 19.º e dos anexos confirma a primeira alteração de 2023 ao Código, revogações específicas e republicação integral. O artigo 19.º consolidado contém 14% como taxa geral, 7% para o regime simplificado, 7% para hotelaria e restauração sob condições cumulativas, 5% para bens alimentares de amplo consumo/insumos agrícolas dos Anexos I e II, e 1% para o regime tributário especial de Cabinda, ressalvado o Anexo III. O artigo 21.º mantém a regra de cativação de 50% para as entidades indicadas.

A taxa não pode ser aplicada apenas por nome comercial. A operação deve ser enquadrada por regime, matéria, momento de exigibilidade, classificação do bem/serviço e, quando aplicável, anexo. As disposições finais confirmam revogações, republicação integral e entrada em vigor na data da publicação.

## Confronto com o BALANCERTS.ERP

O código actual contém uma base útil, mas ainda não representa toda a cadeia jurídica com granularidade suficiente para activação literal. O tipo `FiscalRule` guarda código, regime, datas, taxa e evidência; não guarda de forma estruturada diploma, artigo, hierarquia, relação de alteração/revogação, isenção, dedutibilidade, autoridade da fonte ou método de cálculo. A função `activeFiscalRule` escolhe a primeira regra compatível e não resolve sobreposição ou precedência normativa.

O cálculo actual aplica uma taxa percentual ao valor líquido ou zera o imposto no regime de exclusão. Isso não modela integralmente taxa reduzida condicionada, isenção, cativação, dedução, IVA suportado, regularizações, apuramento, reembolsos, regime de caixa, liquidações oficiosas ou a utilização das contas 34.5. A tabela `documentTaxes` tem taxa, base, imposto, regime e ligação opcional a regra, mas não guarda artigo, fonte, versão jurídica ou classificação fiscal completa.

O catálogo normativo actual não contém ainda, como cadeia estruturada, as quatro fontes de 2019 recebidas. O calendário AGT de 2026 e os relatórios fiscais são úteis como camada operacional, mas estão simplificados e não demonstram em cada resultado a norma, artigo e versão que fundamentaram o cálculo. `chartAccounts` suporta código, designação, pai e vigência por empresa, mas ainda não prova a confirmação documental individual de 34.5 e subcontas.

## Matriz de activação condicionada

| Componente | Situação | Condição para activação |
|---|---|---|
| Lei n.º 7/19 histórica | Fonte preservada | Manter consulta por data e não aplicar retroactivamente a versão actual |
| Lei n.º 17/19 | Fonte preservada | Relacionar cada alteração com artigo original, nova redacção e vigência desde 1-10-2019 |
| Decreto Presidencial n.º 180/19 | Confirmado visualmente | Importar conta 34.5/subcontas e movimentos apenas após validação individual no catálogo PGCA |
| Decreto Executivo n.º 134/19 | Confirmado visualmente | Modelar formulários e anexos por versão, sem o transformar em fonte de taxas |
| Lei n.º 14/23 | Fonte central consolidada | Manter taxas/anexos com artigo, vigência, classificação e evidência |
| Motor fiscal | Parcialmente compatível | Necessita precedência normativa, isenções, dedução, cativação, regularizações e trilho de prova |
| Motor contabilístico IVA | Parcialmente compatível | Necessita regras confirmadas de movimentação para 34.5 e subcontas |
| Declarações | Parcialmente compatível | Necessita mapeamento dos Modelos 7 e anexos do Decreto Executivo |

## Parecer

**Resultado: NÃO ACTIVAR AINDA.** A documentação primária está preservada e a cadeia normativa está coerentemente identificada. O ERP já possui componentes fiscais e contabilísticos relevantes, mas ainda existem lacunas técnicas para alegar conformidade literal completa com os cinco diplomas. A próxima fase deve ser uma especificação de dados e regras, seguida de validação humana das contas/movimentos e só depois implementação versionada, com testes e rollback.

Este parecer não é aconselhamento jurídico externo nem homologação da AGT. A confirmação final de obrigações fiscais, vigência posterior e aplicação a casos concretos deve ser validada por contabilista certificado/assessor jurídico em Angola.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado "Portal do Contribuinte — Imposto sobre o Valor Acrescentado"
[3]: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao "AGT — Legislação do IVA"
[4]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ "Decreto Presidencial n.º 180/19 — referência pública"
[5]: https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/ "Decreto Executivo n.º 134/19 — referência pública"
[6]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ "Lei n.º 14/23 — referência pública"
