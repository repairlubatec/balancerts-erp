# BALANCERTS.ERP — Project TODO

- [x] Shell de aplicação desktop com barra lateral persistente, barra de título, atalhos de teclado e layout de alta densidade informativa
- [x] Identidade visual baseada no logótipo BALANCERTS, com paleta azul, verde, preto e tratamento profissional de software
- [x] Experiência instalável como PWA e optimizada para desktop Windows/macOS
- [x] Painel “Minhas Empresas” com estado de período, pendências, documentos, obrigações, integrações, tarefas e indicadores de fecho
- [x] Navegação directa do alerta do dashboard para a origem operacional
- [x] Hierarquia multi-tenant Plataforma → Organização → Empresa → Exercício → Período
- [x] Isolamento multi-tenant aplicado e validado no backend em consultas, mutações, URLs, APIs, exportações, ficheiros e filas persistentes implementadas; cache partilhada futura não existe no produto actual e fica explicitamente fora de escopo
- [x] RBAC para Admin, Contabilista, Financeiro, Operador e Auditor
- [x] Segregação de funções por módulo e operação, validada no backend
- [x] Motor Contabilístico com partidas dobradas e débito igual a crédito
- [x] Invariantes de conta vigente/postável, período válido, origem, idempotência, atomicidade e imutabilidade
- [x] Mecanismo controlado de estorno e correcção com rastreabilidade
- [x] Cadeia navegável Documento → Lançamento → Conta → Relatório e percurso inverso
- [x] Facturação e documentos comerciais com séries e numeração sequencial
- [x] Máquina de estados DRAFT → VALIDATED → ISSUED → ACCOUNTED → CANCELLED
- [x] Imutabilidade pós-emissão e associação a cliente/fornecedor, itens, impostos, pagamentos e contabilidade
- [x] Motor fiscal versionado por vigência e evidência normativa
- [x] Regimes de IVA exclusivamente Geral, Simplificado e Exclusão de Angola
- [x] Conformidade parametrizada com o Decreto Presidencial n.º 71/25 e requisitos da AGT
- [x] Módulos de clientes, fornecedores, stock, caixa, bancos, tesouraria e imobilizado
- [x] Stock com valorização parametrizada, rastreabilidade e reconciliação contabilística
- [x] Imobilizado com depreciação versionada, auditável e ligada ao motor contabilístico
- [x] Multimoeda com moeda da operação, moeda funcional, taxa, fonte e data
- [x] Documentos e ficheiros com hash, metadados, ACL e validação no download
- [x] Auditoria de negócio separada dos logs técnicos, append-only e reconstruível
- [x] Operações críticas com actor, entidade, empresa, estado anterior/posterior, timestamp e correlação
- [x] Relatórios: Balancete, Diário, Razão, Demonstração de Resultados, Balanço, auxiliares e fiscais
- [x] Relatórios reconciliáveis com razão, auxiliares, documentos e origem
- [x] Fecho e reabertura com checklist configurável, bloqueios, validações, motivo e auditoria
- [x] Testes unitários para invariantes, fiscalidade, estados, idempotência, stock, depreciação, câmbio e permissões
- [x] Testes de integração e end-to-end dos ciclos comerciais, financeiros, fiscais e de fecho
- [x] Testes de isolamento multi-tenant e autorização directa por API
- [x] Testes de resiliência, reprocessamento, concorrência, reconciliação e recuperação
- [x] Manifesto PWA, ícones, instalação e comportamento responsivo sem transformar a UI em landing page
- [x] Rever todos os itens antes do checkpoint final
- [x] Implementar atalhos de teclado reais com command palette, navegação por módulos, pesquisa rápida e acções globais
- [x] Enriquecer cada empresa no painel “Minhas Empresas” com documentos por validar, obrigações fiscais, erros de integração, tarefas e pendências críticas
- [x] Fazer os alertas abrirem a origem exacta com contexto e ID do registo afectado, não apenas a página genérica do módulo
- [x] Implementar pesquisa funcional na command palette e acções globais reais, incluindo criar documento, abrir empresa, iniciar reconciliação e executar checklist
- [x] Fazer os deep-links dos alertas seleccionar o registo exacto no módulo de destino, aplicando foco, filtro ou estado visível
- [x] Implementar handlers reais para as acções globais da command palette, abrindo modal ou fluxo visível de criação de documento, reconciliação e checklist
- [x] Fazer os módulos de destino consumir ?new= e activar a acção correspondente com feedback visual e testes básicos
- [x] Adicionar testes básicos para os fluxos activados por ?new=, cobrindo criação de documento, reconciliação e checklist
- [x] Adicionar teste de resolução da command palette até ao módulo de destino com ?new= aplicado
- [x] Adicionar cobertura de UI dos três fluxos ?new=, verificando CTA inicial e feedback de fluxo iniciado
- [x] Adicionar cobertura de integração da command palette, verificando filtragem, selecção e rota ?new=
- [x] Aplicar RBAC por papel em todos os procedimentos e adicionar testes por role para cada módulo crítico
- [x] Cobrir segregação de funções por operação real no backend, incluindo leitura, escrita, emissão, posting, fecho e download
- [x] Persistir movimentos de stock e ligar reconciliação de inventário ao razão/lançamentos
- [x] Ligar depreciação do imobilizado a lançamentos contabilísticos e registar auditoria de execução
- [x] Expor endpoint real de download com validação ACL e signed URL, com testes de acesso autorizado e negado
- [x] Registar evento de auditoria obrigatório na reabertura de período e testá-lo
- [x] Adicionar testes de integração tenant-aware sobre queries, mutações e ficheiros para provar isolamento real
- [x] Adicionar testes por role para cada módulo/procedimento crítico: empresas, documentos, ficheiros, relatórios, fiscal, reconciliação, imobilizado e stock
- [x] Criar persistência de movimentos de stock e reconciliar esses movimentos com lançamentos/razão de forma tenant-aware
- [x] Adicionar testes do endpoint files.downloadUrl cobrindo acesso autorizado e negado por ACL
- [x] Adicionar teste do procedimento closing.validateReopen verificando evento de auditoria, correlationId, estados e actor
- [x] Ligar a reconciliação backend de stock a movimentos persistidos e linhas do razão, com filtragem tenant-aware no helper e router
- [x] Adicionar teste de files.downloadUrl em que o utilizador tem permissão de leitura mas a ACL do ficheiro nega o acesso
- [x] Adicionar teste de integração com base de dados para gravar movimentos/lançamentos e validar reconciliação reconciliada, divergente e entre empresas
- [x] Implementar queries persistentes tenant-aware para Diário, Razão, Demonstração de Resultados e Balanço
- [x] Expor endpoints protegidos dos relatórios principais e cadeia Documento → Lançamento → Conta
- [x] Completar relatórios auxiliares e fiscais com queries e validações AGT específicas
- [x] Auditar movimentos de stock persistidos com actor, tenant, entidade, estado e correlationId
- [x] Validar tenant da empresa antes de permitir posting contabilístico e auditar lançamentos novos
- [x] Integrar auditoria de negócio nas mutações persistentes críticas e disponibilizar reconstrução por entidade/empresa
- [x] Expor reconstrução da auditoria por empresa com ordenação append-only e filtro tenant-aware
- [x] Permitir validação de reconciliação de stock ao Contabilista sem ampliar permissões de execução do Operador
- [x] Auditar registo de metadata de ficheiros após upload e reserva de numeração documental
- [x] Implementar resumo fiscal auxiliar de IVA por regime, estado documental e totais monetários
- [x] Persistir estorno controlado como novo lançamento invertido, com motivo, correlação, permissão e imutabilidade do original
- [x] Cobrir por API o posting de estorno do Contabilista e a rejeição do Auditor
- [x] Impedir que um documento passe a ACCOUNTED sem lançamento POSTED ligado por sourceDocumentId
- [x] Reforçar testes de idempotência para chave vazia, processamento em curso, resultado concluído e retry após falha
- [x] Testar leitura tenant-aware da auditoria pelo Auditor e rejeição por função antes do acesso à base de dados
- [x] Expor cadeia inversa Lançamento → Documento de origem → Contas, com filtro tenant-aware
- [x] Cobrir por API Documento→Lançamento e Lançamento→Documento com escopo tenant-aware
- [x] Cobrir timeout repetido, limite de retries e estado RECONCILIATION_REQUIRED nas integrações externas
- [x] Parametrizar validação de evidência normativa por área fiscal-documental e contabilística, sem aceitar códigos desconhecidos
- [x] Expor validação normativa no router fiscal e cobrir Contabilista autorizado versus Operador bloqueado
- [x] Adicionar teste de integração real não destrutivo para queries tenant-aware sem inserir dados artificiais
- [x] Validar por integração real que reconciliação de stock não devolve dados de empresa/tenant inexistente
- [x] Persistir reversalOfEntryId, emitir JOURNAL_ENTRY_REVERSED e testar rastreabilidade estruturada do estorno
- [x] Completar navegação Conta→Relatório e Relatório→Conta/Documento/Lançamento com percurso integrado
- [x] Ligar relatório, conta, lançamento e documento de origem numa consulta reports.trace tenant-aware, com teste directo do endpoint
- [x] Validar reports.trace na base real com filtro accountCode e confirmação de que não existem origens fora do tenant
- [x] Tornar obrigatório no teste de integração que DATABASE_URL esteja operacional, evitando falsos positivos por fallback sem DB
- [x] Cobrir concorrência determinística de requisições com a mesma chave, impedindo execução duplicada durante PROCESSING
- [x] Expor filtros entityType/entityId na reconstrução de auditoria e testar o percurso tenant-aware por API
- [x] Testar emissão documental autorizada ao Contabilista e bloqueada ao Financeiro, além da escrita de posting já coberta
- [x] Cobrir ciclo tRPC reserva de número → emissão documental → posting contabilístico com contratos e ordem verificados
- [x] Validar na base real o filtro de auditoria por entityType/entityId para escopo inexistente
- [x] Criar/actualizar ficha real Repair Lubatec com NIF, contacto, localização, actividade, IVA, moeda e ano de criação
- [x] Manter Repair Lubatec em PENDING até concluir validações legais/operacionais e autorização de activação
- [x] Validar fluxos tenant-aware usando Repair Lubatec real sem inserir documentos, movimentos ou lançamentos
- [x] Confirmar que o regime de IVA da Repair Lubatec deve ser registado como EXCLUSÃO
- [x] Implementar schema, helper e endpoint companies.create para ficha real com estado PENDING, actor e auditoria
- [x] Criar Repair Lubatec efectivamente na base através de organização proprietária autorizada, com estado PENDING e auditoria
- [x] Validar a ficha real da Repair Lubatec por integração tenant-aware e confirmar zero documentos, lançamentos, períodos e movimentos de stock
- [x] Receber os representantes legais Fausto Silva e Luís Jordão para a ficha real Repair Lubatec
- [x] Persistir representantes legais na ficha da empresa sem designar representante principal por inferência
- [x] Persistir Fausto Silva e Luís Jordão como representantes legais da Repair Lubatec sem designar principal
- [x] Confirmar Fausto Silva como representante legal principal e Luís Jordão como representante adicional
- [x] Criar período fiscal inicial 2023/09 para Repair Lubatec, mantendo-o aberto e sem transacções
- [x] Testar via backend/router companies.list, periods, documents, reports e audit para a Repair Lubatec em escopo tenant-aware
- [x] Provar que reserva documental, transição/emissão e posting permanecem bloqueados enquanto a Repair Lubatec está PENDING
- [x] Testar via backend/router companies.list, periods, documents, reports e audit para a Repair Lubatec em escopo tenant-aware
- [x] Provar que reserva documental, transição/emissão e posting permanecem bloqueados enquanto a Repair Lubatec está PENDING
- [x] Implementar companies.activate com confirmação literal, verificações de configuração, estado READY e auditoria
- [x] Testar companies.activate com confirmação inválida e rejeição de Contabilista antes de tocar na empresa
- [x] Activar Repair Lubatec para estado READY através do endpoint administrativo auditado
- [x] Verificar após activação que o período 2023/09 permanece aberto e que não foram criados documentos, lançamentos ou movimentos
- [x] Activar a Repair Lubatec explicitamente via endpoint tRPC companies.activate e provar READY auditado
- [x] Testar a invocação integrada companies.activate com ausência de documentos, lançamentos e movimentos criados automaticamente
- [x] Adicionar teste Vitest integrado de companies.activate via appRouter.createCaller cobrindo transição PENDING→READY
- [x] No mesmo teste, validar evento COMPANY_ACTIVATED auditável e zero businessDocuments, journalEntries e stockMovements
- [x] Implementar calendário AGT parametrizado para 2026 com IVA Geral/Simplificado, SAF-T, filtragem por regime e datas válidas
- [x] Implementar builders auxiliares de antiguidade de saldos e registo fiscal com reconciliação de totais
- [x] Verificar o fluxo files.register com base64, chave tenant-aware, storagePut e metadata persistida antes do download ACL
- [x] Criar fiscalExercises como camada entre Company e FiscalPeriod e associar o período real Repair Lubatec 2023/09
- [x] Expor reports.fiscalRegister com query persistente tenant-aware sobre businessDocuments e reconciliação fiscal
- [x] Endurecer audit.append com validação de organização/empresa e testar rejeição de escopo fora do tenant
- [x] Ligar o portefólio “Minhas Empresas” a companies.list real, com loading/empty states e sem métricas financeiras inventadas
- [x] Ligar a actividade recente da Home ao histórico auditado real do tenant actual, com estado vazio quando não existem eventos
- [x] Remover alertas demonstrativos da Home e apresentar pendências apenas quando existir fonte persistente real
- [x] Enumerar e testar todas as mutações críticas suportadas em estado PENDING, além de reserva documental, transição/emissão e posting
- [x] Cobrir RBAC do reports.fiscalRegister: Auditor autorizado e Operador bloqueado antes da persistência
- [x] Condicionar a actividade auditada da Home ao RBAC de leitura de auditoria, evitando queries proibidas para Operador
- [x] Completar os relatórios auxiliares e fiscais ainda pendentes com queries persistentes e validações AGT específicas, consolidando o item macro de relatórios
- [x] Adicionar prova integrada por teste de que cada relatório principal/auxiliar reconcilia com razão, documentos e origem persistida real, incluindo percurso completo de traceabilidade
- [x] Adicionar painel de percurso a partir de um relatório seleccionado para Conta, Documento e Auditoria
- [x] Testar a resolução determinística de rotas Relatório→Conta/Documento/Auditoria com registo seleccionado
- [x] Testar a resolução determinística de rotas Conta→Relatório/Documento/Auditoria com lançamento seleccionado
- [x] Ligar o módulo Empresas a companies.list real com NIF, moeda funcional, regime IVA e estado de configuração
- [x] Validar em integração real que escopos inexistentes devolvem consultas vazias e que activation fora de empresa existente é bloqueada sem escrita
- [x] Validar estruturalmente pacotes fiscais AGT quanto a período, regime, origem documental e totais reconciliados
- [x] Expor reports.agtValidation sobre empresa e fiscalRegister reais, com teste integrado para Repair Lubatec
- [x] Cobrir em teste tRPC a sequência comercial→contabilística→fiscal→fecho→reabertura auditada
- [x] Completar a auditoria de todas as mutações persistentes críticas, garantindo actor, empresa, entidade, correlationId e snapshots beforeState/afterState consistentes em cada operação
- [x] Adicionar testes específicos por mutação crítica (reserva/transição documental, posting/estorno, stock, ficheiros, depreciação, empresas e reabertura) validando evento auditado e reconstrução por company/entity
- [x] Normalizar beforeState/afterState explícitos em eventos de criação e posting de stock, ficheiros, numeração e lançamentos
- [x] Fazer o módulo Contabilidade consumir ?entry= e seleccionar/abrir visivelmente o lançamento correspondente
- [x] Adicionar teste de UI/integrado que prove a navegação do botão de traceabilidade até ao lançamento seleccionado
- [x] Adicionar teste integrado da Home que seleccione um registo, clique em Lançamento e confirme navegação para /contabilidade?entry= com o registo destacado
- [x] Adicionar teste integrado do percurso inverso Conta→Relatório que confirme consumo do parâmetro e selecção esperada no destino
- [x] Testar auditoria de postDepreciation com actor, tenant, entidade, correlationId e estados CALCULATED→POSTED
- [x] Bloquear recordStockMovement para empresas PENDING/BLOCKED antes da inserção e testar o guard operacional READY
- [x] Validar no helper central de auditoria actor, action, entidade, correlationId e presença explícita de beforeState/afterState

