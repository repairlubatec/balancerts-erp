# Matriz de regras operacionais — pesquisa e preparação

## Aviso de estado

Este documento é uma **matriz de preparação**, não uma autorização de posting. Os parâmetros fiscais pesquisados nas páginas oficiais do MINFIN/AGT permanecem `REFERENCE_ONLY`. Uma regra só pode passar a activa depois de estar associada a contas lançáveis PGCA confirmadas, fonte/cadeia normativa, vigência, natureza das contas, condição fiscal aplicável e aprovação humana auditada.

## Princípio contabilístico comum

As contas de natureza devedora aumentam a débito e reduzem a crédito; as contas de natureza credora aumentam a crédito e reduzem a débito. Contas mistas ou contas cuja natureza dependa do facto tributário exigem regra específica confirmada. Este princípio está implementado no motor partilhado e não substitui a leitura da regra particular da conta/operação.

## Matriz por operação

| Operação | Evidência PGCA já identificada | Estrutura de lançamento a preparar | Condições fiscais pesquisadas | Estado seguro |
|---|---|---|---|---|
| Compras | O plano oficial identifica `21 Compras` e subcontas como devoluções/descontos; a camada IVA identifica `34.5 IVA` e subcontas na cadeia própria. | Débito da conta de compra/inventário ou custo confirmada; débito de IVA dedutível apenas quando a operação e o direito estiverem confirmados; crédito de fornecedor/tesouraria confirmado. | IVA depende de regime, operação tributável/isenta, dedutibilidade e localização. IS depende da verba/tabela quando aplicável. | Preparação; não activar sem contas lançáveis e verba/condição fiscal. |
| Vendas | O plano oficial identifica `61 Vendas`, `613 Mercadorias`, `6131 Mercado nacional` e `6132 Mercado estrangeiro`; também identifica contas de IVA na camada normativa. | Débito de cliente/tesouraria confirmado; crédito de vendas confirmado; crédito de IVA liquidado apenas quando devido; custo de venda/inventário separado conforme regra PGCA aplicável. | IVA geral publicado a 14%; Cabinda tem condição específica publicada a 2% para importação/transmissão de bens; exportações e isenções exigem classificação documental. II não é imposto sobre cada venda, mas tem pagamento provisório sobre volume de vendas nas condições oficiais. | Preparação; taxa não deve ser aplicada sem regime/localização/facto. |
| Stock | O PGCA contém classes de compras, inventários e variação de inventários; a conta exacta depende da natureza e do método adoptado no plano interno canónico. | Entrada, saída, consumo, regularização e inventário devem usar pares de contas confirmados e uma regra de documento/causa. | Normalmente a tributação depende do documento de aquisição/saída, não de uma taxa de stock genérica. | Bloqueado para posting automático enquanto o par de contas e evento não estiver confirmado. |
| Tesouraria | O PDF PGCA conferido mostra classe 4 — Meios Monetários, `45 Caixa`, `451 Fundo fixo`, `4511 Caixa`, `4512 Caixa`, `452 Valores para depositar`, `453 Valores destinados a pagamentos específicos` e `4531 Salários`. | Débito por entradas e crédito por saídas em contas de natureza devedora; a contrapartida deve ser determinada pelo documento e não por um atalho genérico. | IVA/IRT/IS só entram quando o pagamento liquida uma obrigação ou retenção documentada. | A natureza geral está confirmada; regras por evento ainda exigem conta contrapartida e documento. |
| Salários | O PGCA conferido identifica `4531 Salários` dentro dos valores destinados a pagamentos específicos. O IRT oficial distingue grupos A, B e C, deduções, isenções e retenções. | Débito de gasto/remuneração e encargos confirmados; crédito de salários a pagar, retenções IRT e segurança social apenas com contas e cálculo confirmados. | Grupo A usa tabela anexa; grupos B/C têm taxas e retenções diferentes nas condições publicadas. A matéria colectável e as deduções não podem ser reduzidas a uma taxa fixa. | Bloqueado para cálculo automático até tabela IRT vigente, grupo do trabalhador e contas de retenção estarem confirmados. |
| Imobilizado | O plano interno/canónico identifica contas de imobilizado e operações de compra/venda de imobilizado; a conta exacta deve ser seleccionada pelo código confirmado e pelo tipo de activo. | Débito do activo/IVA dedutível quando elegível; crédito de fornecedor/tesouraria. Alienação exige baixa, depreciação acumulada, ganho/perda e imposto aplicável. | IVA e IP/IS podem depender do tipo de operação; IP trata transmissões de imóveis, não todo o imobilizado. IS depende de verba/tabela. | Bloqueado até classificar activo corpóreo/incorpóreo/imóvel e confirmar contas/tributação. |

