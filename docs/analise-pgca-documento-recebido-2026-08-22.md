# Análise formal do documento PGCA recebido

**Estado:** análise documental; não é autorização de implementação  
**Fonte analisada:** `pasted_content_2.txt`  
**Data:** 22 de Agosto de 2026  
**Resultado:** **APROVADO COMO MATERIAL DE ANÁLISE, NÃO APROVADO COMO FONTE PRIMÁRIA AUTÓNOMA**

## 1. Síntese executiva

O documento recebido é útil como **dossier de estruturação contabilística**. Reúne listas de classes, códigos, designações, exemplos de hierarquia e recomendações para o motor contabilístico do BALANCERTS.ERP. A sua parte mais valiosa é a advertência de que não se deve classificar automaticamente uma conta apenas pelo primeiro dígito: contas de terceiros podem representar activo ou passivo conforme a subconta e o saldo, e contas retificadoras devem reduzir a rubrica correspondente.

Todavia, o documento mistura três camadas que devem ser separadas antes de qualquer implementação: transcrição do PGCA, interpretação contabilística e desenho recomendado para o ERP. Não contém, por si só, páginas verificáveis, hash da fonte primária nem prova de que cada designação e cada movimento foram conferidos directamente no Decreto n.º 82/01. Por isso, não pode promover contas ou movimentos ao estado `CONFIRMED` apenas por ter sido recebido.

A confirmação formal vigente permanece a anteriormente registada: **27 contas visualmente legíveis e conferidas**; **zero regras de movimento confirmadas**. O documento pode orientar a próxima revisão, mas não substitui a evidência primária nem o manifesto confirmado.

## 2. Separação das camadas do documento

| Camada | Exemplos no documento | Tratamento correcto |
|---|---|---|
| Estrutura/código/designação | Classes 1–5; 11–19; 21–29; 31–39; 41–49; 51–58 | Confirmar apenas contra página primária legível e manifesto de evidência |
| Interpretação contabilística | 18, 19, 29, 38 e 49 como contas retificadoras; 32.9 e 34.5.7 como activos conforme o caso | Requer validação normativa e/ou contabilística; não é automaticamente literal |
| Movimento contabilístico | débito/crédito, constituição de provisões, pagamentos, recebimentos, reclassificações | Não confirmar sem diagrama primário legível, código, contrapartidas e sentido completos |
| Recomendação de ERP | natureza + comportamento do saldo + apresentação no balanço | Pode ser requisito de domínio futuro, não dado PGCA confirmado |

## 3. Confronto com a confirmação PGCA já existente

O manifesto visual actual confirma somente os códigos e designações do lote das Classes 1, 4 e 6, incluindo 1, 11, 12, 13, 14, 18, 19, 4, 45, 451, 4511, 4512, 453, 4531, 6, 61 e subcontas de 61. O documento recebido apresenta muitos códigos adicionais das Classes 2, 3 e 5, mas estes não passam automaticamente a confirmados.

A conferência persistente actual contém 27 registos `pgcAccounts` em `CONFIRMED` para a organização 1 e versão 1. Não contém `accountingRules` de movimento para essa versão. Esta situação é coerente com o dossier de revisão: os esquemas da obra auxiliar são legíveis em vários pontos, mas não foi encontrada correspondência primária integral equivalente para débito, crédito e contrapartidas.

Há também divergências que exigem cautela. O documento recebido usa, por exemplo, “32 — Fornecedores/saldo dever”, enquanto a nomenclatura de trabalho anterior usa “32 — Fornecedores” e separa posteriormente os saldos devedores. Uma expressão como “saldo dever” não deve ser gravada como designação oficial sem confirmação literal. Do mesmo modo, as classificações “Ativo”, “Passivo”, “Retificadora do ativo” e “Capital próprio” são úteis como hipóteses de apresentação, mas devem ser distinguidas da designação oficial do plano.

## 4. Avaliação por classe

### Classe 1 — Meios fixos e investimentos