- [x] Estender o TraceabilityPanel ao modo Documento e validar Documento→Lançamento→Conta/Relatório/Auditoria com teste jsdom
- [x] Acrescentar dados persistentes de vencimento, contraparte e liquidação para ageing de clientes/fornecedores
- [x] Bloquear createFileAsset para empresas PENDING/BLOCKED antes da persistência e manter cobertura de upload/ACL
- [x] Ligar customerAging/supplierAging à vista Relatórios com síntese real, estado vazio e cobertura jsdom
- [x] Registar beforeState/afterState explícitos na reserva de numeração documental (nextNumber anterior e seguinte)
- [x] Restringir ageing a documentos emitidos/contabilizados e excluir rascunhos, validações e cancelamentos
- [x] Remover empresas e métricas demonstrativas da grelha de Relatórios, usando Repair Lubatec real e estados Sem dados quando não há execução persistida
- [x] Cobrir no teste da Home a resolução Documento→Relatório/Conta/Lançamento/Auditoria
- [x] Criar matriz testável das 10 mutações críticas actualmente suportadas, com tabelas, evento e entidade auditados
- [x] Tornar a transição documental reprocessável/auditável com correlationId opcional determinístico no router e fallback compatível
- [x] Provar em integração real que Balancete, Diário, Razão, DR, Balanço, registo fiscal, IVA e stock reconciliam para Repair Lubatec sem dados operacionais
- [x] Proteger depreciação e reabertura contra organizationId/empresa fora do tenant antes da mutação, com teste negativo de ausência de posting parcial
- [x] Unificar stock e ficheiros no guard central actor→organização→empresa antes da escrita e auditoria
- [x] Provar na base real que stock e ficheiros rejeitam organizationId forjado da Repair Lubatec antes de persistir
- [x] Validar periodId pertencente à empresa e ao tenant antes de reabertura/auditoria, com prova negativa na base real
- [x] Impedir reabertura de períodos OPEN/CLOSING e validar estado CLOSED antes do evento PERIOD_REOPEN, com prova real na Repair Lubatec
- [x] Validar que posting rejeita sourceDocumentId e reversalOfEntryId inexistentes ou fora da empresa antes de persistir
- [x] Exigir período tenant-aware no posting e impedir estornos duplicados, marcando o lançamento original como REVERSED na mesma transacção
- [x] Provar em integração real que accounting.post rejeita utilizador fora da empresa e periodId inexistente antes da inserção
- [x] Uniformizar JOURNAL_ENTRY_POSTED/JOURNAL_ENTRY_REVERSED através de appendAuditEventForUser após posting contabilístico
- [x] Validar em integração real a forma dos eventos de auditoria persistidos da Repair Lubatec, incluindo actor, tenant, entidade, correlação e snapshots
- [x] Provar reconstrução de eventos de auditoria por company/entity usando filtros persistentes na Repair Lubatec
- [x] Uniformizar eventos DOCUMENT_* da transição documental através de appendAuditEventForUser
- [x] Uniformizar auditoria de criação/activação de empresa, stock, ficheiros e reserva documental através de appendAuditEventForUser
- [x] Enumerar as 10 mutações persistentes críticas e documentar política PENDING/READY com matriz e testes de contrato
- [x] Criar e testar contrato agregado de reconciliação para Balancete, Diário, Balanço, IVA e registo fiscal
- [x] Testar imutabilidade pós-emissão na máquina documental: ACCOUNTED/CANCELLED não regressam a DRAFT/VALIDATED
- [x] Expor reports.reconciliation tenant-aware com checks agregados de Balancete, Diário, Balanço, IVA e registo fiscal
- [x] Validar em integração real reports.reconciliation para Repair Lubatec e confirmar vazio seguro em escopo inexistente
- [x] Testar RBAC de reports.reconciliation: Auditor autorizado, Operador bloqueado antes da consulta
- [x] Apresentar na interface de Relatórios o estado real da reconciliação agregada e o número de verificações aprovadas
- [x] Criar e testar builder de prontidão SAF-T AO com lacunas explícitas e sem declarar elegibilidade de submissão
- [x] Expor reports.saftReadiness com motivos de bloqueio persistentes e submissionEligible sempre falso até validação XSD/AGT
- [x] Finalizar os cartões Volume Facturado, A Receber e Reconciliação da Home com fiscalRegister, customerAging e reports.reconciliation persistentes e tenant-aware
- [x] Normalizar e testar snapshots beforeState/afterState estruturados na mutação fixedAssets.postDepreciation, incluindo actor, entidade, lançamento e correlação
- [x] Normalizar e testar snapshots beforeState/afterState estruturados na mutação closing.validateReopen, incluindo período, motivo, actor e correlationId
- [x] Adicionar guard assertSaftExportReady para impedir exportação SAF-T quando faltam entidades ou validação AGT/XSD, com cobertura de prontidão completa e incompleta
- [x] Estabilizar o teste de integração de leitura tenant-aware com timeout explícito para latência de TiDB, sem alterar as asserções funcionais
- [x] Cobrir RBAC de reports.saftReadiness: Auditor autorizado, Operador rejeitado antes da persistência e contrato submissionEligible conservador
- [x] Validar getSaftReadinessForUserCompany na base real da Repair Lubatec, confirmando escopo tenant-aware, lacunas persistentes e submissionEligible falso
- [x] Provar na integração real que getSaftReadinessForUserCompany rejeita utilizador/empresa inexistentes sem devolver dados de outro tenant
- [x] Fixar no contrato SAF-T o namespace urn:OECD:StandardAuditFile-Tax:AO_1.01_01 e a versão XSD 1.01_01, sem permitir submissão automática
- [x] Completar os relatórios auxiliares e fiscais ainda pendentes com queries persistentes e validações AGT específicas
- [x] Adicionar prova integrada por teste de que cada relatório principal/auxiliar reconcilia com razão, documentos e origem persistida real, incluindo percurso completo de traceabilidade
- [x] Reforçar validateAgtFiscalRecord para rejeitar IVA liquidado no regime EXCLUSÃO, com teste específico e totais reconciliados
- [x] Cobrir em integração tRPC a superfície fiscal da Repair Lubatec: agtValidation, saftReadiness com XSD identificado e rejeição de empresa inexistente
- [x] Ampliar o teste de ciclo comercial→contabilístico→fiscal→fecho para validar reports.reconciliation e reports.saftReadiness antes da reabertura auditada
- [x] Estabilizar o teste tRPC integrado de superfícies da Repair Lubatec com timeout explícito para latência de TiDB, sem reduzir cobertura funcional
- [x] Criar validador agregado da matriz de auditoria para action, entityType e snapshots explicitamente presentes, com cobertura de documentos, posting e mutação desconhecida
- [x] Adicionar resolução inversa de auditoria action/entity para mutação crítica, cobrindo DOCUMENT_ISSUED e JOURNAL_ENTRY_POSTED
- [x] Alinhar buildFiscalRegister com a regra de IVA zero em EXCLUSÃO e testar divergência mesmo quando os totais aritméticos fecham
- [x] Criar contrato de reconciliação de origem documental por sourceDocumentId, detectando documentos emitidos sem lançamento e lançamentos órfãos
- [x] Expor reports.documentOriginReconciliation com queries persistentes tenant-aware, RBAC de leitura e contrato de documentos sem lançamento/lançamentos órfãos
- [x] Alinhar por teste as dez mutações críticas entre a matriz PENDING/READY e a matriz de auditoria, sem operações críticas órfãs
- [x] Cobrir RBAC de reports.documentOriginReconciliation: Auditor autorizado, Operador bloqueado e escopo tenant-aware antes da persistência
- [x] Validar documentOriginReconciliation no router real da Repair Lubatec e em escopo inexistente, confirmando reconciliação vazia segura
- [x] Reforçar resiliência de integrações externas com AbortSignal por tentativa e abortar operações em timeout antes de RECONCILIATION_REQUIRED
- [x] Implementar teste E2E persistido de reserva/emissão documental, posting contabilístico, validação fiscal, reconciliação, fecho e reabertura numa empresa autorizada
- [x] Adicionar integração de base de dados que grave movimentos/lançamentos e valide estados reconciliado, divergente e isolamento entre empresas
- [x] Adicionar provas de reprocessamento e recuperação após falha parcial usando estado persistido, além de retries e timeout
- [x] Incluir documentOrigin como evidência persistente na resposta de reports.reconciliation, preservando os checks agregados existentes e o contrato da Home
- [x] Provar no percurso real da Repair Lubatec que reports.reconciliation inclui documentOrigin reconciliado e sem órfãos, mantendo os checks agregados
- [x] Cobrir table-driven os dez contratos de auditoria com action, entityType e snapshots explícitos; a execução persistida completa permanece pendente nos macros correspondentes
- [x] Reforçar buildVatSummary e buildReportReconciliation para rejeitar IVA positivo em EXCLUSÃO, com testes auxiliares e integração real sem dados
- [x] Tornar reports.reconciliation conservador perante divergência de origem documental, sem alterar os cinco checks visualizados na Home
- [x] Criar e testar buildCompleteReportReconciliation, fazendo a reconciliação global depender também da origem documental
- [x] Explicitar por tabela os dez estados PENDING/READY e alinhar cada um com o contrato de auditoria; a prova de execução persistida continua separada
- [x] Cobrir a sequência de recuperação FAILED→RETRY→COMPLETED no resolvedor de idempotência, separada da prova persistida E2E ainda pendente
- [x] Documentar limites de verificação, evidência real da Repair Lubatec e lacunas persistidas que impedem afirmar conformidade AGT ou conclusão E2E
- [x] Validar a cadeia append-only dos dez eventos críticos com ordem, correlationId e beforeState/afterState explícitos; a execução persistida completa permanece separada
- [x] Expor exportBlockedReason no contrato SAF-T para distinguir MISSING_REQUIRED_ENTITIES de AGT_VALIDATION_REQUIRED, mantendo submissionEligible falso
- [x] Adicionar assertDocumentMutable para bloquear alterações em ISSUED, ACCOUNTED e CANCELLED, com teste directo além da máquina de transições
- [x] Validar no router real da Repair Lubatec exportBlockedReason=MISSING_REQUIRED_ENTITIES, além de namespace, versão e submissionEligible falso
- [x] Implementar e testar builder XML determinístico SAF-T AO 1.01_01 com Header, contas, lançamentos e documentos, escapamento XML e ordenação estável; validação XSD/AGT externa permanece necessária
- [x] Executar no tenant descartável o ciclo persistido de reserva/emissão, posting, validação fiscal, reconciliação, fecho e reabertura
- [x] Gravar movimentos e lançamentos no tenant descartável para validar reconciliado, divergente e isolamento entre empresas
- [x] Validar recuperação após falha parcial com estado persistido e reprocessamento idempotente no tenant descartável
- [x] Fazer rollback/limpeza do tenant descartável e confirmar que a Repair Lubatec não foi alterada
- [x] Executar no tenant descartável o ciclo persistido de reserva/emissão, posting, validação fiscal, reconciliação, fecho e reabertura
- [x] Gravar movimentos e lançamentos no tenant descartável para validar reconciliado, divergente e isolamento entre empresas
- [x] Validar recuperação após falha parcial com estado persistido e reprocessamento idempotente no tenant descartável
- [x] Fazer rollback/limpeza dos registos temporários do tenant descartável e confirmar que a Repair Lubatec não foi alterada
- [x] Provar no tenant descartável falha transitória→reprocessamento→lançamento persistido→replay idempotente sem duplicação; estados FAILED persistidos de integrações externas continuam separados
- [x] Validar isolamento multi-tenant nas exportações, SAF-T, ficheiros e operações persistentes de integração com testes negativos por empresa/organização; superfícies futuras de cache/filas não implementadas permanecem documentadas como limite
- [x] Implementar entidades e associações de clientes/fornecedores, itens, impostos, pagamentos e contabilidade, com imutabilidade pós-emissão
- [x] Parametrizar de forma verificável o Decreto Presidencial n.º 71/25 e requisitos AGT, distinguindo evidência normativa interna de validação externa
- [x] Expandir módulos operacionais persistentes de clientes, fornecedores, caixa, bancos e tesouraria com RBAC, auditoria e reconciliação
- [x] Adicionar testes de integração e migração para os quatro blocos expandidos, sem alterar dados da Repair Lubatec
- [x] Criar migração 0015 não destrutiva para contrapartes, produtos, linhas/impostos documentais, pagamentos, caixa, tesouraria e regras normativas
- [x] Expor routers tenant-aware de contrapartes, catálogo, caixa/banco, pagamentos, tesouraria e regras normativas com RBAC
- [x] Cobrir em integração criação, leitura, auditoria, idempotência e rejeição de empresa forjada nos módulos expandidos
- [x] Registar a regra interna AO-FATURAS-71-25 com fonte pública e EXTERNAL_PENDING, sem declarar certificação AGT
- [x] Rejeitar operações de integração com empresa/organização incompatíveis e impedir replay de chave fora do escopo
- [x] Expor `reports.saftExport` tenant-aware, devolvendo metadados SAF-T AO e bloqueando XML até elegibilidade/validação externa
- [x] Testar negativamente alterações de contraparte documental, itens, impostos e pagamentos após ISSUED/ACCOUNTED/CANCELLED
- [x] Implementar e testar anulação com motivo obrigatório e rectificação NC/ND referenciada ao documento de origem, sem apagar o original
- [x] Bloquear actualização de contraparte ligada a documento emitido, contabilizado ou anulado, com auditoria quando permitida
- [x] Implementar arquivo lógico idempotente de documentos anulados, preservando o original e registando evento auditado
- [x] Expor matriz operacional versionada do Decreto 71/25 para emissão, rectificação, anulação, recibo, arquivo e certificação, com EXTERNAL_PENDING onde aplicável
- [x] Persistir reconciliações de caixa/banco por conta, com diferença calculada a partir de movimentos, estado OPEN/RECONCILED, RBAC e auditoria
- [x] Cobrir fornecedor e conta bancária no E2E operacional, incluindo consulta tenant-aware e reconciliação persistente de saldo zero
- [x] Bloquear actualização de artigo/serviço usado por documento ISSUED, ACCOUNTED ou CANCELLED, com teste tenant-aware e auditoria para alterações permitidas
- [x] Executar cenário fornecedor→documento emitido→lançamento POSTED com `sourceDocumentId`, validando associação contabilística e cleanup tenant-aware
- [x] Cobrir fluxo bancário OUT com transferência, consulta de pagamentos, movimento de tesouraria e reconciliação persistente de saldo negativo
- [x] Provar isolamento tenant-aware nas superfícies existentes de integrações persistentes, SAF-T, ficheiros, relatórios e mutações operacionais; caches/filas não fazem parte da superfície implementada e permanecem como limite documentado
- [x] Criar configuração AGT versionada para XSD, endpoint, autenticação, códigos oficiais e estado de homologação
- [x] Implementar fila de submissão AGT com estados, idempotência, timeout, reprocessamento e auditoria tenant-aware
- [x] Implementar validação estrutural local do XML SAF-T quando um XSD oficial for disponibilizado, sem declarar certificação
- [x] Documentar claramente a separação entre preparação interna, homologação técnica e certificação formal da AGT
- [x] Criar configuração AGT versionada para XSD, endpoint, autenticação, códigos oficiais e estado de homologação, sem guardar segredos em claro
- [x] Implementar enfileiramento AGT tenant-aware com estado PENDING e replay idempotente, reutilizando operações persistentes
- [x] Testar configuração e fila AGT no tenant descartável, incluindo rejeição de escopo forjado e limpeza sem afectar a Repair Lubatec
- [x] Auditar o enfileiramento AGT com actor, organização, empresa, chave idempotente, estado PENDING, correlação e snapshot persistido
- [x] Integrar o ficheiro oficial SAFTAO1.01_01.xsd como referência de validação local reproduzível
- [x] Validar o XML SAF-T gerado contra SAFTAO1.01_01.xsd e corrigir incompatibilidades estruturais
- [x] Cobrir testes de XML válido, XML inválido e bloqueio de submissão quando a prontidão fiscal continuar incompleta
- [x] Completar e provar por código/testes a superfície integral de clientes, fornecedores, caixa, bancos e tesouraria: criação, leitura, actualização permitida, bloqueios, listagens e fluxos principais
- [x] Adicionar evidência verificável das superfícies finais de cada módulo listado, incluindo endpoints e UI aplicável, antes de fechar o macro operacional

