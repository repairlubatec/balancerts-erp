# Relatório preliminar de análise
## Auditoria Legislativa Fiscal Angola — V3.2

**Sistema:** BALANCERTS.ERP  
**Data:** 26 de Agosto de 2026  
**Autor:** Manus AI  
**Estado:** análise documental preliminar; nenhuma alteração de código, schema, base de dados, migration ou regra fiscal executada.

## 1. Conclusão executiva

O documento V3.2 é uma **especificação de auditoria e modelação documental**, não um contrato de implementação fiscal. O seu princípio mais importante é separar diploma identificado, fonte oficial, PDF confirmado, vigência, alteração, regra extraída, regra consolidada, interpretação jurídica e regra aprovada para implementação. Esta separação é compatível com a arquitectura fail-closed já existente no BALANCERTS.ERP e deve ser mantida.

O BALANCERTS.ERP já possui uma base normativa parcial: fontes e relações normativas genéricas, cadeia versionada do PGCA/IVA, regras IVA com vigência e evidência, estados de revisão humana, catálogo de cobertura fiscal e bloqueios de activação. Contudo, ainda não possui as quinze matrizes documentais autónomas previstas na V3.2. Em consequência, o sistema está preparado para evoluir para esse corpus, mas a auditoria V3.2 **não pode ser declarada concluída** apenas porque alguns diplomas e regras já estão registados.

A recomendação é aprovar a V3.2 como **modelo de domínio e plano de auditoria**, mantendo a implementação fiscal existente intacta. A próxima etapa deverá construir o corpus por fases, começando pelo registo de fontes/PDFs e pela matriz de lacunas, antes de qualquer nova regra fiscal ser marcada como `APPROVED_FOR_IMPLEMENTATION`.

> **Nota de prudência:** este relatório é uma análise técnica de sistemas e não substitui parecer de contabilista certificado, advogado ou confirmação formal da entidade fiscal competente.

## 2. Limites expressos da V3.2

A V3.2 proíbe explicitamente reiniciar o projecto, substituir o IVA existente, apagar dados, alterar o plano de contas, alterar módulos contabilísticos, criar migrations, alterar código fiscal ou activar regras novas. Portanto, nesta fase, são permitidos pesquisa, extracção, classificação, estruturação, documentação, inventários, matrizes e identificação de divergências; não é permitida a transformação automática de uma conclusão documental em comportamento operacional.

Esta limitação é adequada ao estado do projecto. Qualquer implementação posterior deve ocorrer num documento separado de **Contrato de Implementação do Motor Fiscal**, usando apenas regras com fonte oficial confirmada, vigência confirmada, fundamento legal rastreável, interpretação aprovada e teste definido.

## 3. Comparação com o BALANCERTS.ERP actual

| Área V3.2 | Situação actual do ERP | Classificação | Consequência |
|---|---|---|---|
| Fontes normativas | Existem `normativeSources`, fontes PGCA/IVA, hashes, páginas, URLs e estados; existem fontes PGCA versionadas | Parcialmente implementado | Falta um registo fiscal único com todos os campos exigidos pela V3.2 |
| Relações entre diplomas | Existem relações como `AMENDS`, `REPEALS`, `REPUBLISHES`, `REGULATES` e `APPROVES_MODELS`; a cadeia PGCA/IVA está estruturada | Parcialmente implementado | Falta completar relações para todo o universo fiscal e validar temporalmente cada relação |
| PDF inventory | Há evidência por ficheiro/hash em fluxos existentes e submissão de evidência PGCA | Parcialmente implementado | Não existe ainda inventário fiscal geral com `pdfStatus`, confiança e obrigação documental |
| Matriz de regras | IVA possui regras versionadas, regime, taxa, artigo, vigência e evidência | Parcialmente implementado | Não existe matriz transversal para todos os impostos, obrigações, benefícios e dependências |
| Matriz de taxas | IVA/II têm catálogo técnico candidato, mas não um corpus fiscal universal aprovado | Preparação controlada | As taxas não devem ser generalizadas sem diploma, regime, base, condição e vigência |
| Benefícios | Não existe matriz fiscal universal de benefícios | Lacuna global | Isenções, reduções, créditos e deduções não devem ser activados por descrição informal |
| Obrigações e prazos | Existem fluxos pontuais e readiness AGT, mas não uma matriz transversal completa | Lacuna global | É necessário relacionar obrigação, modelo, canal, responsável, prazo e fonte |
| Dependências | Existem guardas e cadeia IVA, mas não a matriz genérica facto → incidência → sujeito → regime → base → taxa → cálculo → declaração → pagamento | Lacuna global | Falta uma representação uniforme da dependência jurídica e operacional |
| Conflitos | Existem estados de conflito em fontes/regras e bloqueios fail-closed | Parcialmente implementado | Falta uma matriz formal com fonte A, fonte B, diferença, temporalidade e resolução proposta |
| Lacunas | O sistema tem bloqueadores técnicos e estados de fonte pendente | Parcialmente implementado | Falta o vocabulário completo V3.2 para diplomas, regulamentos, tabelas, formulários e PDFs ausentes |
| Factos tributários | O IVA é calculado sobre documentos comerciais; outros impostos ainda não têm motores específicos | Parcialmente implementado | A factura não pode ser tratada como definição universal de facto tributário |
| Testes | Existem testes de IVA, PGCA, readiness e fluxos documentais | Parcialmente implementado | Falta uma matriz documental de cenários por imposto, período, regime e expectativa legal |
| Orçamento anual | Não há ainda matriz geral de alterações do OGE 2026 | Lacuna global | Alterações orçamentais devem ter valor anterior, novo valor, vigência e regra transitória |