As contas 11, 12, 13, 14, 18 e 19 estão incluídas no lote formalmente confirmado quanto a código, designação e hierarquia. O documento acrescenta interpretações correctas como a natureza retificadora de 18 e 19, mas essas interpretações não devem ser confundidas com uma regra automática de movimento. Os movimentos de aquisição, transferência, venda, amortização e provisão continuam não confirmados operacionalmente porque a fonte primária revista não fornece, de modo equivalente, todos os diagramas auxiliares necessários.

**Estado:** estrutura do lote confirmada; classificações derivadas e movimentos permanecem fora da activação.

### Classe 2 — Existências

A lista 21–29 é plausível como estrutura de análise e está alinhada com o dossier auxiliar, que identifica contas 25, 26, 28 e 29. Contudo, no estado actual não existe confirmação formal primária deste grupo no manifesto de 27 contas. A afirmação de que 29 é retificadora e as descrições de provisão, custo e valor realizável líquido são relevantes para o futuro motor, mas precisam de evidência normativa e de uma regra de domínio aprovada.

**Estado:** pendente de confirmação visual primária; nenhum movimento elegível para activação.

### Classe 3 — Terceiros

O documento identifica correctamente o risco de classificar toda a Classe 3 como passivo. Os exemplos 32.9 — saldos devedores, 34.5.7 — IVA a recuperar, 36.3 — adiantamentos e 37.3 — proveitos a facturar mostram por que a apresentação depende de subconta, sinal e natureza da operação.

Apesar disso, estas relações são apresentadas parcialmente como síntese e parcialmente como interpretação. Não devem ser codificadas como `normal_balance` ou como mapping de balanço sem confirmar cada subconta, vigência e regra. A conta 34 é especialmente sensível: a classificação fiscal do IVA deve permanecer articulada com a fonte fiscal própria e não ser inferida apenas da descrição deste documento.

**Estado:** conceptualmente relevante; contas, atributos e movimentos pendentes de confirmação primária.

### Classe 4 — Meios monetários

O documento apresenta 41, 42, 43, 44, 45, 48 e 49 e subcontas de títulos, depósitos e caixa. O dossier auxiliar também regista esquemas legíveis para depósitos, caixa e provisões para aplicações de tesouraria. Contudo, a confirmação formal existente para a Classe 4 é limitada ao lote previamente conferido, e os movimentos auxiliares não foram elevados a regras confirmadas.

A expressão “46 — —” e “47 — —” deve ser tratada como ausência de designação, não como contas que possam ser criadas automaticamente. A conta 48 “Conta transitória” requer confirmação literal e definição de uso; não deve receber uma natureza patrimonial genérica.

**Estado:** parte da estrutura anterior confirmada; novos códigos e movimentos permanecem pendentes salvo evidência primária individual.

### Classe 5 — Capital e reservas

A separação entre capital próprio e passivo é coerente com o modelo conceptual aprovado. A identificação de 51–58 como capital, acções/quotas próprias, prémios, prestações suplementares e reservas é materialmente útil. Ainda assim, o documento recebido não demonstra páginas primárias nem hash por item. A estrutura não deve ser importada como confirmada apenas pela lista.

As afirmações sobre movimentos de capital, reservas e resultados são regras contabilísticas, não simples nomes. Como o dossier indica que vários esquemas das páginas auxiliares 238–244 ainda carecem de confirmação primária equivalente, esses movimentos devem continuar bloqueados.

**Estado:** candidata a revisão; não confirmada por este documento.

## 5. Problemas documentais identificados