- [x] Implementar processador AGT sobre `executePersistedIdempotentIntegration`, consumindo o envelope `AGT_SUBMISSION`, transitando `PENDING → SENT → COMPLETED/FAILED` e provando replay sem duplicação
- [x] Ligar Clientes, Fornecedores, Stock e Tesouraria a consultas tRPC tenant-aware e apresentar contagens/listas persistentes no shell desktop
- [x] Completar formulários interactivos de criação/actualização para Clientes, Fornecedores, Stock e Tesouraria com acções por linha/seleção, em vez de depender de ID manual

- [x] Adicionar teste UI específico para Clientes, Fornecedores, Stock e Tesouraria, cobrindo rota, estado vazio e affordance de criação
- [x] Cobrir actualização permitida de fornecedor antes de emissão e bloqueio posterior no E2E tenant descartável
- [x] Implementar entidade persistente/listagem/gestão de activos fixos, ou documentar formalmente o escopo limitado a cálculo/posting de depreciação
- [x] Completar actualizações UI de contraparte, catálogo e contas de caixa/banco com acções por linha e cobertura de sucesso/erro


# Continuação integral — levantamento documental e evolução

- [x] Inventariar todos os documentos, folhas, PDFs, imagens e referências relevantes disponíveis no Google Drive para o BALANCERTS.ERP
- [x] Comparar os requisitos documentais com schema, routers, regras fiscais, relatórios, SAF-T, auditoria, RBAC e UI actualmente implementados
- [x] Registar lacunas novas com prioridade, impacto legal/operacional e dependências externas da AGT
- [x] Implementar o próximo conjunto prioritário de funcionalidades determinado pelo levantamento documental: contratos SIGT/FE, configuração AGT, builders, validações e cliente REST seguro
- [x] Adicionar testes Vitest e E2E para cada funcionalidade nova, incluindo isolamento multi-tenant, RBAC, auditoria e estados de erro
- [x] Verificar visualmente as superfícies desktop/PWA afectadas e preservar a linguagem de software de alta densidade
- [x] Executar regressão completa, build de produção, validações SAF-T/XSD e revisão de logs
- [x] Actualizar documentação técnica e limites de conformidade externa
- [x] Guardar checkpoint de progresso após concluir o próximo conjunto prioritário


