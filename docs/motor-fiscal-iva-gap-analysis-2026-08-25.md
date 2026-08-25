# Auditoria do Motor Fiscal e IVA

**Sistema:** BALANCERTS.ERP  
**Data:** 25 de Agosto de 2026  
**Âmbito:** auditoria técnica da implementação existente, conforme o documento Motor Fiscal anexado.  
**Princípio:** esta auditoria não activa impostos, não altera dados históricos e não substitui módulos existentes.

## Conclusão executiva

A aplicação possui uma implementação funcional de **IVA parametrizado**, com regimes `GERAL`, `SIMPLIFICADO` e `EXCLUSAO`, cálculo determinístico, vigência básica da regra, validação de estado `ACTIVE`, calendário fiscal local, registo fiscal e verificações de cobertura normativa. O IVA deve ser classificado como **PARCIAL / A AUDITAR**, e não como conformidade fiscal integral, porque a implementação actual não prova todos os fluxos exigidos pelo documento: dedução detalhada, regularizações, importações, exportações, apuramento completo, declarações operacionais, retenções e regras completas por operação.

Os restantes impostos — Imposto Industrial, IRT, Retenções na Fonte, Imposto Predial, IAC, Imposto de Selo, IEC, IVM e outros — são **NÃO IMPLEMENTADOS / NÃO CONFIGURADOS**. A existência de menus ou campos fiscais não foi considerada evidência de implementação.

## Inventário técnico

| Área | Evidência técnica | Estado | Observação |
|---|---|---|---|
| Tipos e cálculo de IVA | `server/fiscal.ts` | PARCIAL | Calcula imposto sobre base líquida, valida estado activo e regime; não cobre todo o ciclo fiscal. |
| Regras fiscais persistentes | `drizzle/schema.ts`, tabela `ivaNormativeRules` | PARCIAL | Possui código, tipo, taxa, vigência, evidência e estado; o registo central comum ainda não está generalizado para todos os impostos. |
| Mapeamento contabilístico IVA | `ivaAccountMappings`, helpers e preflight PGCA | PARCIAL | Existe estrutura para mapeamento 34.5-IVA e validação de estado; a activação depende de confirmação normativa. |
| Fontes normativas | `normativeSources`, `normativeSourceRelations`, `server/normative.ts` | PARCIAL | Há cadeia esperada e estados de verificação; a confirmação legal final continua dependente da evidência visual oficial. |
| Regimes | `IvaRegime` e enums de schema | COMPLETO no escopo declarado | Apenas Geral, Simplificado e Exclusão são aceites. |
| Calendário fiscal | `server/tax-compliance.ts`, `fiscal.complianceCalendar` | PARCIAL | Calendário local parametrizado; não equivale a submissão AGT nem a validação de calendário oficial actualizado. |
| Registo fiscal | `fiscal.taxRecords`, `reports.fiscalRegister` | PARCIAL | Há persistência e reconciliação com documentos; falta demonstrar cobertura integral das obrigações declarativas. |
| Facturação e documentos | `businessDocuments`, router `documents` | PARCIAL | IVA é associado a documentos, mas o motor ainda não representa todas as operações especiais descritas no documento. |
| Contabilidade | `journalEntries`, posting e relatórios | PARCIAL | Integração contabilística existe; regras fiscais específicas de todos os movimentos IVA não estão activas sem evidência. |
| Tesouraria | routers e relatórios financeiros | PARCIAL | Integração por pagamentos e reconciliação existe; apuramento fiscal não é substituído pela tesouraria. |
| Auditoria | `auditEvents`, helpers tenant-aware | COMPLETO para rastreabilidade técnica existente | Actor, empresa, operação, estado e correlação são registados nas mutações cobertas. |
| RBAC | `roleProcedure` e permissões fiscais | COMPLETO no âmbito testado | Leitura e validação são protegidas por função; submissão AGT continua bloqueada. |
| AGT | validações locais e estados `EXTERNAL_PENDING` | NÃO IMPLEMENTADO | Não existe integração oficial activa nem deve ser considerada concluída. |
| Imposto Industrial, IRT e demais impostos | Não foram encontrados motores equivalentes | AUSENTE | Permanecem fora da activação até auditoria e fontes oficiais. |

