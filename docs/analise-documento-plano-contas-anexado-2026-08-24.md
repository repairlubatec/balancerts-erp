# BALANCERTS.ERP — Parecer de conformidade do documento anexado

**Data:** 24 de Agosto de 2026  
**Documento analisado:** `pasted_content.txt`  
**Âmbito:** Plano de Contas contabilístico angolano, regras de movimentação, IVA, versionamento, auditoria e consolidação jurídico-fiscal.

> **Nota de prudência:** este parecer é uma análise técnica de implementação e não substitui a validação de um contabilista certificado, jurista ou autoridade fiscal angolana antes de activar regras com efeitos contabilísticos ou fiscais.

## 1. Conclusão executiva

O documento contém requisitos importantes e, em grande parte, compatíveis com a arquitectura actual do BALANCERTS.ERP: não invenção de contas, preservação do histórico, hierarquia normativa, confirmação humana, versionamento, auditoria, bloqueio de lançamentos sem regra válida, separação entre BALANCERTS e SAADI e política de não automatização perante dúvida jurídica.

Contudo, **não está tudo em conformidade para importação e activação directa**. O ficheiro mistura pelo menos dois documentos: o plano de contas termina em `FIM DO DOCUMENTO` na linha 1298 e, depois de uma marca de conteúdo truncado e mensagens de correio, começa uma segunda instrução jurídico-fiscal do IVA a partir da linha 1305. Esta composição não possui uma versão documental única nem uma cadeia inequívoca de aprovação.

Além disso, foram detectadas inconsistências materiais no próprio plano, incluindo códigos hierárquicos repetidos (`18.1`, `18.2`, `18.3`, `43.1`, `43.1.1` e `43.1.2`) e designações reservadas que não podem ser convertidas automaticamente em contas movimentáveis. O schema actual exige código único por versão e não possui todos os estados literais aspiracionais do documento. Portanto, a decisão é **NÃO APROVADO para importação/activação integral**. É possível implementar apenas guardas e documentação compatíveis; não é seguro importar as 715 linhas de contas como cadastro normativo activo.

## 2. Evidência extraída do anexo

A análise integral identificou 2207 linhas físicas no ficheiro, das quais o documento principal termina na linha 1298. No plano contabilístico foram identificadas 715 linhas com aparência de código hierárquico e 87 ocorrências de `RESERVED_PGC_EXTENSION`. O documento também contém os estados `ACCOUNT_NOT_CONFIGURED`, `ACCOUNT_NOT_FOUND`, `ACCOUNT_NOT_MOVABLE`, `ACCOUNT_EXPIRED`, `RULE_NOT_FOUND`, `RULE_AMBIGUOUS`, `POST_TO_SYNTHETIC_ACCOUNT`, `INACTIVE` e `EXPIRED`.

| Evidência | Localização | Resultado técnico |
|---|---:|---|
| Hierarquia Classe → Conta → Subconta → Subconta analítica → Conta movimentável | linhas 67–89 | Compatível conceptualmente com `level`, `parentId`, `parentCode`, `accountType` e `acceptsEntries`. |
| Não invenção de códigos e contas genéricas | linhas 15–27 e 48–65 | Compatível com a política de confirmação e com os bloqueios existentes. |
| Conta IVA `34.5` e referência ao Decreto Presidencial n.º 180/19 | linhas 332–343 e 1155–1171 | Compatível como requisito de fonte; não autoriza activar subcontas sem evidência confirmada. |
| Regras de bloqueio da automatização | linhas 1071–1130 | Compatível com o motor actual em intenção, mas nem todos os códigos de erro existem como contratos uniformes. |
| Separação BALANCERTS → SAADI, somente leitura | linhas 1188–1208 | Compatível com a arquitectura SAADI aprovada. |
| IA limitada a sugestão e sujeita a aprovação | linhas 1210–1238 | Compatível com o princípio de não automatização e revisão humana. |
| Matriz jurídica antes da implementação | linhas 1829–1895, 2004–2046 e 2175–2208 | Impede a implementação jurídica integral nesta etapa, pois a matriz consolidada ainda não foi produzida e validada para este anexo. |

## 3. Compatibilidades com a arquitectura actual

O modelo actual já possui `pgcVersions`, `pgcSources`, `pgcEvidenceSubmissions`, `pgcAccounts`, `pgcMigrationMaps`, `pgcAuditRuns`, `pgcAuditFindings` e `accountingRules`. A tabela `pgcAccounts` suporta código, designação, classe, pai, nível, tipo de conta, natureza, tipo de saldo, aceitação de lançamentos, vigência, fonte e estado de validação. A restrição única por `(versionId, code)` protege contra duplicações dentro de uma versão.

O workflow actual também exige a sequência `DRAFT → UNDER_REVIEW → VALIDATED → ACTIVE`, confirma todas as contas e fontes antes da validação, verifica cobertura de regras e impede a activação de uma versão que não esteja pronta. O motor operacional procura contas confirmadas, activas, vigentes e movimentáveis, e impede a contabilização quando não encontra regra, conta ou mapeamento operacional válido.