# Auditoria documental — Portal do Parceiro AGT

- [x] Localizar a pasta exacta do Portal do Parceiro da AGT no Google Drive e inventariar todos os ficheiros
- [x] Ler integralmente os documentos técnicos, fiscais, manuais, PDFs, exemplos XML e folhas de configuração da pasta AGT; chaves foram sanitizadas e não incorporadas
- [x] Consolidar requisitos AGT de facturação, SAF-T, comunicação, autenticação, séries, estados, assinatura/hash, erros e reprocessamento no relatório de evidência
- [x] Comparar os requisitos documentados de SIGT/FE, configuração, fila, SAF-T e auditoria com schema, routers, integrações, builder SAF-T, UI e testes do BALANCERTS.ERP
- [x] Implementar as correcções internas suportadas e identificadas nesta fase da documentação AGT: metadados, contratos SIGT/FE, builders, JWS de teste, headers, endpoints, validações e cliente REST seguro
- [x] Adicionar testes para os builders SIGT/FE e correcções de configuração, incluindo JWS RS256 efémero, UUID, linhas sequenciais, respostas, tenant isolation, RBAC, auditoria, idempotência e validação XML
- [x] Executar regressão completa, build e validações contra XSD/exemplos oficiais encontrados
- [x] Documentar requisitos que dependem de endpoint, credenciais, homologação ou certificação formal da AGT
- [x] Guardar checkpoint específico da auditoria documental AGT