## 4. Universo fiscal e resultado da análise

O baseline da V3.2 inclui IVA, Imposto Industrial, IRT, IAC, Imposto do Selo, Imposto Predial, IEC, IVM, SISA, CGT, processo tributário, execuções fiscais, benefícios fiscais, facturação, SAF-T, autofacturação, CEOC, IEJ, IVRM, regimes petrolíferos, regimes mineiros, legislação aduaneira e sucessões/doações. O próprio documento determina que esta lista não é fechada.

A pesquisa institucional anteriormente registada no projecto confirma que o Portal do Contribuinte enumera II, IP, IRT, IAC, IS, SISA, IVA, IEC e IVM; a AGT também publica categorias de legislação fiscal, aduaneira, tributação especial, circulares e programas validados [1] [2]. Isto confirma um baseline operacional, mas **não prova por si só** taxas, vigência, isenções, sujeitos, prazos ou regras de cálculo.

| Grupo | Estado actual da evidência e implementação |
|---|---|
| IVA | Cadeia normativa versionada e motor parcial existente; a V3.2 exige auditoria integral de alterações, regimes, isenções, deduções, regularizações, cativação, obrigações, modelos e OGE 2026 sem reescrever o código actual. |
| Imposto Industrial | O projecto tem catálogo de cobertura e parâmetros candidatos de pesquisa institucional; não possui ainda motor transversal aprovado para matéria colectável, regimes, provisórios, declaração e prazos. |
| IRT | O projecto possui infraestrutura de recursos humanos, mas não matriz fiscal completa de grupos, escalões, deduções, retenções e declarações. |
| IAC e Imposto do Selo | Persistência/catálogo parcial; falta ligar cada facto, categoria, verba, taxa, isenção, retenção e obrigação a fonte primária e vigência. |
| IP, SISA e IVM | Exigem domínios próprios — imóveis, transmissões, veículos e calendários — que não podem ser derivados de facturação genérica. |
| IEC, CEOC e regimes sectoriais | Exigem pesquisa independente, classificação de produto/sector, fonte primária, regras aduaneiras ou sectoriais e análise de conflitos. |
| CGT, processo e execuções fiscais | São camadas procedimentais e de administração tributária, não simples taxas de documento comercial. |
| Facturação e SAF-T | Existem implementação documental e validação estrutural SAF-T, mas a V3.2 exige confirmação do regime actualmente aplicável e separação entre norma histórica, procedimento AGT e obrigação jurídica. |
| OGE 2026 | Deve ser auditado como camada temporal anual; não se deve assumir que qualquer alteração orçamental é permanente. |

## 5. Avaliação dos estados exigidos

A proposta de `sourceConfidence` é adequada e deve ser separada de `pdfStatus`, `officialVerificationStatus`, `legalInterpretationStatus` e `implementationStatus`. Uma fonte secundária pode localizar um diploma, mas não deve, sozinha, fundamentar uma regra aprovada. Do mesmo modo, uma página institucional pode confirmar que um imposto existe sem confirmar a taxa aplicável a todos os regimes.

A classificação recomendada para o BALANCERTS.ERP é a seguinte:

| Estado | Significado operacional recomendado |
|---|---|
| `SOURCE_PENDING` | Diploma ou fonte oficial ainda não localizado/confirmado. |
| `BLOCKED_SOURCE_NOT_CONFIRMED` | O PDF oficial é necessário, mas a autenticidade ou o documento integral ainda não foram confirmados. |
| `UNCERTAIN_VIGENCY` | Não foi possível confirmar entrada em vigor, revogação, transição ou período aplicável. |
| `REQUIRES_LEGAL_REVIEW` | A regra exige interpretação ou revisão humana. |
| `CONFLICTING` | Fontes ou disposições apresentam divergência não resolvida. |
| `APPROVED_FOR_IMPLEMENTATION` | Só pode ser usado após fonte, PDF quando aplicável, vigência, interpretação, conflitos e teste estarem concluídos. |

Esta separação corresponde ao comportamento já adoptado pelo Motor Fiscal: regras que não estão activas, vigentes ou documentadas são rejeitadas ou mantidas em estado de preparação; impostos sem motor específico continuam `NÃO CONFIGURADO` ou `PERSISTÊNCIA APENAS`.

## 6. Lacunas concretas para a próxima fase documental

A principal lacuna é estrutural: o projecto tem metamodelos normativos parciais, mas não dispõe ainda de entidades/artefactos equivalentes a todas as quinze matrizes V3.2. As lacunas são globais do software e não da Repair Lubatec.

