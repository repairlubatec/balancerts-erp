# Reavaliação do plano de contas fornecido

**Projecto:** BALANCERTS.ERP  
**Documento analisado:** `pasted_content_3.txt`, 1 300 linhas  
**Data:** 23 de Agosto de 2026  
**Estado:** **REAVALIAÇÃO CORRIGIDA — NÃO ACTIVAR EM MASSA NESTA FASE**

> Este parecer é uma análise técnica de conformidade para o software. A validação fiscal definitiva deve ser confirmada por contabilista certificado ou consultor fiscal angolano antes de qualquer utilização declarativa.

## 1. Correcção da análise anterior

A análise anterior classificou incorrectamente níveis de uma mesma árvore como duplicações. Essa conclusão não é válida para o modelo do PGCA. Códigos como `43`, `43.1`, `43.1.1` e `43.1.1.001` podem representar níveis sucessivos de uma cadeia Classe → Conta → Subconta → Conta analítica/movimentável → Extensão analítica.

O comparador foi corrigido para reconhecer o nível pelo número de segmentos e para aceitar relações pai-filho. Depois da correcção, o documento apresenta 723 entradas, 713 códigos distintos e apenas um pai estrutural em falta (`37.9` para `37.9.1`), não os 25 pais inicialmente reportados. O bloco `43` é uma hierarquia coerente: `43 — Depósitos à ordem` → `43.1 — Moeda nacional` → `43.1.1`/`43.1.2 — Banco`; as designações `Banco X` e `Banco Y` aparecem posteriormente em secções explicitamente identificadas como exemplos de parametrização empresarial, não como segunda definição normativa.

## 2. Estado actual do BALANCERTS.ERP

| Elemento | Estado |
|---|---:|
| Contas catalogadas | 760 |
| Confirmadas com evidência primária e revisão humana | 27 |
| Pendentes de confirmação | 733 |
| Regras de movimentação confirmadas e activas | 0 |
| Política de activação | `CONFIRMED_ONLY` |

As 733 contas pendentes não são necessariamente contas erradas. São candidatos provenientes de extracção, material auxiliar ou estrutura ainda não submetida a confirmação visual integral. Portanto, o estado `PENDING` não deve ser substituído automaticamente pelo conteúdo do ficheiro fornecido.

## 3. Resultado da reconciliação hierárquica

| Verificação | Resultado | Interpretação |
|---|---:|---|
| Entradas reconhecidas no documento | 723 | Estrutura analisável, incluindo contas e exemplos documentais. |
| Códigos distintos | 713 | A diferença corresponde a repetições exactas ou exemplos reutilizados. |
| Relações pai-filho legítimas | Presentes | `43 → 43.1 → 43.1.1 → 43.1.1.001` é compatível com a hierarquia descrita no próprio documento. |
| Pais ausentes | 1 | `37.9.1` aparece sem `37.9`; deve ser completado ou justificado antes da importação. |
| Colisões exactas com designações diferentes | 5 códigos | `18.1`, `18.2`, `18.3`, `43.1.1` e `43.1.2`; os três primeiros são colisões dentro da secção normativa da conta 18; os dois últimos são uma definição normativa e exemplos empresariais em secções diferentes. |

### 3.1 Conta 18

Na secção da conta 18, o documento repete efectivamente os códigos `18.1`, `18.2` e `18.3` com designações diferentes no mesmo ramo textual. Por exemplo, `18.1` aparece como `Imobilizações corpóreas` e como `Terrenos e recursos naturais`; `18.2` aparece como `Edifícios e outras construções` e como `Imobilizações incorpóreas`; `18.3` aparece como `Equipamento básico` e como `Investimentos financeiros em imóveis`.

Isto pode ser erro de transcrição, omissão de um nível (`18.1.1`, por exemplo), mistura de extractos ou reorganização que precisa de prova visual. Não deve ser corrigido por inferência. A própria extracção OCR do Decreto n.º 82/01 no projecto contém ruído nesta zona, e o catálogo actual mantém estes descendentes como `NEEDS_HUMAN_CONFIRMATION`.

**Classificação:** conflito localizado **ALTO** para a secção 18; não bloqueia a utilização do resto da árvore como material de reconciliação, mas bloqueia a activação automática desses códigos.

### 3.2 Conta 43

