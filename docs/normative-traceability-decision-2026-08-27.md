# Decisão de rastreabilidade normativa — BALANCERTS.ERP

**Data:** 27 de Agosto de 2026  
**Âmbito:** PGCA, IVA, II, IRT, IP, IS, CEC e requisitos fiscais/documentais

## Decisão

O catálogo versionado em `server/normative.ts` é a **referência imutável de produto** para identificação, escopo, cadeia temporal e URL pública dos diplomas conhecidos pelo ERP. O catálogo não é, por si só, prova de aprovação humana nem autorização de cálculo, posting, emissão oficial ou submissão.

A tabela persistente `normativeSources` é o **registo de evidência de execução** por organização. Deve guardar, quando uma fonte é utilizada numa configuração ou activação, o código do catálogo, título, tipo de instrumento, datas de vigência, URL, referência de armazenamento, hash SHA-256, número de páginas, estado de verificação, actor e momento de confirmação. As relações entre diplomas devem ser registadas em `normativeSourceRelations`, com tipo de relação, artigo, vigência, página e evidência.

Assim, não se substitui o catálogo canónico por cópias carregadas por cada empresa, nem se considera uma linha persistida válida quando o código não existe no catálogo imutável. A activação deve exigir simultaneamente: código reconhecido no catálogo; fonte persistida correspondente; hash/página/evidência coerentes quando aplicável; estado mínimo `HUMAN_APPROVED` da fonte; relação normativa aprovada quando a cadeia exigir; regra ou versão associada; vigência compatível; e aprovação humana auditada.

## Aplicação ao PGCA e ao IVA

`PGC-AO-82-01` permanece a referência canónica do plano-base. `IVA-LAW-7-19`, `IVA-LAW-17-19`, `IVA-DP-180-19`, `IVA-DE-134-19` e `IVA-LAW-14-23` permanecem uma cadeia versionada: origem, alteração, regulamento/contas, modelos declarativos e alteração/republicação consolidada. A Lei n.º 14/23 não apaga a proveniência histórica dos diplomas de 2019, e o Decreto Presidencial n.º 180/19 não transforma automaticamente qualquer grupo 34.5 numa conta lançável.

## Estado da implementação

A decisão fica documentada e compatível com o schema existente. A base observada tinha zero linhas em `normativeSources`; isso significa que ainda falta persistir a evidência utilizada numa futura activação. Não se deve preencher essa tabela com dados fictícios ou apenas para mudar o estado de readiness. Enquanto as fontes não forem persistidas/ligadas e as contas/rules não forem aprovadas, `PGCA-82-01` permanece `UNDER_REVIEW` e as regras produtivas permanecem zero.

## Critério de encerramento

Antes de uma transição `UNDER_REVIEW → VALIDATED → ACTIVE`, uma auditoria deve conseguir percorrer: versão PGCA → fonte(s) persistidas → relação normativa → conta/rule → documento/movimento → aprovação humana → evento de auditoria. Qualquer elo ausente mantém o comportamento fail-closed.
