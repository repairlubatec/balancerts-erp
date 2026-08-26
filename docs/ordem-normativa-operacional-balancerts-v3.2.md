# Ordem normativa operacional do BALANCERTS.ERP — V3.2

**Data de corte:** 26 de Agosto de 2026  
**Finalidade:** ordenar os diplomas por dependência jurídica e utilidade operacional para contabilidade, fiscalidade, facturação, SAF-T, fecho e auditoria.  
**Regra de segurança:** implementação técnica, catalogação ou preparação não equivale a activação normativa.

> **Fail-closed:** nenhum diploma, taxa, isenção, tabela, regra de movimentação, modelo declarativo ou prazo pode alimentar cálculo, posting, emissão ou fecho definitivo enquanto não existir fonte primária legível, vigência fechada, alterações/revogações mapeadas e aprovação humana auditável.

## 1. Estados usados

| Estado | Significado no ERP |
|---|---|
| **Implementado estruturalmente** | A arquitectura, catálogo, camada ou integração técnica existe no software. Pode estar bloqueada para uso jurídico. |
| **Incorporado e documentado** | O diploma foi associado ao corpus, com evidência local e rastreabilidade, mas ainda pode faltar consolidação ou aprovação. |
| **Homologação pendente** | Existe implementação local, mas falta validação/submissão externa ou cobertura integral de obrigações. |
| **Pendente — prioridade alta** | O diploma é directamente necessário para uma função central do ERP, mas faltam evidências, tabelas, vigência ou validação. |
| **Pendente — prioridade média** | O diploma é relevante para módulos fiscais específicos, mas não bloqueia o núcleo contabilístico geral. |
| **Fora do pacote prioritário** | Não entra na presente ordem porque exige um módulo sectorial ou funcional que não faz parte do núcleo actual do BALANCERTS.ERP. |

## 2. Ordem dos diplomas já implementados ou incorporados

### Ordem 1 — Decreto n.º 82/01: base contabilística canónica

O Decreto n.º 82/01, de 16 de Novembro, é a **única base canónica do plano de contas**: `PGCA-82-01`. As 765 entradas pendentes foram integradas estruturalmente na versão existente; o catálogo persistido tem 792 contas, das quais 27 estão confirmadas e 765 permanecem `NEEDS_NORMATIVE_VALIDATION`. A hierarquia foi preservada e não se consideraram repetições as contas de níveis distintos.

**Estado:** implementado estruturalmente, mas `UNDER_REVIEW`.  
**Pode fazer:** pesquisa, composição versionada, revisão, simulação e auditoria.  
**Não pode fazer:** activação global, posting ou considerar automaticamente natureza e regra débito/crédito das 765 contas pendentes.

### Ordem 2 — Lei n.º 7/19: Código do IVA original

A Lei n.º 7/19 é preservada como origem histórica da cadeia IVA e foi incorporada no catálogo versionado. O motor mantém a relação temporal a partir de 1 de Julho de 2019, mas a presença da lei no catálogo não substitui a consolidação posterior.

**Estado:** incorporado/documentado; não é a versão isolada corrente.  
**Função:** origem histórica, incidência, dedução, obrigações e estrutura inicial do IVA.

### Ordem 3 — Decreto Presidencial n.º 180/19: regulamento e camada contabilística do IVA

O DP n.º 180/19 foi incorporado como camada posterior ao PGCA, e não como novo plano de contas. Foram registadas as contas e rubricas IVA específicas, incluindo 34.5, 34.6, 63.5, 75.3.1.2 e o Anexo II 4640–4647, dentro do escopo visual confirmado.

**Estado:** incorporado/documentado com confirmação visual dirigida; activação global bloqueada.  
**Função:** contas contabilísticas e tratamento regulamentar do IVA.

### Ordem 4 — Decreto Executivo n.º 134/19: modelos declarativos do IVA

O DE n.º 134/19 foi incorporado como camada declarativa e procedimental. Foram identificados o Modelo 06, a Declaração Periódica Modelo 7, anexos de clientes/fornecedores, regularização de créditos, restituição e regime transitório.

**Estado:** incorporado/documentado; modelos oficiais ainda não podem ser declarados activos sem validação integral dos campos, versões e canal de submissão.

