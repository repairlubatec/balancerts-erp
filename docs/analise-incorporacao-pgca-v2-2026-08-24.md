# BALANCERTS.ERP — Análise de incorporação da nova versão PGCA

**Data:** 24 de Agosto de 2026  
**Fonte analisada:** `pasted_content_2.txt`  
**Âmbito:** Plano de contas das classes 1 a 8, hierarquia, contas IVA e contas reservadas para utilização interna.

## Parecer executivo

A nova versão é **estruturalmente mais adequada** para servir de base ao módulo Contabilidade do BALANCERTS.ERP do que o documento anterior. É um plano único de 855 linhas, contém as classes 1–8 e apresenta uma hierarquia contabilística coerente em grande parte do conteúdo. Não contém o bloco de instruções concatenado que existia na versão anterior, e a maior parte das linhas respeita o formato `código — designação`.

Ainda assim, **não está pronta para importação normativa directa nem para activação automática**. O preflight identificou 714 registos de conta, 5 códigos repetidos e 86 linhas `RESERVED_PGC_EXTENSION`. As repetições estão concentradas nos códigos `18.1`, `18.2`, `18.3`, `34.5` e `34.6`. O documento não fornece, para as reservas, designações literais confirmadas, natureza, conta movimentável, fonte/artigo e regra de movimentação. Portanto, a incorporação segura deve ser feita em **staging de revisão**, preservando cada linha, assinalando conflitos e mantendo todas as contas como não activadas.

## Confronto com a arquitectura existente

O BALANCERTS.ERP já possui o modelo adequado para esta fase: versões PGCA, fontes, evidências, contas, mapas de migração, auditoria e regras contabilísticas. A activação existente exige contas e fontes confirmadas, vigência compatível, hierarquia válida e cobertura de regras. O módulo operacional também impede lançamentos em contas sintéticas ou não movimentáveis.

A nova versão pode ser incorporada como matriz de revisão porque cada conta pode ser representada com `code`, `name`, `parentCode`, `level`, `accountType`, `acceptsEntries`, `validationStatus`, fonte e vigência. Contudo, a fonte deste anexo deve começar como `REQUIRES_PRIMARY_SOURCE_CONFIRMATION`, e não como `CONFIRMED`. A incorporação em staging não escreve contas activas, não cria regras de lançamento e não altera o histórico.

| Dimensão | Resultado da análise | Decisão |
|---|---|---|
| Estrutura | Classes 1–8 identificadas nas linhas 1, 109, 176, 392, 464, 489, 614 e 804. | Compatível como estrutura de revisão. |
| Registos contabilísticos | 714 linhas com código e designação. | Preparar em staging, não activar. |
| Duplicações | `18.1`, `18.2`, `18.3`, `34.5` e `34.6`. | Bloquear importação normativa até desambiguação. |
| Reservas | 86 `RESERVED_PGC_EXTENSION`. | Manter pendentes e não movimentáveis. |
| Conteúdo concatenado | Não detectado; não existe `FIM DO DOCUMENTO` nem texto posterior relevante. | Melhoria face à versão anterior. |
| IVA | `34.5 — IVA` e referência ao Decreto Presidencial n.º 180/19. | Exige fonte primária, subcontas e vigência confirmadas antes de activar. |
| Hierarquia | A maior parte dos pais imediatos está representada; a validação deve usar prefixo, não sequência numérica. | Validar individualmente. |
| Contas genéricas proibidas | Não foram detectados `999` ou `9999` nesta versão. | A guarda permanece activa. |

## Conflitos materiais

### 1. Duplicações na classe 18 — BLOQUEADOR de importação directa

O documento apresenta `18.1` para “Imobilizações corpóreas” e novamente para “Terrenos e recursos naturais”; `18.2` aparece para “Edifícios e outras construções” e “Imobilizações incorpóreas”; e `18.3` aparece para “Equipamento básico” e “Investimentos financeiros em imóveis”. Os registos ocorrem nas linhas 73–87.

Esta situação pode representar um erro de transcrição ou uma hierarquia incompleta da fonte original. Não cabe ao software escolher uma das designações, alterar códigos ou inventar subcontas. Como o schema aplica unicidade por versão e código, estes cinco registos não podem ser importados como contas normativas activas.

**Tratamento implementado:** a matriz mantém as linhas separadas, marca o código como duplicado e atribui `REQUIRES_HUMAN_VALIDATION`.