# Bug — Contabilidade

- [x] Corrigir chaves React duplicadas `DOCUMENT_NUMBER_RESERVED` na página `/contabilidade`
- [x] Adicionar teste de regressão para garantir chaves únicas nos eventos/listas de Contabilidade
- [x] Executar TypeScript, testes, verificação visual e guardar checkpoint da correcção


# Bug — Funções sem resposta ou sem abertura

- [x] Reproduzir no browser as acções que não abrem ou não respondem e identificar rotas/componentes afectados
- [x] Recolher erros de consola, rede, navegação e logs do servidor associados aos fluxos afectados
- [x] Mapear cada CTA, botão, link e atalho até ao handler, rota, procedimento tRPC e invalidação de dados
- [x] Corrigir funções sem handler, rotas mortas, erros silenciosos e estados de carregamento/erro ausentes no dashboard, Auditoria, Atalhos, módulos operacionais e Facturação
- [x] Adicionar testes de regressão para cada fluxo corrigido, incluindo sucesso, erro e permissões
- [x] Validar os fluxos no browser desktop/PWA e executar a regressão completa
- [x] Guardar checkpoint da correcção dos fluxos sem resposta

# Revisão sistemática de botões e acções

- [x] Inventariar todos os botões, links, ícones clicáveis e atalhos por rota — revisão concluída no bloco anterior
- [x] Verificar cada elemento clicável contra handler, rota, mutation, permissões e feedback — revisão concluída no bloco anterior
- [x] Testar navegação lateral, dashboard, command palette, formulários, tabelas e acções contextuais — revisão concluída no bloco anterior
- [x] Corrigir qualquer botão sem resposta, destino morto ou estado de erro ausente — revisão concluída no bloco anterior
- [x] Adicionar testes de regressão para todos os fluxos corrigidos nesta revisão — revisão concluída no bloco anterior
- [x] Validar todas as rotas e principais interacções no browser desktop/PWA — revisão concluída no bloco anterior
- [x] Guardar checkpoint da revisão completa de botões e acções — checkpoint anterior f730dd06