### Ordem 5 — Lei n.º 17/19: alteração ao IVA

A Lei n.º 17/19 foi relacionada com a Lei n.º 7/19, com entrada em vigor registada em 1 de Outubro de 2019 e preservação do Anexo I dentro da cadeia histórica.

**Estado:** incorporado/documentado; depende da consolidação com a republicação e alterações posteriores.

### Ordem 6 — Lei n.º 14/23: alteração e republicação do Código do IVA

A Lei n.º 14/23 é a **peça central da versão consolidada do IVA** actualmente modelada. A arquitectura não apaga a Lei n.º 7/19 nem a Lei n.º 17/19; aplica-as como cadeia temporal. As taxas e regras revistas foram registadas como evidência de escopo, mas a activação definitiva continua dependente da cadeia completa, anexos, vigência e homologação.

**Estado:** incorporado/documentado; `HOMOLOGAÇÃO PENDENTE`.  
**Função:** consolidação corrente do IVA, sem substituir o PGCA-base.

### Ordem 7 — Lei n.º 21/14 e Lei n.º 21/20: Código Geral Tributário

Os dois PDFs foram inventariados, submetidos a OCR e conferidos visualmente nas páginas materiais. A Lei n.º 21/14 é a base do CGT; a Lei n.º 21/20 é alteradora e aditiva, com revogações expressas e vigência própria.

**Estado:** incorporado no corpus documental; não é um motor autónomo de taxas.  
**Função:** prazos, procedimento tributário, garantias, infracções, liquidação, caducidade, prescrição, execução e relações transversais.  
**Limite:** não autoriza, por si só, taxas de II, IRT, IP ou IS.

### Ordem 8 — XSD SAF-T AO e validação estrutural

A validação do XSD `SAFTAO1.01_01.xsd` foi integrada no fluxo de exportação SAF-T. Esta integração é técnica, não um diploma fiscal: distingue estrutura XML válida de aceitação, homologação ou submissão AGT.

**Estado:** implementado estruturalmente.  
**Limite:** permanecem pendentes validação semântica, origem fiscal, regras de período e homologação externa.

### Ordem 9 — Lei n.º 14/25: OGE 2026 e circulares AGT 2026

A Lei n.º 14/25 e a Circular n.º 01/GACA/GJ/AGT/2026 foram catalogadas como fontes de impacto potencial em IVA, IRT, II, IS e benefícios. As Circulares n.º 09 e n.º 12 de 2026 também foram catalogadas; a Circular 12 tem relevância interpretativa para isenções de Imposto Predial.

**Estado:** identificado/incorporado documentalmente, mas `A CONSOLIDAR`.  
**Função:** camada temporal anual que pode alterar limites, condições, benefícios ou obrigações; nunca substitui os códigos-base.

## 3. Pendências directamente relevantes para o ERP, por ordem de execução

### P1 — Fechar o PGCA-82-01 antes de activar contabilidade

**Diploma:** Decreto n.º 82/01.  
**Dependências:** confirmação conta a conta do código, designação literal, pai, nível, natureza, movimentação, lançabilidade e páginas do PDF.  
**Impacto:** bloqueia activação do plano e posting contabilístico.  
**Resultado esperado:** mudar apenas contas individualmente confirmadas para `CONFIRMED`; activar a versão só quando a cobertura integral e as regras estiverem fechadas.

### P2 — Fechar a cadeia IVA e a camada contabilística

**Diplomas:** Lei n.º 7/19 → Lei n.º 17/19 → DP n.º 180/19 → DE n.º 134/19 → Lei n.º 14/23, acrescida de alterações posteriores aplicáveis.  
**Dependências:** PDFs primários institucionais, anexos, vigência, contas IVA, modelos, regimes, isenções, deduções, regularizações e homologação externa.  
**Impacto:** bloqueia taxas IVA normativas, contas 34.5/34.6/63.5/75.3.1.2, modelos declarativos e regras especiais.  
**Estado:** motor preparado e versionado; homologação pendente.

### P3 — Fechar facturação e documentos

