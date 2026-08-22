# Avaliação do plano de contas fornecido

**Projecto:** BALANCERTS.ERP  
**Documento analisado:** `pasted_content_3.txt`, 1 300 linhas  
**Data da avaliação:** 23 de Agosto de 2026  
**Resultado:** **NÃO APROVADO PARA IMPORTAÇÃO OU ACTIVAÇÃO AUTOMÁTICA**

> Este parecer é uma análise técnica de conformidade para o software. A validação fiscal definitiva deve ser confirmada por contabilista certificado ou consultor fiscal angolano antes de qualquer utilização declarativa.

## 1. Conclusão executiva

O documento pode ser utilizado como **proposta de reconciliação e material de trabalho**, mas não pode substituir directamente o catálogo normativo actual. Foram encontrados conflitos impeditivos: códigos repetidos com designações diferentes, diferenças de representação que não são resolvidas apenas pela remoção dos pontos, correspondências incompatíveis com o catálogo actual e uma divergência de autoridade normativa para o IVA.

Por esse motivo, **não foram alteradas contas, designações, estados de confirmação, regras de movimentação, dados de empresas, schema ou permissões**. Também não foram activadas as 733 contas pendentes. Esta decisão preserva a política `CONFIRMED_ONLY` e evita contaminar o histórico contabilístico.

## 2. Estado actual confrontado

| Elemento | Estado no BALANCERTS.ERP |
|---|---:|
| Contas no catálogo normativo | 760 |
| Contas confirmadas por evidência primária e revisão humana | 27 |
| Contas pendentes de confirmação | 733 |
| Regras de movimentação contabilística activas | 0 |
| Política de activação | `CONFIRMED_ONLY` |

A comparação foi feita contra `docs/normative-catalog-complete-review.json`, que identifica o Decreto n.º 82/01 como fonte PGCA e a Lei n.º 14/23 como fonte fiscal de IVA no catálogo actual.

## 3. Bloqueadores encontrados

| Classificação | Localização no documento fornecido | Constatação | Risco | Decisão |
|---|---|---|---|---|
| **BLOQUEADOR** | Linhas 512, 984 e 1 001 | O código `43.1.1` aparece três vezes: `Banco`, `Banco X` e `Banco X`. | Não existe chave normativa única; uma importação pode substituir ou duplicar contas e afectar lançamentos. | Não importar. |
| **BLOQUEADOR** | Linhas 509–513 e 978–986 | `43`, `43.1` e `43.1.2` reaparecem em blocos diferentes, com `Banco`, `Banco X` e `Banco Y`. | A hierarquia e a finalidade da conta ficam ambíguas. | Não importar. |
| **BLOQUEADOR** | Linhas 163–177 | `18.1`, `18.2` e `18.3` são reutilizados para níveis hierárquicos diferentes: por exemplo, `18.1` é apresentado como `Imobilizações corpóreas` e também como `Terrenos e recursos naturais`. | O mesmo código não pode representar simultaneamente conta-pai e conta de outra natureza. | Não importar. |
| **BLOQUEADOR** | Secções de IVA, linhas 6, 34 e 343 | O documento trata o Decreto Presidencial n.º 180/19 como base específica do IVA, enquanto o catálogo actual está associado à Lei n.º 14/23, que alterou o Código do IVA e inclui o artigo 19.º vigente no dossier do projecto. | Activar estrutura ou taxas com fonte desactualizada pode produzir parametrização fiscal incorrecta. | Não activar IVA; exige versão normativa reconciliada. |

## 4. Problemas altos

### 4.1 Representação dos códigos

O documento usa códigos com pontos, como `11.1.1`, enquanto o catálogo actual contém códigos compactos, como `111`. A remoção dos pontos pode ser usada apenas como técnica preliminar de comparação, nunca como prova de equivalência. Depois da normalização, o documento possui 706 códigos distintos e o catálogo possui 670 códigos distintos; a diferença não é uma simples conversão de formato.