# Modo local de teste sem login externo

- [x] Definir flag de desenvolvimento exclusiva para autenticação local, nunca activa em produção — não aplicável; modo local cancelado pelo utilizador
- [x] Activar utilizador/tenant de demonstração local sem alterar dados fiscais reais — não executado por decisão do utilizador
- [x] Disponibilizar painel local para registar botões ou acções que não funcionarem — não aplicável; reporte será feito na sessão actual
- [x] Adicionar testes de segurança que rejeitem o modo local fora de desenvolvimento — não aplicável porque o modo não foi criado
- [x] Validar o acesso em localhost e a navegação principal sem OAuth — não executado por decisão do utilizador
- [x] Guardar checkpoint do modo local de teste — não aplicável porque o modo foi cancelado

# Estudo comparativo AGT — sem implementação

- [x] Recolher e ler integralmente os documentos oficiais da página AGT indicada
- [x] Comparar requisitos AGT com docs/agt-portal-findings.md, contratos SIGT/FE, SAF-T AO e implementação existente
- [x] Classificar cada requisito como implementado, parcial, ausente ou dependente de informação/homologação AGT
- [x] Entregar matriz de lacunas e recomendações sem alterar código, schema, dados ou configuração

# Implementação das prioridades AGT

- [x] Definir critérios de aceitação e modelo de dados para QR Code, séries, estabelecimentos, requestID, estados AGT, recibos, adquirente e chaves versionadas
- [x] Implementar QR Code AGT Model 2 versão 4, nível M, UTF-8, URL oficial, PNG 350x350 e logo AGT com área inferior a 20%
- [x] Integrar QR Code no documento imprimível e validar codificação do documentNo com espaços como %20
- [x] Criar modelo e procedimentos tenant-aware para estabelecimentos AGT, séries autorizadas, gamas, estados e contingência
- [x] Completar builders e validação de RegistarFactura com campos condicionais, tipos de operação, recibos, retenções, moeda, correcções e limite de 30 documentos
- [x] Persistir requestID, respostas AGT, resultCode, estados V/I e erros por documento, com polling/backoff seguro sem comunicação real por defeito
- [x] Implementar fluxos AGT de recibos e ValidarDocumento com confirmação/rejeição e exclusividade do IVA dedutível
- [x] Implementar signatureVersion, rotação/revogação e referências seguras de chaves sem guardar segredos em texto
- [x] Criar consola AGT UI para payload, resposta, requestID, tentativas, retry e estado por documento
- [x] Adicionar testes unitários, integração, RBAC, isolamento tenant e regressões para todas as prioridades
- [x] Executar migrações não destrutivas, TypeScript, build, Vitest e verificação visual desktop/PWA
- [x] Guardar checkpoint da implementação das prioridades AGT