Esta base já satisfaz a parte mais importante do documento: **o anexo não deve ser tratado como uma autorização para inserir automaticamente contas ou activar regras**. A política actual `CONFIRMED_ONLY` é mais segura do que uma importação directa do texto.

## 4. Conflitos e lacunas bloqueadoras

| Classificação | Localização no anexo | Conflito com o ERP | Risco | Decisão |
|---|---|---|---|---|
| **BLOQUEADOR** | Após a linha 1298 e novamente nas linhas 1305–2208 | O ficheiro concatena um plano de contas com uma segunda instrução de consolidação do IVA. Não há versão, autoria, escopo e estado de aprovação únicos para tratar o conteúdo como um contrato executável. | Importar uma parte do texto como norma e outra como comando pode misturar requisitos contabilísticos, fiscais e mensagens de contexto sem aprovação independente. | Separar os documentos, atribuir identificadores/versionamento e aprovar uma matriz consolidada antes de qualquer alteração estrutural. |
| **BLOQUEADOR** | Linhas 163–179 e evidência de duplicações | `18.1`, `18.2` e `18.3` são reutilizados em ramos distintos; `43.1`, `43.1.1` e `43.1.2` também aparecem repetidos. O schema impõe código único por versão. | Uma importação directa falharia a restrição única ou teria de escolher arbitrariamente qual ramo prevalece, corrompendo a hierarquia e a interpretação histórica. | Não importar. Corrigir o documento na fonte ou apresentar uma tabela de desambiguação confirmada visualmente contra o diploma oficial. |
| **ALTO** | Linhas 53–65, 114–131 e 202–265 | `RESERVED_PGC_EXTENSION` é tratado como designação textual, mas o modelo exige `name` e os estados actuais são `CONFIRMED`, `NEEDS_NORMATIVE_VALIDATION`, `INVALID`, `DUPLICATE` e `MISSING_PARENT`. | Converter a reserva em conta activa inventaria uma designação não autorizada e pode permitir lançamentos indevidos. | Manter reservas como pendências não movimentáveis, sem activar nem inventar designação; qualquer novo estado exige decisão de schema e migração separada. |
| **ALTO** | Linhas 950–1130 | O documento exige `ACCOUNT_NOT_FOUND`, `ACCOUNT_NOT_MOVABLE`, `ACCOUNT_EXPIRED`, `RULE_NOT_FOUND`, `RULE_AMBIGUOUS` e `POST_TO_SYNTHETIC_ACCOUNT`, mas o ERP usa vários erros existentes com nomes diferentes e sem um catálogo único transversal. | Integrações e UI podem interpretar estados iguais de formas diferentes, prejudicando auditoria e tratamento de pendências. | Criar primeiro uma matriz de correspondência de erros, sem alterar ainda regras activas; só depois decidir se é necessária compatibilidade de aliases. |
| **ALTO** | Linhas 1021–1069 | O anexo usa `INACTIVE` e `EXPIRED` como estados literais, enquanto o modelo usa `active` e `validTo` e não expõe esses estados como enum de conta. | Um consumidor pode confundir inactividade operacional com fim de vigência normativa. | Mapear semanticamente `active=0` e `validTo` para apresentação, preservando o modelo actual; não introduzir enums sem migração e testes de histórico. |
| **ALTO** | Linhas 1155–1171 e 1346–1433 | A conta IVA e a cadeia de diplomas são compatíveis como intenção, mas o documento não fornece artigos, vigências completas, revogações e regras executáveis para cada subconta/taxa. | Activar IVA apenas com base na menção ao Decreto 180/19 ou à Lei 14/23 pode aplicar norma incompleta ou fora da vigência. | Manter a cadeia `CONFIRMED_ONLY`; completar a matriz jurídica e a evidência primária antes de gerar regras. |
| **MÉDIO** | Linhas 156–160 e 153–160 | `14.1 — Obra em curso` e `14.2 — Obra em curso` têm a mesma designação, embora códigos distintos. | Pode ser legítimo no diploma, mas exige confirmação de contexto e não pode ser “corrigido” automaticamente por deduplicação textual. | Preservar ambos se confirmados pela fonte; exigir confirmação contextual e não deduplicar por nome. |
| **MÉDIO** | Linhas 774–801 | Existem aparentes saltos e granularidades assimétricas em `75.2`, incluindo `75.2.11` e `75.2.12`, sem regra explícita de completude de todos os níveis. | Uma validação ingénua pode classificar códigos legítimos como órfãos ou aceitar códigos sem pai. | Validar hierarquia por prefixo e fonte oficial, não por sequência numérica contínua. |
| **MÉDIO** | Linhas 1729–1775 | A cadeia documento → operação IVA → lançamento → conta → apuramento → declaração é declarada, mas não há modelo técnico completo de campos declarativos, reconciliação ou regularizações. | Não permite concluir que o motor fiscal e os modelos declarativos estão integralmente implementados. | Remeter detalhamento para a matriz IVA e para especificação própria de declarações/regularizações. |
| **BAIXO** | Linhas 1785–1797 | A classificação de actos administrativos é correcta como requisito de governança, mas não existe no anexo um catálogo completo com identificadores e vigência de cada acto. | Pode gerar fonte sem tipo ou classificação incompleta. | Tratar como requisito documental, não como importação automática. |
| **INFORMATIVO** | Linhas 1980–2003 | A regra de não apagar implementação existente está alinhada com o workflow do projecto. | Reduz risco de regressão. | Adoptar como critério de não-regressão. |