### 2. Duplicações na classe 34 — ALTO para o IVA

O código `34.5` surge como linha de estrutura da conta Estado e novamente como linha específica de IVA. O código `34.6` surge como estrutura de “Certificado de Crédito Fiscal a Compensar” e novamente como linha reservada. Estas repetições ocorrem nas linhas 244–256.

A referência ao Decreto Presidencial n.º 180/19 é relevante, mas a simples presença do código `34.5` não determina as subcontas, a natureza, o sentido do saldo, as taxas, as operações ou o período de vigência. A política `CONFIRMED_ONLY` deve permanecer activa.

**Tratamento implementado:** `34.5` e `34.6` permanecem pendentes, com fonte por confirmar e sem regras IVA activas.

### 3. Reservas sem designação — ALTO para activação

As 86 linhas `RESERVED_PGC_EXTENSION` são pontos de extensão reservados. Não são contas confirmadas e não devem ser convertidas em “Diversos”, “Outros” ou qualquer outra designação inventada. Devem ser visíveis ao contabilista como pendências e não devem aceitar lançamentos.

**Tratamento implementado:** todas as reservas ficam em staging, sem activação, sem regra de movimentação e sem transformação automática da designação.

### 4. Regras de movimentação não fornecidas — ALTO para o motor

A nova versão apresenta a nomenclatura e a hierarquia, mas não inclui para cada conta a regra completa de débito/crédito, natureza do saldo, encerramento, regularização, conta de contrapartida e condições de movimentação. O motor contabilístico não pode inferir essas regras apenas do código ou da designação.

**Decisão:** incorporar a estrutura para revisão; gerar regras somente depois da confirmação da fonte primária e da especificação de movimentos correspondente.

## O que foi incorporado de forma segura

Foi gerada uma matriz de conformidade da nova versão com 714 linhas. Cada linha conserva o código e a designação fornecidos e inclui o pai imediato, nível hierárquico, linha de origem, indicação de reserva, duplicação, pai ausente, estado de validação, estado da fonte e decisão de implementação. Todas as linhas começam como `STAGING_ONLY_NOT_ACTIVATED`; nenhuma conta foi inserida como activa e nenhuma regra foi criada.

Também foi usado o preflight não destrutivo existente, que não acede à base de dados e não executa migrações. O preflight confirma `safeForNormativeImport=false` e `safeForActivation=false` para esta versão, exclusivamente porque existem duplicações e porque a confirmação da fonte e a validação humana continuam obrigatórias.

## Estado de conformidade

| Estado | Quantidade/resultado |
|---|---:|
| Linhas do ficheiro | 855 |
| Registos de conta reconhecidos | 714 |
| Códigos duplicados | 5 códigos |
| Linhas reservadas | 86 |
| Documento concatenado | Não detectado |
| Importação normativa directa | Não autorizada |
| Activação contabilística | Não autorizada |
| Matriz de staging | Gerada |
| Alteração de schema/dados activos | Não realizada |

## Decisão final

A nova versão **pode ser incorporada no BALANCERTS.ERP como catálogo de revisão/staging**, para facilitar o trabalho do contabilista e permitir confirmação humana organizada. Não pode, nesta fase, ser activada como plano normativo definitivo porque contém duplicações objectivas, reservas sem designação confirmada e não traz regras completas de movimentação por conta.

A incorporação definitiva exige uma versão corrigida ou evidência primária que desambigue `18.1`, `18.2`, `18.3`, `34.5` e `34.6`; confirmação literal das 86 reservas; identificação da fonte e vigência; e validação das regras de movimentação e IVA. Até lá, o comportamento correcto do software é mostrar as pendências e bloquear lançamentos incompatíveis.

## Artefactos gerados

- `docs/pgca-v2-preflight-2026-08-24.json`
- `docs/matriz-conformidade-pgca-v2-2026-08-24.csv`
- `scripts/pgc-document-preflight.mjs`
- `scripts/pgc-document-matrix.mjs`

## Referências internas

1. Documento anexado: `pasted_content_2.txt`.
2. Schema normativo: `drizzle/schema.ts`.
3. Workflow de confirmação e activação: `server/pgc-workflow.ts`.
4. Serviços PGCA e guardas de evidência: `server/pgc.ts`.
5. Catálogo temporal PGCA/IVA: `server/normative.ts`.