A leitura corrigida confirma que `43 → 43.1 → 43.1.1/43.1.2` é uma hierarquia válida no documento. O texto também declara que os nomes específicos dos bancos devem ser parametrizados pela empresa mantendo o código-pai normativo. O exemplo posterior `Banco X`, `Banco Y` e as extensões `43.1.1.001`/`43.1.1.002` não deve ser confundido com nova definição do plano normativo.

**Classificação:** sem conflito hierárquico; a parametrização empresarial deve continuar separada do nome normativo e sujeita a ACL, auditoria e confirmação da empresa.

## 4. IVA e fonte normativa

O documento fornecido exige correctamente um motor fiscal separado, cadastro por código fiscal, imposto, regime, taxa, base, conta contabilística, vigência, fonte e versão, e determina que alterações fiscais não reescrevam históricos. Esta parte é arquitecturalmente compatível com o BALANCERTS.ERP.

Permanece, contudo, uma questão de fonte que impede a activação automática de regras IVA: o documento menciona o Decreto Presidencial n.º 180/19 como referência, enquanto o catálogo normativo actual utiliza a Lei n.º 14/23 para o Código do IVA e para o artigo 19.º. O dossier oficial do projecto apresenta no artigo 19.º as taxas de 14%, 7%, 5% e 1%, com condições específicas para alguns regimes. Uma taxa ou ligação conta-fiscal não deve ser activada apenas a partir do nome `34.5 — IVA`.

**Classificação:** **ALTO** para regras fiscais; não é uma rejeição da estrutura da conta 34.5, mas exige uma matriz de vigência e prevalência normativa que explique a relação entre diplomas, alterações e regras actualmente aplicáveis.

## 5. Extensões e contas movimentáveis

`RESERVED_PGC_EXTENSION` pode ser mantido como marcador de estrutura reservada. Não pode ser transformado em conta movimentável, designação concreta ou regra de débito/crédito sem evidência primária e confirmação humana.

A distinção entre conta sintética e conta movimentável descrita no documento é compatível com o simulador e com o motor contabilístico existente. Uma conta com filhos movimentáveis não deve receber lançamentos apenas por estar presente na árvore; a decisão deve depender da configuração normativa confirmada.

## 6. Decisão de implementação

A correcção desta análise **não autoriza a importação cega das 713 linhas distintas nem a substituição das 733 contas pendentes**. Existem conflitos localizados na conta 18, um pai estrutural a justificar (`37.9`) e uma reconciliação de fonte IVA ainda necessária.

Não foram alterados dados normativos, estados, contas, regras de movimentação, schema, permissões, routers, interfaces ou históricos. Não foi criado qualquer lançamento. As 27 contas já confirmadas e as 733 pendentes permanecem exactamente sob a política `CONFIRMED_ONLY`.

O que pode ser aproveitado sem conflito é o **modelo de árvore e os exemplos hierárquicos**, especialmente `43 → 43.1 → 43.1.1 → 43.1.1.001`, desde que os exemplos empresariais não sejam gravados como designações normativas. A conta 18 e o IVA devem permanecer na fila de reconciliação e confirmação humana.

## 7. Acções necessárias antes da implementação

O documento deve ser normalizado por contexto: conta normativa, exemplo de parametrização empresarial e extensão analítica devem ser tipos distintos. A secção 18 deve ser confrontada página a página com a fonte primária para determinar se os códigos incompletos são erros de transcrição ou níveis efectivamente previstos. O código `37.9` deve ser localizado ou justificado. Para IVA, deve ser criada uma matriz de regra, taxa, regime, artigo, vigência, fonte e prioridade entre diplomas.

Depois da correcção, os itens podem entrar na fila de revisão humana. Só contas com código, designação, nível, pai, página, fonte, hash e evidência visual inequívocos poderão ser promovidas a `CONFIRMED`; regras de movimentação continuam a exigir prova integral de débitos, créditos e contrapartidas.

## Parecer final

**APROVADO COM RESSALVAS para reconciliação estrutural e preparação em rascunho. NÃO APROVADO para activação normativa ou fiscal em massa.**

A observação do utilizador está correcta: `43`, `43.1`, `43.1.1` e extensões filhas não são, por si só, duplicações. A análise anterior foi corrigida. Permanecem apenas os conflitos localizados da secção 18, a justificação de `37.9` e a necessidade de reconciliar a autoridade/vigência das regras de IVA com a Lei n.º 14/23 antes de qualquer activação.