## 5. Confronto dos estados e das guardas

| Requisito do anexo | Estado/estrutura actual | Compatibilidade |
|---|---|---|
| Conta confirmada | `pgcAccounts.validationStatus = CONFIRMED` | Compatível. |
| Conta pendente de validação | `NEEDS_NORMATIVE_VALIDATION` | Compatível semanticamente. |
| Código duplicado | restrição única e estado `DUPLICATE` | Compatível, mas os duplicados do anexo devem ser resolvidos antes da importação. |
| Pai em falta | `MISSING_PARENT` e `parentId`/`parentCode` | Compatível como guarda. |
| Reserva de extensão | não existe enum dedicado; o anexo usa texto `RESERVED_PGC_EXTENSION` | Parcial; não activar. |
| Conta inactiva | `active = 0` | Parcialmente compatível. |
| Conta expirada | `validTo` | Parcialmente compatível. |
| Regra ambígua | cobertura por prioridade existe no workflow, mas o erro não está normalizado em todo o sistema | Parcial; requer matriz de erros. |
| Conta sintética movimentada | `acceptsEntries` e guardas do motor | Compatível em princípio. |
| Fonte confirmada | `pgcSources.verificationStatus = CONFIRMED` | Compatível e já exigida antes da validação/activação. |
| Histórico imutável | versões e datas de vigência | Compatível como arquitectura, mas deve continuar a ser testado antes de qualquer migração. |

## 6. O que pode ser implementado já

Pode ser implementada, sem risco jurídico relevante, uma camada de **análise e pré-validação não activadora**: importar o ficheiro apenas para uma área de revisão, calcular duplicações, detectar pais ausentes, contar reservas, validar formato de códigos, separar o plano principal das mensagens posteriores à linha 1298 e produzir pendências. Esta operação não deve escrever em `pgcAccounts`, não deve criar uma versão activa, não deve criar `accountingRules` e não deve alterar dados históricos.

Também é compatível reforçar testes que garantam que `RESERVED_PGC_EXTENSION`, códigos duplicados, contas não movimentáveis e regras sem fonte confirmada ficam bloqueados. Esta preparação deve usar `pgcEvidenceSubmissions` ou uma entidade de staging isolada se a arquitectura já a suportar; se for necessária uma tabela nova, deve existir primeiro uma especificação e uma migração aprovada.

## 7. O que não deve ser implementado com este anexo isolado

Não deve ser feita a importação directa das 715 linhas para o cadastro normativo, nem a activação automática das 87 reservas, nem a criação automática das subcontas IVA, nem a substituição de códigos existentes, nem a alteração retroactiva de contas históricas. Também não deve ser criado um catálogo fiscal executável a partir das mensagens de correio anexadas após `FIM DO DOCUMENTO`.

A exigência do próprio documento de concluir e apresentar uma matriz jurídica antes da implementação é incompatível com uma activação imediata. Nesse ponto, a condição do utilizador “se estiver tudo em conformidade” não se verifica: existem conflitos objectivos e falta de evidência normativa detalhada.

## 8. Alterações realizadas nesta análise

**Nenhum código, schema, dado, permissão, router, migração ou integração foi alterado nesta fase.** Foram apenas criados os registos de análise e de dependências no projecto. Esta decisão é necessária porque a implementação integral não cumpre ainda os critérios de unicidade, desambiguação, fonte, vigência e aprovação previstos no próprio documento.

## 9. Próximo passo recomendado

O próximo passo seguro é produzir uma **Matriz de Conformidade do Plano de Contas e IVA**, com uma linha por código e, no mínimo, `código`, `designação literal`, `pai`, `nível`, `natureza`, `movimentável`, `fonte`, `artigo/quadro`, `vigência`, `estado de confirmação`, `conflito`, `acção recomendada` e `evidência`. Os códigos duplicados devem ficar em `REQUER VALIDAÇÃO`; as reservas devem ficar em `RESERVED_PGC_EXTENSION`; e apenas os registos com fonte e hierarquia confirmadas poderão ser candidatos a uma futura importação de revisão.

### Referências internas

1. [Documento anexado: `pasted_content.txt`](/home/ubuntu/upload/pasted_content.txt)
2. [Schema normativo do ERP](../drizzle/schema.ts)
3. [Workflow PGCA de validação e activação](../server/pgc-workflow.ts)
4. [Serviço PGCA e guardas de autoria/revisão](../server/pgc.ts)
5. [Catálogo normativo PGCA/IVA](../server/normative.ts)
6. [Evidência programática da auditoria](../../attachment-conformance-evidence.txt)