**Diplomas:** Decreto Presidencial n.º 71/25 como regime actual; DP n.º 292/18 e DE n.º 73/19 apenas para histórico; DP n.º 312/18 e DE n.º 74/19/Rectificação n.º 10/19 na parte não derrogada.  
**Dependências:** PDF institucional do DP 71/25, entrada em vigor, modelos, facturação electrónica, autofacturação, certificação e relação com submissão SAF-T.  
**Impacto:** bloqueia emissão legal plenamente conforme, numeração definitiva, autofacturação e alegações de certificação.

### P4 — Configurar Imposto Industrial

**Diplomas:** Lei n.º 19/14 → Lei n.º 4/19 quando aplicável → Lei n.º 26/20 → Lei n.º 27/22; DE n.º 83/19; DP n.º 194/20; regras de reintegrações/amortizações, provisões, preços de transferência e autofacturação.  
**Dependências:** código consolidado, regimes geral/simplificado, matéria colectável, taxas — incluindo o alcance exacto da alteração do artigo 73.º pela Lei n.º 27/22 —, provisório, dedutibilidade, isenções, declarações, modelos e prazos.  
**Impacto:** cálculo do imposto da empresa, declarações Modelo 1/2, relatórios e lançamentos fiscais. A Lei n.º 27/22 foi identificada e ligada à cadeia, mas o PDF institucional consultado termina no início do diploma; o artigo 73.º completo e a regra de 6,5% permanecem bloqueados até ser obtido o texto primário integral.

### P5 — Configurar IRT e integrar com Recursos Humanos

**Diplomas:** Lei n.º 18/14 → Lei n.º 9/19 quando aplicável → Lei n.º 28/20; tabelas e modelos oficiais; DP n.º 194/20 quando aplicável.  
**Dependências:** Grupos A/B/C, tabela do Grupo A, profissões, matéria colectável, deduções, isenções, retenções, auto-facturação e vigência posterior.  
**Impacto:** processamento salarial, retenções, declarações e reconciliação com RH.

### P6 — Configurar Imposto do Selo

**Diploma:** DLP n.º 3/14, republicação do Código do Imposto do Selo, respectiva tabela anexa e alterações/OGE aplicáveis.  
**Dependências:** tabela integral por acto/operação, base, valor absoluto ou percentagem, sujeito que liquida, titular do encargo, isenções, declaração e prazo.  
**Impacto:** documentos, contratos, crédito, garantias, arrendamentos, seguros, operações financeiras e facturação.

### P7 — Configurar Imposto Predial

**Diplomas:** Lei n.º 20/20, Código do Imposto Predial; DP n.º 191/21; Circular AGT n.º 12/2026 para critérios interpretativos, quando aplicável.  
**Dependências:** cadastro/avaliação, detenção, arrendamento, transmissão, prédios urbanos/rústicos, tabela completa, isenções, calendário, modelos e prova do aproveitamento útil e efectivo.  
**Impacto:** cadastro patrimonial, rendas, transmissões e obrigações imobiliárias.

### P8 — Configurar IEC

**Diplomas:** Lei n.º 8/19 → Lei n.º 18/19 e alterações posteriores.  
**Dependências:** anexos I/II, produtos, taxas, incidência, importação/produção, modelos e vigência consolidada.  
**Impacto:** só é prioritário para empresas/produtos sujeitos; não bloqueia o núcleo contabilístico geral.

### P9 — Configurar IAC

**Diploma:** DLP n.º 2/14 e alterações vigentes, com modelos aplicáveis.  
**Dependências:** Secções A/B, categorias, incidência, isenções, retenção e liquidação.  
**Impacto:** aplicações de capitais, juros, dividendos e rendimentos financeiros.

### P10 — Configurar IVM

**Diploma:** Lei n.º 24/20, tabelas, modelos e alterações posteriores.  
**Dependências:** cadastro de veículos, categorias, valores, pagamento, selo e calendário.  
**Impacto:** apenas empresas com veículos sujeitos; não deve ser activado no núcleo geral sem cadastro específico.

### P11 — Configurar SISA/Sucessões e Doações, apenas se o ERP abranger património

**Dependências:** diploma-base, taxas, isenções, beneficiários, graus de relação, UCF, escalões, modelos e vigência.  
**Impacto:** transmissões patrimoniais; não é necessário para o núcleo de contabilidade comercial enquanto não houver módulo patrimonial/sucessório.