| Prioridade | Entregável documental | Motivo |
|---:|---|---|
| P0 | `fiscal_legal_source_registry` e `fiscal_pdf_inventory` | Sem fonte e PDF classificados, não há base auditável para qualquer regra. |
| P0 | `fiscal_legal_gap_matrix` | Deve tornar visíveis diplomas, alterações, regulamentos, tabelas, modelos e vigências em falta. |
| P1 | `fiscal_rule_matrix`, `fiscal_rate_matrix` e `fiscal_temporal_rule_matrix` | Permitem separar regra, taxa, base, condição, regime, data e fundamento jurídico. |
| P1 | `fiscal_rule_dependency_matrix` e `fiscal_taxable_event_matrix` | Evitam reduzir cada imposto a uma percentagem aplicada à factura. |
| P1 | `fiscal_obligation_matrix` e `fiscal_deadline_matrix` | Ligam declaração, pagamento, canal, periodicidade e prazo à fonte. |
| P2 | `fiscal_benefit_matrix`, `fiscal_legal_conflict_matrix` e `fiscal_annual_budget_changes` | Capturam reduções, conflitos e alterações temporárias do OGE. |
| P2 | `fiscal_master_rule_registry` e `fiscal_calculation_test_matrix` | Funcionam como ponte controlada para futura implementação, sem activar regras incertas. |

## 7. Divergências e riscos identificados

A primeira divergência é de completude: o documento V3.2 exige uma auditoria independente do universo fiscal, mas o estado actual do projecto contém sobretudo um inventário institucional inicial e não uma prova exaustiva de todos os regimes adicionais. Esta lacuna deve ficar registada como `ADDITIONAL_FISCAL_REGIME_IDENTIFIED` quando a varredura encontrar regimes fora do baseline, e não deve ser escondida.

A segunda divergência é de fonte: várias referências actuais vêm de portais institucionais ou repositórios jurídicos usados para localização. O próprio projecto já reconhece que a página institucional não substitui o diploma primário. Cada item deve distinguir fonte oficial primária, fonte oficial secundária, referência oficial, fonte secundária e não verificada.

A terceira divergência é temporal: taxas e regras apresentadas em páginas actuais não devem ser aplicadas automaticamente a períodos passados. A data do facto tributário, o período fiscal, a entrada em vigor, as normas transitórias e a eventual revogação devem ser campos independentes.

A quarta divergência é de implementação: a existência de `fiscalTaxRecords.taxType` para II, IRT, IAC, IS, IP, SISA, IEC e IVM não demonstra que esses impostos estejam calculados, declarados ou prontos para produção. O estado seguro continua a ser `PERSISTÊNCIA APENAS` ou `NÃO CONFIGURADO` quando faltar motor, regra, fonte e teste.

## 8. Recomendação formal

Recomendo classificar o documento V3.2 como **aprovado para análise e modelação documental**, mas não como autorização para alterar o Motor Fiscal. A sequência correcta é: inventariar fontes e PDFs; confrontar o universo fiscal com fontes oficiais; registar vigência, alterações e revogações; criar a matriz de lacunas; extrair regras sem interpretação automática; registar conflitos; definir testes documentais; e só depois preparar um contrato de implementação separado.

O IVA existente deve permanecer intacto durante esta etapa. A cadeia PGCA-82-01 e as camadas IVA já estruturadas devem ser preservadas; a auditoria V3.2 deve apenas verificar se as fontes, relações, vigências e evidências estão completas. Nenhuma regra nova deve ser marcada como `APPROVED_FOR_IMPLEMENTATION` enquanto houver PDF em falta, vigência incerta, conflito, interpretação pendente ou teste inexistente.

## 9. Estado de aceitação do relatório

| Critério | Resultado |
|---|---|
| Documento V3.2 lido integralmente | Sim |
| Requisitos estruturados | Sim |
| Comparação com o código actual | Sim, com base no schema, Motor Fiscal e relatórios existentes |
| Pesquisa independente completa de todo o universo fiscal | Ainda não concluída nesta fase documental |
| Todos os diplomas e PDFs primários confirmados | Não |
| Quinze matrizes V3.2 implementadas | Não; identificadas como lacuna global |
| Alterações ao software nesta análise | Nenhuma |
| Activação de novas regras fiscais | Nenhuma |
| Recomendação | Aprovar como especificação de auditoria; não implementar ainda |

## Referências

[1]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal "Portal da AGT — Legislação Fiscal"

[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas "Portal do Contribuinte — Impostos e taxas"

[3]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial "Portal do Contribuinte — Imposto Industrial"

[4]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-7-19-de-24-de-abril/ "Lei n.º 7/19 — Código do IVA"

[5]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-17-19-de-13-de-agosto/ "Lei n.º 17/19 — alteração ao Código do IVA"

[6]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ "Decreto Presidencial n.º 180/19 — Regulamento do Código do IVA"

[7]: https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/ "Decreto Executivo n.º 134/19 — modelos declarativos do IVA"

[8]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ "Lei n.º 14/23 — alteração e republicação do Código do IVA"