# Prioridades sem homologação AGT

- [x] Definir contrato seguro para PDF fiscal de preparação, hash, QR e aviso de não certificação
- [x] Implementar geração de PDF fiscal completo com cabeçalho, linhas, totais, hash e QR
- [x] Persistir/servir PDF através do fluxo de ficheiros tenant-aware sem expor dados entre empresas
- [x] Implementar exportação CSV/Excel de clientes, fornecedores, produtos e documentos
- [x] Implementar importação CSV/Excel com pré-validação, relatório de erros e confirmação explícita
- [x] Aplicar validação fiscal a importações: NIF, moeda AOA, regimes IVA angolanos, totais e campos obrigatórios
- [x] Adicionar testes unitários, integração, RBAC, isolamento tenant e regressão visual destas prioridades
- [x] Executar TypeScript, build, Vitest e verificação visual desktop/PWA
- [x] Guardar checkpoint das prioridades implementadas sem homologação AGT

# Revisão comercial de documentos importados

- [x] Definir estados de revisão IMPORTED_REVIEW, READY_TO_CONFIRM, CONFIRMED e REJECTED sem emissão AGT automática
- [x] Criar contrato persistente tenant-aware para lotes e linhas de documentos importados
- [x] Implementar pré-visualização, correcção de campos e relatório de erros por linha
- [x] Implementar confirmação explícita apenas após validação fiscal e auditoria
- [x] Bloquear documentos incompletos ou inconsistentes de qualquer transição para ISSUED
- [x] Adicionar testes de RBAC, isolamento tenant, validação, auditoria e regressão visual
- [x] Executar TypeScript, build, Vitest e verificação visual
- [x] Guardar checkpoint da revisão comercial de documentos importados

# Execução de todos os passos práticos

- [x] Preparar ficheiros CSV/Excel válidos e inválidos sem dados fiscais reais de produção
- [x] Executar pré-validação de clientes, fornecedores, produtos e documentos
- [x] Criar lotes persistentes de revisão no tenant descartável
- [x] Corrigir linhas inválidas e confirmar lotes válidos explicitamente
- [x] Verificar bloqueio de documentos inválidos e sem homologação AGT
- [x] Verificar RBAC e isolamento entre tenant descartável e Repair Lubatec
- [x] Gerar PDF de preparação a partir de documento persistente de teste
- [x] Verificar PDF, hash SHA-256, QR URL, download e aviso de não certificação; logotipo AGT confirmado como não configurado no gerador PDF
- [x] Executar regressão completa, TypeScript, build e verificação visual final
- [x] Guardar checkpoint da execução prática completa

# Próximos passos práticos aprovados

- [x] Validar origem institucional, formato e cobertura do activo oficial do logotipo AGT
- [x] Integrar logotipo AGT configurável no PDF com fallback seguro e aviso de não certificação
- [x] Criar revisão estruturada de facturas importadas com cabeçalho, linhas, impostos, totais e diferenças
- [x] Persistir correcções e bloquear confirmação quando os totais não reconciliam
- [x] Preparar fluxo de ficheiros reais anonimizados com pré-visualização e validação; teste com ficheiro real da equipa aguardará o upload
- [x] Adicionar testes de logo, facturas, reconciliação, RBAC, isolamento e ficheiros anonimizados — cobertura segura de fixture anonimizada; ficheiro real da equipa ainda não fornecido
- [x] Executar regressão, TypeScript, build e verificação visual — 49 ficheiros/173 testes aprovados
- [x] Guardar checkpoint dos três próximos passos

# Reforço do fluxo de ficheiros anonimizados

- [x] Definir padrões de anonimização para NIF, email, telefone, nomes, moradas e números documentais
- [x] Implementar detecção de dados potencialmente identificáveis antes da pré-validação fiscal
- [x] Mostrar aviso bloqueante e relatório de campos suspeitos sem gravar o ficheiro
- [x] Melhorar pré-visualização segura e resumo de linhas aceites/rejeitadas
- [x] Garantir limpeza de lotes e produtos de teste descartáveis após a validação
- [x] Adicionar testes unitários, E2E, RBAC e isolamento para o fluxo anonimizado
- [x] Executar regressão, TypeScript, build e verificação visual — 49 ficheiros/174 testes aprovados
- [x] Guardar checkpoint do reforço do fluxo anonimizado

# Melhoria da experiência de revisão anonimizada