## IVA GAP ANALYSIS

| Componente | Estado | Evidência | Regra/fonte | Gap identificado | Acção | Prioridade | Teste |
|---|---|---|---|---|---|---|---|
| Incidência e classificação | PARCIAL | `FiscalRule`, `ivaNormativeRules` | Fonte normativa registada por código e vigência | Não existe matriz completa de operações e excepções | Completar somente após confirmação normativa | Alta | Casos por regime e operação |
| Sujeito passivo | PARCIAL | `companies.ivaRegime` | Regime persistido na empresa | Não substitui validação jurídica do sujeito passivo | Manter empresa como contexto; validar regras adicionais por fonte | Alta | Isolamento e regime por empresa |
| Taxas | PARCIAL | `calculateIva`, `rate` | Taxa deve vir de regra activa | Não se deve assumir que uma taxa local cobre todas as vigências e operações | Versionar e activar apenas regras confirmadas | Crítica | Vigência, arredondamento e estado |
| Base tributável | PARCIAL | `netAmount` | Base líquida recebida pelo cálculo | Falta composição auditável da base por itens, descontos e operações especiais | Derivar da linha documental persistida | Alta | Reconciliação documento–imposto |
| IVA liquidado | PARCIAL | documentos e cálculo IVA | Regra activa por regime | Falta matriz completa de vendas, adiantamentos, devoluções e notas | Implementar progressivamente por operação validada | Alta | Factura e rectificação |
| IVA suportado/dedutível | AUSENTE / NÃO COMPROVADO | Não existe motor completo de dedução identificado | Requer fonte e condições legais | Não activar dedução por suposição | Modelar apenas após regras oficiais e documentos exigidos | Crítica | Casos de dedução e exclusão |
| Isenções | PARCIAL | tipos `EXEMPTION` no catálogo | Fonte normativa e evidência | Catálogo não prova aplicação integral por produto/operação | Configurar catálogo com evidência e vigência | Alta | Isenção confirmada e rejeitada |
| Regularizações | PARCIAL | enum `REGULARIZATION` | Requer regras e histórico | Não há cobertura integral do ciclo | Criar fluxo versionado e auditado | Alta | Nota de crédito/débito e período encerrado |
| Exportações/importações | NÃO COMPROVADO | Não há fluxo fiscal completo | Aplicabilidade depende do escopo | Não activar sem requisitos operacionais | Manter não configurado | Média | Teste só após escopo aprovado |
| Apuramento | PARCIAL | `evaluateIvaReadiness`, registo fiscal | Indicadores de prontidão não são apuramento | Falta cálculo completo de liquidado, dedutível, pagar e crédito | Criar serviço de apuramento versionado | Crítica | Reconciliação por período |
| Declarações | PARCIAL | calendário e registo fiscal | Obrigações locais | Não há submissão AGT nem pacote oficial validado | Manter submissão externa bloqueada | Crítica | Exportação interna e reconciliação |
| Vigência | PARCIAL | `validFrom`, `validTo`, `activeFiscalRule` | Regra válida na data | Conflitos e prioridade entre regras ainda requerem matriz comum | Consolidar registry e testes de sobreposição | Alta | Datas limite e reprocessamento |
| Auditoria | COMPLETO no âmbito implementado | `auditEvents` e correlação | Actor, data, operação e estado | Evidência jurídica detalhada por cálculo ainda deve ser ampliada | Acrescentar ruleId/version ao resultado persistido | Média | Reconstrução por documento |
| Integração contabilística | PARCIAL | posting, mappings IVA | Conta e movimento dependem de regra activa | Não activar lançamentos fiscais não confirmados | Ligar regras confirmadas ao posting | Crítica | Débito/crédito e origem |
| Integração AGT | AUSENTE / EM ESPERA | `EXTERNAL_PENDING` | Requer credenciais e homologação | Sem ambiente oficial | Não implementar como concluída | Bloqueador externo | Teste oficial futuro |