| ID | Classificação | Problema | Risco | Tratamento recomendado |
|---|---|---|---|---|
| D-01 | Alto | O documento não identifica páginas primárias e hash por cada conta | Não é possível reconstruir a evidência | Usar como índice de revisão, nunca como fonte de confirmação |
| D-02 | Alto | Mistura designação oficial com classificação e recomendação de ERP | Pode gravar interpretação como texto legal | Separar campos `officialName`, `natureHypothesis`, `presentationRule` e `implementationNote` |
| D-03 | Alto | Apresenta movimentos sem demonstração de diagramas primários | Risco de posting não conforme | Manter zero movimentos confirmados até conferência tripla |
| D-04 | Alto | Alguns nomes parecem resumos ou variantes, como “Fornecedores/saldo dever” | Divergência literal no plano de contas | Confirmar grafia no Decreto antes de persistir |
| D-05 | Médio | Natureza dependente de saldo é descrita conceptualmente, mas não há algoritmo determinístico | Relatórios podem classificar saldos de forma inconsistente | Definir motor de comportamento e apresentação em especificação própria |
| D-06 | Médio | A conta 34 mistura estrutura PGCA e tratamento fiscal do IVA | Pode conflitar com a fonte fiscal vigente | Cruzar com o catálogo fiscal confirmado e com a vigência aplicável |
| D-07 | Médio | Não define vigência, estado, fonte, operador ou auditoria por item | Perde rastreabilidade | Associar cada confirmação a fonte, página, hash, versão, actor e decisão |
| D-08 | Baixo | A árvore final é uma proposta de implementação, não uma transcrição do diploma | Pode ser interpretada como estrutura oficial | Rotular explicitamente como modelo proposto |

## 6. O que pode ser aproveitado sem risco

Pode ser aproveitada a regra de desenho segundo a qual a natureza patrimonial não deve ser determinada somente pelo primeiro dígito. Pode também ser aproveitada como requisito de domínio a separação entre conta oficial PGCA, comportamento do saldo, classificação para demonstrações e apresentação no balanço.

Pode ainda ser usado como índice de páginas e contas para a próxima revisão visual. Cada item deverá ser transformado numa ficha de evidência com código, designação literal, classe, pai, nível, página primária, imagem legível, hash, estado de confirmação e observação sobre movimentos.

## 7. O que não pode ser implementado com base apenas neste documento

Não deve ser criada uma migração massiva das Classes 2, 3, 4 ou 5; não devem ser promovidas novas contas a `CONFIRMED`; não devem ser criadas regras de débito/crédito; não devem ser activados mappings de Balanço ou Demonstração de Resultados; e não deve ser alterada a designação oficial de contas existentes.

Também não deve ser implementada uma classificação automática “saldo devedor = activo / saldo credor = passivo” sem tratar saldos anormais, contas retificadoras, subcontas fiscais, vigência, moeda, parceiro e contexto da operação. Essa lógica exige especificação técnica própria, casos de teste e aprovação contabilística.

## 8. Conclusão formal

O documento recebido é **aceite como material auxiliar de análise e preparação**, mas **não é aceite como fonte primária autónoma nem como autorização de implementação**. A confirmação formal permanece limitada às 27 contas já conferidas visualmente. Os movimentos confirmados permanecem em **zero**.

A recomendação é usar este documento para orientar uma nova fila de conferência visual, começando pelas contas que o texto apresenta como dependentes do saldo e pelas subcontas de terceiros e IVA. Só depois de cada item reunir evidência primária legível, designação literal, hierarquia e, quando aplicável, movimento primário completo, poderá ser considerada a sua promoção formal e eventual ligação ao motor contabilístico.

## Referências

[1]: file:///home/ubuntu/upload/pasted_content_2.txt "Documento PGCA recebido para análise"
[2]: file:///home/ubuntu/balancerts-erp/docs/pgca-formal-confirmation-2026-08-22.md "Confirmação formal restrita vigente"
[3]: file:///home/ubuntu/balancerts-erp/docs/pgca-movement-rules-review.md "Dossier de revisão visual das regras de movimento"
[4]: file:///home/ubuntu/balancerts-erp/docs/normative-sources/pgca-visually-confirmed-accounts.json "Manifesto das contas visualmente confirmadas"
[5]: file:///home/ubuntu/balancerts-erp/server/pgc.ts "Implementação das validações de confirmação PGCA"