### P12 — Fechar benefícios fiscais

**Diplomas:** Lei n.º 8/22, DP n.º 213/23 e regulamentação aplicável.  
**Dependências:** regimes, condições, limites, certificados, investimento, reinvestimento e vigência.  
**Impacto:** deve ser aplicado apenas com prova documental e ligação ao imposto material de origem; nunca como etiqueta manual autónoma.

## 4. Pendências excluídas desta ordem prioritária

Não foram incluídos como prioridade de implementação geral o Imposto Especial sobre Jogos (IEJ), o Imposto sobre o Valor dos Recursos Minerais (IVRM) e o CEOC/cobrança executiva, porque exigem módulos sectoriais ou procedimentais específicos que não fazem parte do núcleo actualmente definido para o BALANCERTS.ERP. Podem ser adicionados futuramente como extensões, mas não devem bloquear contabilidade, facturação geral, tesouraria, RH ou SAF-T do núcleo empresarial.

Também não foram tratados como leis fiscais autónomas o XSD SAF-T, o catálogo do Portal do Contribuinte, notícias, formulários editáveis ou cópias Lex.AO. São evidência técnica, institucional ou auxiliar e devem permanecer separados dos diplomas primários.

## 5. Ordem final resumida

| Ordem | Componente ERP | Base normativa principal | Estado operacional |
|---:|---|---|---|
| 1 | Contabilidade/PGCA | Decreto n.º 82/01 | Estruturalmente incorporado; activação bloqueada |
| 2 | IVA — código e regimes | Lei 7/19 → Lei 17/19 → Lei 14/23 | Versionado; homologação/cadeia pendente |
| 3 | IVA — contas | DP 180/19 | Camada separada; confirmação/activação pendente |
| 4 | IVA — declarações | DE 134/19 | Modelos catalogados; validação integral pendente |
| 5 | CGT transversal | Lei 21/14 → Lei 21/20 | Corpus auditado; aplicação procedimental a consolidar |
| 6 | Facturação | DP 71/25 + relação histórica DP 292/18/312/18 | Prioridade alta; consolidação pendente |
| 7 | SAF-T | XSD AO + regras AGT | Validação estrutural implementada; sem homologação externa |
| 8 | OGE/circulares anuais | Lei 14/25 + Circulares AGT 01, 09, 12/2026 | Camada temporal a consolidar |
| 9 | Imposto Industrial | Lei 19/14 → Lei 26/20 → Lei 27/22 + regulamentação | Pendente de configuração jurídica |
| 10 | IRT/RH | Lei 18/14 → Lei 28/20 + tabelas | Pendente de configuração jurídica |
| 11 | Imposto do Selo | DLP 3/14 + tabela anexa | Pendente de tabela e configuração |
| 12 | Imposto Predial | Lei 20/20 + DP 191/21 | Pendente de cadastro, tabela e configuração |
| 13 | IEC | Lei 8/19 → Lei 18/19 | Pendente; activar apenas para âmbito sujeito |
| 14 | IAC | DLP 2/14 | Pendente; activar apenas para âmbito sujeito |
| 15 | IVM | Lei 24/20 | Pendente; activar apenas com cadastro de veículos |
| 16 | SISA | Diploma-base e tabela a confirmar | Extensão patrimonial opcional |
| 17 | Benefícios fiscais | Lei 8/22 + DP 213/23 | Pendente; transversal e condicionado |

## Referências

[1]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial "CNNCA — Legislação do Sector Empresarial"
[2]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[3]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas "Portal do Contribuinte — Impostos e taxas"
[4]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391 "AGT — Legislação Fiscal"
[5]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/circulares#collapse2398 "AGT — Circulares"
[6]: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3 "AGT — Regime Jurídico das Facturas"

## Documentos internos de suporte

- `docs/pgc-global-import-iva-layer-2026-08-26.md`
- `docs/pgca-final-version-decision-2026-08-26.md`
- `docs/motor-fiscal-comando-v2-relatorio-2026-08-26.md`
- `docs/fiscal-legal-source-registry-v3.2.md`
- `docs/fiscal-legal-gap-matrix-v3.2.md`
- `docs/fiscal-legal-item-classification-v3.2.md`