Foram também encontradas designações incompatíveis após normalização. Exemplos incluem `11.1 → 111`, `11.2 → 112`, `11.3 → 113`, `12.1 → 121`, `19.1 → 191`, `21.1 → 211` e `31.2 → 312`. Em vários casos, o catálogo actual contém texto OCR contaminado, pelo que a correspondência textual automática não é autoridade suficiente.

**Decisão:** não substituir designações nem promover contas por correspondência de código normalizado.

### 4.2 Extensões reservadas

O marcador `RESERVED_PGC_EXTENSION` é compatível com o princípio de não invenção somente enquanto estado **não movimentável**, pendente de parametrização autorizada e de evidência adequada. Não pode ser convertido em designação concreta, regra de débito/crédito ou conta operacional apenas porque aparece no documento.

**Decisão:** preservar como extensão reservada e não activar.

### 4.3 IVA não é apenas um subplano contabilístico

O documento exige, nas linhas 1 155–1 171, um cadastro fiscal com código fiscal, imposto, regime, taxa, base, conta contabilística, vigência, fonte e versão. Essa exigência é coerente com a separação entre motor fiscal e motor contabilístico, mas o próprio documento não fornece uma tabela completa e validada que ligue cada operação, regime e taxa a contas de IVA vigentes.

O OCR do dossier oficial do projecto identifica a Lei n.º 14/23, de 28 de Dezembro, como lei de alteração ao Código do IVA e reproduz no artigo 19.º as taxas de 14%, 7%, 5% e 1%, com condições específicas para algumas taxas. Assim, a simples presença de `34.5 — IVA` não autoriza a criação de subcontas, taxas ou regras automáticas.

**Decisão:** manter a estrutura IVA em revisão humana; não activar taxas ou movimentos com base exclusiva no documento fornecido.

## 5. O que é compatível e pode ser aproveitado

A política de não invenção, a criação de pendência `ACCOUNT_NOT_CONFIGURED`, o estado `RESERVED_PGC_EXTENSION`, a proibição de contas genéricas artificiais, a preservação de lançamentos históricos, a versionação normativa, a vigência, a proveniência e a exigência de auditoria estão alinhadas com a arquitectura actual do BALANCERTS.ERP.

Também é compatível a regra de que os módulos operacionais enviam a operação ao Motor Contabilístico e não escrevem directamente nas tabelas contabilísticas. Contudo, essa compatibilidade arquitectural não valida automaticamente os códigos e designações do anexo.

## 6. O que não foi implementado

Não foram importadas nem activadas as 733 contas pendentes. Não foram alterados o catálogo actual, as 27 confirmações existentes, as contas de IVA, as regras de movimentação, o schema, a base de dados, as permissões, os routers, as interfaces ou os lançamentos históricos. Não foi criado qualquer lançamento arbitrário ou conta genérica para contornar as divergências.

## 7. Próxima correcção necessária

Antes de uma nova importação, o documento deve ser corrigido para conter uma linha única por código, o formato canónico de código definido pelo catálogo, a designação literal confirmada na fonte primária, o código-pai inequívoco, o estado de movimentabilidade, as páginas da fonte, o hash da fonte, a versão normativa, a vigência e, para IVA, o regime, a taxa, a base, a conta associada e o artigo legal aplicável.

Depois disso, cada lote deverá passar pela fila de revisão humana. Apenas contas confirmadas visualmente e sem conflitos poderão ser promovidas a `CONFIRMED`; as regras de movimentação permanecerão bloqueadas até existir prova primária integral de natureza, débitos, créditos e contrapartidas.

## Parecer final

**NÃO APROVADO para importação directa, substituição do catálogo ou activação de contas e regras.** O documento é aproveitável como proposta de reconciliação, mas contém conflitos de códigos e designações e uma divergência de referência normativa do IVA. A implementação segura, neste momento, consiste em preservar o estado actual e encaminhar os itens para correcção documental e confirmação humana.
