# Confirmação formal restrita — PGCA

**Data:** 22 de Agosto de 2026  
**Organização:** 1  
**Versão PGCA:** 1  
**Fonte primária:** Decreto n.º 82/01, de 16 de Novembro  
**SHA-256 da fonte:** `04359cb12d48a20cc5326ca001cd0597b1904a7d99d376b1820e8be40f332c89`

## 1. Âmbito da confirmação

Foi confirmada formalmente apenas a informação que foi visualmente legível e efectivamente conferida no quadro oficial do Decreto n.º 82/01, nomeadamente código, designação e posição hierárquica. A confirmação não autoriza inferir natureza, saldo normal, conta lançável ou regra de movimento quando esses elementos não estão demonstrados pela fonte primária.

O lote confirmado contém **27 contas**, correspondente integralmente ao manifesto visual existente em `docs/normative-sources/pgca-visually-confirmed-accounts.json`. As páginas visuais primárias revistas abrangem as páginas 40 a 58 do diploma, com confirmação efectiva do lote nas páginas 41, 42, 48, 49 e 50.

## 2. Contas formalmente confirmadas

| Código | Designação registada no manifesto conferido | Hierarquia | Página primária |
|---|---|---|---:|
| 1 | Meios fixos e investimentos | Classe | 41 |
| 11 | Imobilizações corpóreas | 1 | 41 |
| 12 | Imobilizações incorpóreas | 1 | 41 |
| 13 | Investimentos financeiros | 1 | 42 |
| 14 | Imobilizações em curso | 1 | 42 |
| 18 | Amortizações acumuladas | 1 | 42 |
| 19 | Provisões para investimentos financeiros | 1 | 42 |
| 4 | Meios monetários | Classe | 48 |
| 45 | Caixa | 4 | 49 |
| 451 | Fundo fixo | 45 | 49 |
| 4511 | Caixa | 451 | 49 |
| 4512 | Caixa | 451 | 49 |
| 453 | Valores destinados a pagamentos específicos | 45 | 49 |
| 4531 | Salários | 453 | 49 |
| 6 | Proveitos e ganhos por natureza | Classe | 50 |
| 61 | Vendas | 6 | 50 |
| 611 | Produtos acabados e intermédios | 61 | 50 |
| 6111 | Mercado nacional | 611 | 50 |
| 6112 | Mercado estrangeiro | 611 | 50 |
| 612 | Sub-produtos, desperdícios, resíduos e refugos | 61 | 50 |
| 6121 | Mercado nacional | 612 | 50 |
| 6122 | Mercado estrangeiro | 612 | 50 |
| 613 | Mercadorias | 61 | 50 |
| 6131 | Mercado nacional | 613 | 50 |
| 614 | Embalagens de consumo | 61 | 50 |
| 6141 | Mercado nacional | 614 | 50 |
| 6142 | Mercado estrangeiro | 614 | 50 |

Estas designações são transcritas do manifesto de confirmação actualmente utilizado pelo projecto. Qualquer divergência futura entre o manifesto, o cadastro persistente e a imagem primária deve bloquear a confirmação e ser tratada como conflito documental; não deve ser corrigida por aproximação.

## 3. Movimentos contabilísticos

**Resultado formal: zero movimentos confirmados e zero regras de movimento activadas nesta operação.**

Foram visualmente legíveis diversos esquemas na obra auxiliar `PGCA Explicado`, incluindo esquemas relativos a imobilizado, tesouraria, terceiros, provisões, capital próprio e resultados. Contudo, a conferência contra as páginas primárias do Decreto n.º 82/01 confirmou código, designação e hierarquia em determinados grupos, mas não encontrou, na fonte primária revista, correspondência integral equivalente para débito, crédito e contrapartidas.

Por isso, os movimentos auxiliares permanecem em `NEEDS_REVIEW`/pendentes de confirmação primária. Não foram promovidos a `CONFIRMED`, não foram criadas `AccountingRules` com base neles e não foram activados postings automáticos derivados desses esquemas.

A regra de aceitação permanece:

> Um movimento só pode ser confirmado quando código, designação, débito, crédito, contrapartidas, página, fonte e hash forem legíveis e coincidentes na evidência autorizada, com validação humana auditada.

## 4. Estado persistente verificado

A consulta controlada à base de dados confirmou **27 registos `pgcAccounts`** para organização 1 e versão 1, todos com `validationStatus = CONFIRMED`, correspondendo ao lote visual. A mesma consulta confirmou **zero registos `accountingRules`** para organização 1 e versão 1. A política do catálogo permanece `CONFIRMED_ONLY`.

A confirmação formal não altera contas empresariais legadas, não reescreve lançamentos, não modifica o Ledger, não publica a versão PGCA e não activa regras de movimento.

## 5. Auditoria e critérios de exclusão

Cada conta confirmada deve manter a sua fonte, página, hash, versão, organização e operador no registo auditável. Itens ilegíveis, parcialmente legíveis, com OCR ambíguo, com designação divergente, com hierarquia incerta ou suportados apenas pela obra auxiliar ficam excluídos da confirmação formal.

A ausência de confirmação de movimentos não é uma falha de processamento: é um bloqueio deliberado de conformidade. O sistema deve devolver `PGCA_DATA_REQUIRED` quando uma operação depender de informação normativa não confirmada, em vez de escolher uma conta semelhante ou inferir a regra pelo primeiro dígito.

## 6. Conclusão

O lote formalmente confirmado nesta data é de **27 contas PGCA**. O lote de movimentos formalmente confirmado é de **0 regras**. Esta decisão está alinhada com a política de confirmação humana, com a separação entre cadastro normativo e plano empresarial e com o princípio de não-invenção do BALANCERTS.ERP.

### Referências

[1]: file:///home/ubuntu/balancerts-erp/docs/normative-sources/pgca-visually-confirmed-accounts.json "Manifesto de contas visualmente confirmadas"
[2]: file:///home/ubuntu/balancerts-erp/docs/normative-catalog-complete-review.json "Catálogo normativo integral"
[3]: file:///home/ubuntu/balancerts-erp/docs/pgca-movement-rules-review.md "Dossier de revisão visual das regras de movimento"
[4]: file:///home/ubuntu/balancerts-erp/docs/normative-sources/decreto-82-01-pgca.pdf "Decreto n.º 82/01 — fonte primária"