## Decisão de arquitectura

A decisão segura é **evoluir a arquitectura existente**, não reconstruir o ERP. `ivaNormativeRules`, `ivaAccountMappings`, `normativeSources`, `fiscal.taxRecords` e os helpers tenant-aware devem formar a base do núcleo fiscal comum. A generalização para outros impostos só deve ocorrer depois de estabilizar o inventário e a matriz do IVA.

O futuro registo comum deve preservar, no mínimo, identificação da regra, tipo de imposto, descrição, diploma, artigo, referência legal, vigência, estado, regime, tipo de contribuinte, operação, base, taxa, dedução, isenção, retenção, regra contabilística, declaração, prazo, validação e versão. Campos sem fonte oficial devem ficar `NÃO CONFIGURADO / REQUER VALIDAÇÃO`.

## Ordem segura de implementação

1. Fechar a auditoria do IVA e confirmar a matriz normativa oficial, sem activar códigos ilegíveis ou presumidos.
2. Consolidar vigências, conflitos e versões no mecanismo existente antes de adicionar novos impostos.
3. Completar operações IVA individualmente: compras, vendas, serviços, devoluções, notas de crédito, notas de débito e regularizações.
4. Construir apuramento e reconciliação por período, preservando exercícios encerrados e histórico.
5. Integrar apenas regras confirmadas com facturação, compras, contabilidade, tesouraria e relatórios.
6. Só depois preparar o Imposto Industrial e demais áreas, cada uma com auditoria, fontes, testes e decisão de activação próprios.

## Bloqueios e limites

Não foi autorizada a invenção de taxas, limites, prazos, isenções, benefícios, regimes ou obrigações. A integração AGT permanece futura. A confirmação visual de diplomas oficiais e a aceitação de utilizadores continuam dependentes de recursos externos e humanos. O motor fiscal não deve marcar uma área como implementada apenas porque existe uma procedure, um campo ou uma entrada de menu.

## Validação executada

Foram confirmados TypeScript sem erros, testes fiscais/normativos direccionados aprovados e navegação sem novos erros activos após a correcção do escopo SQL e do contrato do calendário fiscal. A suite global anterior permanece aprovada com 151 ficheiros e 591 testes; este documento não altera dados de produção, documentos emitidos ou regras PGCA/IVA.

## Referência de trabalho

Este relatório foi elaborado a partir do documento **Motor Fiscal** fornecido pelo utilizador e da inspecção técnica do código existente. As fontes jurídicas concretas de activação permanecem as fontes oficiais angolanas já registadas no catálogo do projecto; nenhuma regra nova foi inferida neste relatório.

## Actualização de implementação — 25 de Agosto de 2026

Após a auditoria, o serviço fiscal passou a resolver a versão activa mais recente por regime e data, ignorando regras não activas. Foi acrescentada validação determinística de códigos, evidência, vigência inválida e sobreposição de versões. O resultado fiscal comum passou a expor `taxType`, `taxBase`, `ruleId`, `ruleVersion`, `legalReference`, `warnings` e `validationErrors`; quando não existe referência jurídica explícita, o motor emite um aviso e não inventa uma referência.

Foi também disponibilizado o procedimento protegido `fiscal.calculateFiscalResult`, mantendo o contrato histórico `fiscal.calculateIva` para compatibilidade. Esta extensão não activa taxas novas, não altera documentos emitidos e não transforma a auditoria parcial do IVA em conformidade integral. A integração completa por operação, apuramento, dedução, regularizações, declarações e AGT continua condicionada às fontes e evidências indicadas na matriz.