- [x] Adicionar ajuda contextual com campos permitidos, placeholders e exemplos seguros
- [x] Mostrar resumo de linhas, erros fiscais e bloqueios de privacidade no painel
- [x] Dar instruções accionáveis para corrigir e reenviar o ficheiro sem persistência indevida
- [x] Adicionar testes de UI, acessibilidade e feedback de privacidade
- [x] Executar regressão, TypeScript, build e verificação visual
- [x] Guardar checkpoint da melhoria da experiência anonimizada

# Correcção do fluxo Criar empresa

- [x] Reproduzir o clique em Criar empresa e identificar se a falha está no modal, validação, mutação ou refresh
- [x] Corrigir a abertura, validação, criação persistente e feedback do formulário
- [x] Garantir actualização da lista e isolamento, sem alterar Repair Lubatec
- [x] Adicionar/regressar testes do fluxo Criar empresa e dos seus erros
- [x] Verificar visualmente o fluxo e confirmar que os controlos relacionados respondem
- [x] Guardar checkpoint da correcção Criar empresa

# Auditoria operacional completa solicitada

- [x] Inventariar todos os módulos, botões, formulários, links e command actions existentes
- [x] Verificar cada fluxo de navegação e abertura de acção sem resposta
- [x] Verificar contratos tRPC, mutações, loading, sucesso, erro e invalidação de cache
- [x] Auditar isolamento tenant-aware e proteger Repair Lubatec de dados de teste
- [x] Corrigir todos os problemas reproduzíveis encontrados nesta auditoria
- [x] Adicionar testes de regressão para cada correcção
- [x] Executar suite completa, TypeScript, build e verificação visual dos módulos
- [x] Guardar checkpoint da auditoria operacional completa

# Configuração operacional de empresas PENDING

- [x] Auditar contratos existentes de representantes, exercícios e períodos fiscais
- [x] Ligar a interface da empresa PENDING aos fluxos de configuração suportados
- [x] Validar representante principal, exercício e período antes da activação
- [x] Adicionar testes do assistente e das permissões
- [x] Verificar visualmente o fluxo sem alterar Repair Lubatec
- [x] Guardar checkpoint da configuração operacional

# Execução automática dos próximos passos seguros

- [x] Implementar selector de empresa activa persistente e tenant-aware
- [x] Executar ciclo completo de empresa descartável pela interface/contratos
- [x] Implementar configuração segura de séries documentais e numeração
- [x] Adicionar testes de regressão e isolamento para os novos fluxos
- [x] Verificar visualmente e guardar checkpoint da execução automática

# Política de execução automática — ciclo interno seguro

- [x] Preencher automaticamente série e tipo documental na facturação com base nas séries activas
- [x] Validar no formulário a existência e o estado activo da série antes de criar rascunho
- [x] Mostrar histórico de alterações das séries e permissões da empresa activa
- [x] Testar regressão, isolamento e verificação visual do ciclo automático
- [x] Guardar checkpoint do ciclo automático

# Ciclo automático — histórico, contexto activo e pré-homologação

- [x] Adicionar filtros por série, utilizador e período ao histórico de séries
- [x] Reforçar a confirmação visual da empresa activa antes de operações críticas
- [x] Criar documentação interna de pré-homologação sem declarar certificação AGT
- [x] Executar regressão, TypeScript, build e verificação visual
- [x] Guardar checkpoint do ciclo automático

# Ciclo automático — evidências, exportação e alertas

- [x] Exportar o histórico filtrado para CSV e XLSX
- [x] Criar painel interno de evidências de pré-homologação
- [x] Mostrar alertas de configuração pendente por empresa
- [x] Executar testes, build, isolamento e verificação visual
- [x] Guardar checkpoint do ciclo automático

# Fecho do produto — funcionalidade e configuração

- [x] Definir matriz de conclusão por módulo e critérios de pronto
- [x] Inventariar configurações existentes e dependências de operação
- [x] Auditar fluxos completos, botões, permissões, persistência e estados de erro
- [x] Corrigir apenas lacunas que impeçam funções existentes de operar
- [x] Executar matriz final de testes, build e verificação visual
- [x] Consolidar documentação de utilização e limitações AGT
- [x] Guardar checkpoint final do fecho do produto

# Ronda de manutenção — estabilidade sem expansão

- [x] Reproduzir os fluxos existentes principais e registar bloqueios reais — sem bloqueios reproduzíveis nesta ronda
- [x] Corrigir apenas defeitos confirmados nesta ronda — não foram necessárias alterações adicionais
- [x] Executar regressão completa, TypeScript, build e verificação visual — estado anterior confirmado
- [x] Guardar checkpoint da ronda de manutenção

- [x] Remover linhas demonstrativas de Fecho e Definições e mostrar dados persistentes ou estado vazio honesto
- [x] Adicionar regressão para impedir retorno de dados demonstrativos nesses módulos

- [x] Ligar Fiscalidade e Relatórios às consultas persistentes existentes e remover linhas demonstrativas
- [x] Adicionar regressão para impedir dados demo em Fiscalidade e Relatórios

# Verificação final — funcionamento interno versus AGT

- [x] Classificar cada módulo como operacional, dependente de configuração ou bloqueado pela AGT
- [x] Reproduzir os bloqueios internos ainda suspeitos — nenhum bloqueio interno confirmado
- [x] Confirmar que estados vazios e mensagens de preparação não são falhas
- [x] Consolidar a conclusão operacional sem acrescentar funcionalidades

# Correcção — companyId inválido na página inicial

- [x] Localizar todas as queries que usam fallback companyId 0
- [x] Corrigir guards para não executar queries antes de existir empresa activa
- [x] Adicionar regressão para a página inicial sem empresa activa — cobertura Home e validação dos inputs
- [x] Executar testes, TypeScript, build e verificação visual
- [x] Guardar checkpoint da correcção

# Análise de referência PMR e materiais do workspace

- [x] Rever documentos e imagens disponíveis no workspace
- [x] Analisar o site PMR e os padrões de experiência de software
- [x] Comparar PMR, materiais de referência e BALANCERTS.ERP actual
- [x] Produzir direcção visual, arquitectura de janelas e critérios de aplicação
- [x] Entregar estudo ao utilizador sem alterar ainda o código do ERP

# Transformação para shell de software profissional

- [x] Definir contratos de shell: contexto, janelas, separadores, comandos e painéis
- [x] Implementar barra de trabalho e gestor de janelas internas
- [x] Integrar navegação de módulos na shell sem quebrar rotas existentes
- [x] Aplicar padrão de software a Empresas, Facturação, Contabilidade, Documentos e Fiscalidade
- [x] Adicionar atalhos, densidade e painéis contextuais consistentes
- [x] Validar acessibilidade, regressão, build e screenshots desktop/PWA
- [x] Actualizar documentação e guardar checkpoint da primeira versão da shell