## Parâmetros pesquisados que podem alimentar rascunhos

A pesquisa oficial do Portal do Contribuinte apresenta II a 25% no regime geral, 10% para actividades exclusivamente listadas, 35% para sectores listados e 2% para pagamento provisório sobre vendas nos primeiros seis meses. Apresenta IRT por grupos A/B/C, com a tabela anexa para A e taxas publicadas para B/C consoante retenção. Apresenta IP a 0,6% para terrenos para construção, 25% para prédios arrendados e 2% para transmissão de imóvel. Apresenta IVA a 14% e uma condição de 2% em Cabinda para importação de mercadorias e transmissão de bens. Para IS, a fonte oficial remete as taxas à tabela anexa, podendo ser valor absoluto ou percentagem.

Esses parâmetros foram codificados separadamente como referências não activas. A referência fiscal não escolhe automaticamente a conta de débito/crédito, não prova a vigência universal posterior e não autoriza posting.

## Conclusão operacional

A pesquisa permite preparar o formulário e os casos de teste para as seis operações. Não permite, sem uma regra documental específica por operação e sem escolha de contas lançáveis confirmadas, activar seis lançamentos universais para todas as empresas. O ERP deve apresentar os candidatos, exigir a associação das contas e condições do documento, validar a natureza e manter a activação sob aprovação humana.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial "Portal do Contribuinte — Imposto Industrial"
[3]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho "Portal do Contribuinte — IRT"
[4]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano "Portal do Contribuinte — Imposto Predial"
[5]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo "Portal do Contribuinte — Imposto do Selo"
[6]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado "Portal do Contribuinte — IVA"
[7]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial "CNNCA/MINFIN — Sector Empresarial"

## 7. Confronto literal adicional com o Decreto n.º 82/01

A leitura OCR do PDF digitalizado do Diário da República I Série n.º 52, de 16 de Novembro de 2001, confirmou movimentos operacionais concretos que podem servir de base aos rascunhos, sem substituir a revisão visual da página original:

| Operação | Regra literalmente extraída | Contas/códigos identificados no diploma | Estado no ERP |
|---|---|---|---|
| Compras | A conta 21 regista a débito por contrapartida de fornecedores; a crédito por contrapartida das existências no inventário permanente ou do custo das existências vendidas/matérias consumidas no inventário intermitente. | 21 Compras; 21.1 matérias-primas; 21.2 mercadorias; 32 fornecedores; 22–29 existências | Regra elegível para rascunho, mas não activável: a base não tem contas lançáveis confirmadas para 21/32/22–29 |
| Fornecedores | Fornecedores — facturas em recepção e conferência são regularizados para fornecedores correntes quando a factura é contabilizada definitivamente. | 32.1 fornecedores correntes; 32.8 facturas em recepção/conferência; 32.9 saldos devedores | Rascunho documental; contas lançáveis correspondentes não estão presentes na base |
| Salários | A conta 34.3 regista o imposto deduzido aos empregados no processamento e é saldada por meios monetários no pagamento ao Estado. A conta 36.1 regista a crédito, por contrapartida de custos, os valores líquidos a pagar e é saldada por meios monetários. | 34.3 IRT; 36.1 pessoal/remunerações; 36.3 adiantamentos; 45 meios monetários; 45.3.1 salários | Apenas o código 4531 está movimentável na base; faltam contas lançáveis de custo, remuneração e IRT para posting completo |
| Imobilizado | Compras de imobilizado são registadas a crédito por contrapartida das respectivas contas de imobilizado e saldadas por meios monetários no pagamento. Vendas de imobilizado são registadas a débito por contrapartida dos resultados e saldadas por meios monetários no recebimento. | 37.1 compras de imobilizado; 37.2 vendas de imobilizado; contas de imobilizado da classe 1 | Rascunho documental; contas lançáveis da classe 1/37 não estão presentes na base |
| Tesouraria | Fundo fixo é debitado por contrapartida de bancos ou valores destinados a pagamentos específicos; pagamentos são debitados nas contas de custos e creditados em bancos ou caixa de pagamentos específicos. | 45.1 fundo fixo; 45.1.1/45.1.2 caixa; 45.3.1 salários; 43 depósitos à ordem | Parcialmente suportada: 4511, 4512 e 4531 estão confirmadas e lançáveis, mas falta a conta de custos/contrapartida por evento |
| Vendas | A estrutura do diploma identifica a conta 61 Vendas e subcontas 611/612/613/614 por mercados/actividades; o lançamento concreto deve ligar cliente ou meios monetários à conta de vendas e às contas fiscais aplicáveis. | 61; 6111/6112; 6121/6122; 6131; 6141/6142 | Parcialmente suportada: existem 6111, 6112, 6121, 6122, 6131, 6141 e 6142 como lançáveis, mas não existem contas lançáveis de cliente/IVA na base |

O próprio texto do plano indica, em trecho introdutório, que as normas e notas não contêm, na generalidade dos casos, regras de movimentação para todas as contas. Consequentemente, as regras específicas acima devem ser usadas onde o diploma as descreve; para as restantes operações, o ERP deve exigir regra técnica documentada, fonte compatível, contas lançáveis e aprovação humana.

A consulta persistente confirmou que existem apenas **10 contas movimentáveis confirmadas**: 4511, 4512, 4531, 6111, 6112, 6121, 6122, 6131, 6141 e 6142. As contas 21, 31, 32, 34.5 e 61 em nível de grupo estão confirmadas, mas `acceptsEntries = 0`; por isso não podem ser usadas como contas finais num `accountingRule`. Este é o bloqueio técnico concreto que impede a criação segura de seis regras completas neste momento.

## 8. Camada IVA confirmada no Decreto Presidencial n.º 180/19

A leitura do regulamento confirmou que o diploma cria no PGCA o código `34.5 — IVA` e desdobra-o em `34.5.1 IVA suportado`, `34.5.2 IVA dedutível`, `34.5.3 IVA liquidado`, `34.5.4 IVA regularizações`, `34.5.5 IVA apuramento`, `34.5.6 IVA a pagar`, `34.5.7 IVA a recuperar`, `34.5.8 IVA reembolsos pedidos` e `34.5.9 IVA liquidações oficiosas`. O Anexo I define ainda as subcontas por existências, meios fixos/investimentos, outros bens e serviços, operações gerais, IVA de caixa, autoconsumo, operações especiais, apuramento, pagamento e recuperação.

Para o ERP, a consequência operacional é concreta: numa aquisição elegível, o IVA suportado (`34.5.1`) ou IVA dedutível (`34.5.2`) só pode ser usado depois de classificar a origem da aquisição e o direito à dedução; numa venda tributável, o IVA liquidado (`34.5.3.1`) credita-se pelo imposto da factura/documento equivalente; no apuramento, `34.5.5.1` recebe os saldos de IVA dedutível, liquidado, regularizações e recuperável, transferindo o resultado para `34.5.6.1` ou `34.5.7.1`. Os movimentos foram adicionados a `IVA_SOURCE_BACKED_MOVEMENTS` como `DRAFT_ONLY`, com fonte explícita no Decreto 180/19.

A consulta da base ainda não encontrou estas subcontas IVA como contas lançáveis confirmadas. Portanto, a camada está formalizada e testada no código, mas não pode ser usada para posting até que os códigos, hierarquia, natureza, `acceptsEntries`, vigência e mapeamento para o plano da empresa sejam confirmados.
