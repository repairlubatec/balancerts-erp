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

# Revisão visual desktop inspirada no PMR

- [x] Reavaliar imagens do PMR no workspace e converter observações em critérios visuais verificáveis
- [x] Remover a composição dominante de dashboard web e cartões espaçosos
- [x] Criar moldura de aplicação desktop com menu, toolbar, statusbar e área de trabalho
- [x] Redesenhar grelhas e módulos prioritários com densidade e painéis operacionais
- [x] Rever janelas internas, menus e estados de foco para Windows/macOS
- [x] Validar a linguagem desktop no PWA e em viewport móvel
- [x] Executar regressão, screenshots comparativos, documentação e checkpoint

# Padrão PMR melhorado

- [x] Mapear a anatomia visual PMR para equivalências BALANCERTS.ERP
- [x] Reorganizar navegação em módulos, submódulos e contexto operacional
- [x] Aplicar estrutura PMR melhorada a grelhas, toolbars, formulários e painéis
- [x] Criar estados de janela, detalhe, comandos e densidade coerentes
- [x] Validar a linguagem visual em desktop e PWA sem regressões
- [x] Documentar o padrão PMR melhorado e guardar checkpoint

# Uniformização PMR em todas as camadas

- [x] Inventariar componentes visuais e definir tokens PMR globais
- [x] Uniformizar shell, navegação, separadores e barras de comandos
- [x] Uniformizar módulos, grelhas, formulários, painéis e estados
- [x] Uniformizar diálogos, menus, alertas, relatórios, auditoria e detalhes
- [x] Adaptar a linguagem ao PWA e acessibilidade
- [x] Executar regressão total, verificação visual e documentação
- [x] Guardar checkpoint da uniformização completa

# Auditoria visual Windows/macOS Desktop

- [x] Inventariar todas as rotas e componentes que podem parecer web
- [x] Comparar Overview, módulos, modais, menus, login, estados e PWA com critérios desktop
- [x] Corrigir desvios visuais confirmados sem alterar lógica de negócio
- [x] Validar rotas desktop/PWA, acessibilidade, testes e build
- [x] Documentar achados e guardar checkpoint da auditoria

# Auditoria funcional completa

- [x] Inventariar rotas, comandos, queries, mutações e estados funcionais
- [x] Executar testes automatizados e verificações de runtime por área
- [x] Reproduzir fluxos funcionais no browser e classificar bloqueios
- [x] Corrigir defeitos internos confirmados e adicionar regressões
- [x] Executar regressão final, build, isolamento e verificação visual
- [x] Documentar funções operacionais, bloqueios e correcções
- [x] Guardar checkpoint da auditoria funcional

# Distribuição desktop Windows/macOS

- [x] Avaliar arquitectura actual e estratégia de empacotamento desktop
- [x] Preparar runtime, identidade e shell desktop
- [x] Configurar targets EXE, MSI e DMG com build reproduzível
- [x] Testar funcionalidade interna e classificar limitações de plataforma
- [x] Documentar assinatura, distribuição e separação da homologação AGT
- [x] Guardar checkpoint da preparação desktop

# Reteste dos ficheiros no Google Drive

- [x] Confirmar ficheiros e metadados na pasta Drive
- [x] Descarregar e verificar integridade dos ZIP guardados
- [x] Executar smoke test do wrapper Electron recuperado
- [x] Reexecutar TypeScript, suite e build do ERP
- [x] Documentar resultado e limitações nativas

# Correcção — resposta HTML no tRPC de Empresas

- [x] Inspeccionar logs, endpoint tRPC e configuração do cliente
- [x] Reproduzir o erro na página Empresas e localizar a causa
- [x] Corrigir endpoint ou configuração e adicionar regressão
- [x] Validar Empresas, suite completa, build e isolamento tenant-aware
- [x] Documentar a correcção e guardar checkpoint

# Revisão — 29 erros reportados durante utilização

- [x] Recolher e classificar erros do runtime, consola, rede e servidor
- [x] Reproduzir as falhas nos módulos principais e distinguir erros reais de warnings de HMR/autenticação
- [x] Separar helpers da command palette de Home.tsx para eliminar avisos de Fast Refresh repetidos
- [x] Corrigir tratamento de erros tRPC UNAUTHORIZED para evitar spam de 401 e redireccionamentos duplicados
- [x] Adicionar testes para helpers de Home e reconhecimento de erros tRPC de autenticação
- [x] Validar suite completa, TypeScript, build e revisão visual desktop
- [x] Documentar a revisão e guardar checkpoint

# Refinamento — experiência Windows-first

- [x] Auditar shell, comandos, botões e comportamento de separadores para Windows
- [x] Melhorar moldura de aplicação, barra de comandos, estados de foco e hierarquia visual
- [x] Tornar o comportamento de múltiplas janelas/separadores mais claro e consistente
- [x] Preservar PWA e validar responsividade sem degradar a experiência desktop
- [x] Executar testes e revisão visual dos principais módulos
- [x] Documentar alterações e guardar checkpoint

# Auditoria comercial completa — fluxos sem pontos mortos

- [x] Inventariar todos os botões, comandos, links, menus, separadores e rotas
- [x] Verificar que cada acção tem destino ou operação real e feedback de sucesso/erro
- [x] Auditar criação/edição de empresas e configuração da Repair Lubatec ponta a ponta
- [x] Auditar documentos, facturação, séries, clientes, fornecedores, tesouraria, stock e imobilizado
- [x] Auditar contabilidade, fiscalidade, relatórios, fecho, auditoria e definições
- [x] Corrigir todos os pontos mortos e maus direccionamentos encontrados
- [x] Consolidar a experiência Windows-first e a lógica de múltiplas janelas
- [x] Criar regressões para cada fluxo corrigido e executar validação completa
- [x] Documentar o estado comercial real, limitações AGT e guardar checkpoint

# Auditoria zero-erros — pedido do utilizador

- [x] Recolher erros actuais do runtime, browser, rede e servidor
- [x] Reproduzir cada falha real e separar bloqueios externos de erros internos
- [x] Corrigir as causas raiz e adicionar regressões
- [x] Validar suite, TypeScript, build, rotas principais e PWA sem erros
- [x] Documentar o resultado e guardar checkpoint zero-erros

# Análise profunda módulo por módulo — diagnóstico sem implementação

- [x] Inventariar rotas, módulos, toolbars, formulários e acções visíveis
- [x] Mapear queries, mutações, tabelas, tenant isolation e RBAC por módulo
- [x] Comparar fluxos ponta a ponta e estados de loading, vazio, erro e sucesso
- [x] Conferir cobertura de testes e lacunas de aceitação manual
- [x] Classificar lacunas por severidade, impacto comercial e dependência AGT
- [x] Entregar relatório detalhado sem alterar o código funcional

# Auditoria de botões e alinhamento — diagnóstico sem implementação

- [x] Inventariar botões, comandos, menus, ícones clicáveis e links por rota
- [x] Verificar handler, destino, mutação, permissões e feedback de cada acção
- [x] Verificar estados disabled, loading, erro e sucesso dos comandos
- [x] Rever alinhamento, espaçamento, overflow, foco e hit-area em Windows/PWA
- [x] Classificar acções sem resposta, mal direccionadas e desalinhadas
- [x] Entregar relatório sem alterar funcionalidades

# Avaliação do que falta — design e funcionalidade

- [x] Sintetizar o estado actual do design Windows/PWA e das funções operacionais
- [x] Separar lacunas de design, operação, fiscalidade, segurança e distribuição
- [x] Priorizar o trabalho restante por impacto comercial e dependência externa
- [x] Entregar avaliação objectiva sem implementar alterações

# Implementação P0 confirmada pelo utilizador

- [x] Definir contratos e critérios de aceitação para Facturação, Documentos, Contabilidade, Tesouraria, Fecho e SAF-T
- [x] Completar ciclo de Facturação/Documentos: ficha, linhas, impostos, série, estados e reflexo contabilístico
- [x] Criar posto operacional de Contabilidade com lançamento, validação, publicação, diário e reversão
- [x] Criar posto operacional de Tesouraria com recebimentos, pagamentos, ligação documental e reconciliação
- [x] Implementar fecho transaccional de período com bloqueio, evidência e reabertura autorizada
- [x] Corrigir readiness SAF-T para contagens e validações persistentes reais
- [x] Adicionar testes unitários, integração e E2E autenticados dos fluxos P0
- [x] Rever visualmente, documentar limites AGT e guardar checkpoint

# Continuação — validação documental e distribuição Windows

- [x] Definir critérios de aceitação para o ciclo Repair Lubatec: rascunho, validação, emissão, contabilização e anulação
- [x] Executar validação ponta a ponta sem inserir dados fiscais fictícios
- [x] Corrigir falhas encontradas e adicionar regressões
- [x] Reforçar configurações reais de séries, contas e feedback operacional
- [x] Rever pacote e pipeline Windows EXE/MSI
- [x] Validar, documentar e guardar checkpoint

# Nova implementação — reforço do ciclo documental e configurações

- [x] Auditar lacunas accionáveis do ciclo documental e configurações
- [x] Implementar melhorias funcionais prioritárias
- [x] Reforçar feedback, validações e configurações reais
- [x] Executar testes, revisão visual e smoke test Windows
- [x] Documentar alterações e guardar checkpoint

# Configuração controlada Repair Lubatec — conta, série e documento de teste

- [x] Verificar empresas, contas, séries, clientes e produtos já persistentes
- [x] Evitar inventar IBAN, número bancário, cliente, produto ou preço fiscal
- [x] Criar ou corrigir conta operacional apenas com dados permitidos
- [x] Criar ou corrigir série FT sem duplicar configuração existente
- [x] Executar documento de teste sem submissão AGT
- [x] Validar auditoria, isolamento, testes e guardar checkpoint

# Execução controlada — 18/08/2026

- [x] Confirmar Repair Lubatec activa, READY, AOA e regime EXCLUSAO
- [x] Criar conta de tesouraria CASH "Caixa operacional Repair Lubatec" em AOA sem inventar número bancário
- [x] Criar ou confirmar série documental FT/FT com próximo número 1 e auditoria
- [x] Criar contraparte anonimizada "Cliente Teste Interno" com taxId ANON e email anon@example.invalid
- [x] Criar rascunho FT/000001 de 1.000 AOA, regime EXCLUSAO, sem submissão AGT
- [x] Validar FT/000001 e emitir internamente via transições auditadas
- [x] Validar contabilização do FT/000001: bloqueada correctamente por DOCUMENT_REQUIRES_POSTED_ENTRY antes da carga PGC; documento não foi contabilizado nem comunicado
- [x] Carregar núcleo PGC operacional da Repair Lubatec: 12 contas hierárquicas, incluindo clientes, caixa e prestações de serviço, com vigência desde 2023-09; comunicação AGT continua desligada

# Auditoria PMR e shell Windows Desktop — nova execução

- [x] Inventariar todos os materiais PMR disponíveis no Drive/workspace e o estado actual do shell
- [x] Comparar módulos e serviços PMR com os módulos reais do BALANCERTS.ERP
- [x] Documentar lacunas funcionais, pontos mortos e diferenças de experiência desktop
- [x] Implementar shell de janelas sobrepostas/ancoradas com minimizar, maximizar, restaurar, fechar e foco real
- [x] Implementar barra de tarefas/janela activa e menu Janela funcional
- [x] Melhorar o aspecto Windows Desktop sem remover PWA, acessibilidade ou densidade PMR
- [x] Implementar a lacuna funcional prioritária seleccionada: Centro de Tarefas PMR com pendências reais, estados persistentes e encaminhamento accionável; restantes produtos PMR ficam documentados como extensões de escopo
- [x] Rever testes Vitest, TypeScript, build e screenshots desktop/PWA
- [x] Guardar checkpoint da auditoria e implementação

# Auditoria linguística 360 — português integral

- [x] Inventariar termos visíveis em inglês na interface, estados, mensagens, menus, tabelas, exportações e documentação apresentada ao utilizador
- [x] Separar identificadores técnicos internos que não devem ser traduzidos no código ou na base de dados
- [x] Criar mapa consistente de tradução para estados, acções, módulos, mensagens e validações
- [x] Corrigir ocorrências visíveis em inglês sem quebrar contratos tRPC, auditoria ou SAF-T
- [x] Validar pesquisa global, módulos, estados, exportações e mensagens de erro em português
- [x] Rever testes, TypeScript, build e screenshots
- [x] Documentar a auditoria e guardar checkpoint

# Revisão funcional de botões e reconciliação

- [x] Inventariar botões, menus, acções, handlers, rotas e procedimentos tRPC
- [x] Testar acções críticas, incluindo filtros, pesquisa, criação, edição, exportação, navegação e fecho
- [x] Localizar todos os pontos mortos, acções decorativas e estados sem operação; não foram encontrados handlers vazios; foram corrigidos links de paginação hash
- [x] Implementar reconciliação operacional de movimentos Por reconciliar, com auditoria e permissões
- [x] Corrigir feedbacks, destinos, estados de carregamento e mensagens de erro das acções
- [x] Validar todos os fluxos com testes, TypeScript, build e verificação visual
- [x] Documentar resultados e guardar checkpoint

# Janelas desktop e referências da Tesouraria

- [x] Localizar e eliminar diálogos `window.prompt`, `window.alert` e confirmações do navegador nos fluxos operacionais
- [x] Criar janela interna de confirmação com moldura Windows, foco, validação e botões portugueses
- [x] Integrar a janela interna na reconciliação de movimentos
- [x] Substituir referências técnicas como ui-payment por descrição portuguesa na interface
- [x] Preservar identificadores técnicos apenas na auditoria e nos contratos internos
- [x] Validar acessibilidade, testes, TypeScript, build e screenshots
- [x] Documentar e guardar checkpoint

# Garantia final — janelas internas e português integral

- [x] Confirmar ausência de window.prompt, window.alert, window.confirm e diálogos nativos do navegador no frontend
- [x] Pesquisar termos ingleses visíveis em componentes, páginas, menus, estados, mensagens, exportações e documentação apresentada
- [x] Corrigir ocorrências visíveis encontradas sem alterar códigos técnicos internos
- [x] Validar janelas internas, acessibilidade, testes, TypeScript, build e screenshots
- [x] Documentar garantia final e guardar checkpoint

# Continuação automática após garantia de idioma e janelas

- [x] Auditar lacunas funcionais restantes nos módulos e no shell Windows; identificada e corrigida exposição técnica no módulo Auditoria
- [x] Seleccionar e implementar a próxima melhoria prioritária com dados reais e sem placeholders: normalização de entidades e correlações do trilho de Auditoria
- [x] Validar todos os fluxos críticos, idioma português e ausência de pop-ups web
- [x] Rever testes, TypeScript, build e experiência desktop/PWA
- [x] Documentar a continuação e guardar checkpoint

# Continuação — Arquivo digital P1
- [x] Criar metadados de arquivo digital com classificação, descrição, referência e versionamento
- [x] Implementar consultas tenant-aware de pesquisa e detalhe do arquivo
- [x] Implementar mutações de classificação, permissões e novas versões com auditoria
- [x] Criar interface desktop do arquivo dentro do módulo Documentos
- [x] Adicionar testes de persistência, isolamento, ACL, versionamento e apresentação portuguesa
- [x] Validar TypeScript, build, testes e experiência visual; documentar e guardar checkpoint

# Continuação — Visualizador PDF interno P1
- [x] Auditar o fluxo actual de preparação e abertura de PDFs
- [x] Criar janela interna de visualização PDF sem target blank nem pop-up do navegador
- [x] Ligar a visualização a documentos e ficheiros com validação de acesso
- [x] Adicionar controlos desktop para fechar, maximizar, zoom e download controlado
- [x] Adicionar testes de fluxo, permissões, idioma e ausência de abertura externa
- [x] Validar TypeScript, build, testes e screenshot; documentar e guardar checkpoint
- [x] Corrigir a política de mutações críticas para incluir as operações do arquivo digital

# Continuação — Compras e encomendas P1
- [x] Auditar fornecedores, produtos, documentos e permissões existentes
- [x] Criar encomendas de compra e linhas persistentes com estados controlados
- [x] Expor consultas e mutações tenant-aware com auditoria e idempotência
- [x] Integrar o posto de compras no shell desktop e na navegação em português
- [x] Adicionar testes de ciclo, permissões, isolamento e transições
- [x] Validar base de dados, TypeScript, build, testes e experiência visual; documentar e guardar checkpoint
- [x] Actualizar as expectativas do teste da matriz crítica para incluir compras.create e compras.transition

# Continuação — Recepção de stock ligada a compras P1
- [x] Auditar linhas de encomendas, produtos e movimentos de stock existentes
- [x] Criar recepções persistentes com quantidades parciais e diferenças controladas
- [x] Expor mutação tenant-aware com permissões, idempotência e auditoria
- [x] Integrar recepção no posto Compras e no módulo Stock
- [x] Adicionar testes de ciclo, limites de quantidade, isolamento e apresentação portuguesa
- [x] Validar migração, TypeScript, build, suite completa e revisão visual; documentar e guardar checkpoint

# Continuação — Conversão de recepção em documento de fornecedor P1
- [x] Auditar criação de documentos de fornecedor e dados das recepções
- [x] Implementar conversão controlada para rascunho de documento de fornecedor
- [x] Garantir idempotência, origem, isolamento e auditoria sem emissão automática
- [x] Integrar o comando no posto Compras em português
- [x] Adicionar testes de RBAC, origem, duplicação e preservação de estados
- [x] Validar TypeScript, build, suite completa e revisão visual; documentar e guardar checkpoint
- [x] Actualizar as expectativas da matriz pendente para purchases.convertToSupplierDraft

# Continuação — Balancerts IA Fase 1
- [x] Definir contrato modular IAProvider e tarefas suportadas
- [x] Implementar LocalAIProvider, AzureAIProvider e OpenAIProvider sem credenciais expostas
- [x] Implementar roteador offline-first e estado de ligação sem bloquear o ERP
- [x] Criar persistência tenant-aware de configurações não secretas e logs mínimos
- [x] Integrar menu, dashboard, estado e definições Balancerts IA no shell desktop
- [x] Adicionar permissões, testes, desactivação segura e apresentação 100% portuguesa
- [x] Validar TypeScript, build, suite completa, revisão visual e documentar a Fase 1
- [x] Corrigir o estado do roteador para não consultar providers desactivados
- [x] Corrigir termos visíveis cloud, Provider e Offline no módulo Balancerts IA

# Continuação — Classificação documental assistida Balancerts IA
- [x] Auditar documentos, importação e campos seguros para classificação
- [x] Criar sugestões persistentes com confiança, origem e estado de revisão
- [x] Implementar classificação assistida sem alterar documentos automaticamente
- [x] Criar centro desktop de revisão, aprovação e rejeição humana
- [x] Adicionar permissões, auditoria, isolamento e testes de segurança
- [x] Validar idioma, ausência de efeitos fiscais, TypeScript, build e suite completa; documentar e guardar checkpoint

# Continuação — Roadmap Balancerts IA ampliado
- [x] Adicionar filtros por confiança, estado, provider e período no centro de revisão
- [x] Implementar preenchimento assistido de rascunhos sem aplicação automática
- [x] Adicionar teste controlado do provider IA local
- [x] Validar segurança, auditoria, isolamento, idioma e regressões do roadmap
- [x] Documentar o roadmap ampliado e guardar checkpoint
- [x] Corrigir a sintaxe do payload de preenchimento assistido e repetir a validação
- [x] Ajustar o teste de preenchimento assistido para um perfil com permissão de validação

# Continuação — Minhas Empresas e Empresas completos
- [x] Auditar todos os botões, menus, pesquisas, filtros, rotas e contratos dos módulos
- [x] Completar backend de criação, edição, activação, configuração e detalhe de empresas
- [x] Completar selecção da empresa activa e encaminhamento operacional
- [x] Implementar feedback interno desktop para sucesso, erro e validação
- [x] Adicionar testes de fluxos, RBAC, isolamento, auditoria e idioma português
- [x] Validar visualmente e funcionalmente os dois módulos; documentar e guardar checkpoint
- [x] Corrigir os contratos da janela de edição de empresa e voltar a validar TypeScript
- [x] Tornar a janela de edição compatível com contextos de teste sem companies.update
- [x] Corrigir a importação React da janela de edição e repetir os testes dos módulos
- [x] Ligar documentos por validar, obrigações pendentes e prontidão fiscal a dados persistentes no overview
- [x] Tornar o filtro de empresas autorizadas funcional por estado e pesquisa
- [x] Tornar a consulta de prontidão fiscal compatível com mocks de teste sem perder a consulta real
- [x] Proteger o cálculo de documentos pendentes quando o relatório fiscal de teste não tem entries

# Continuação — Exercício e empresa nos módulos financeiros
- [x] Criar selector de exercício com calendário interno para Contabilidade e Tesouraria
- [x] Criar janela interna de escolha entre todas as empresas autorizadas
- [x] Aplicar empresa e exercício seleccionados às consultas e mutações reais dos dois módulos
- [x] Implementar avanço sequencial por Enter em todos os formulários financeiros relevantes
- [x] Cobrir os fluxos com testes de empresa, exercício, Enter, RBAC, isolamento e feedback
- [x] Validar visualmente Contabilidade e Tesouraria e guardar checkpoint
- [x] Adicionar o período fiscal ao contrato do painel de Tesouraria e ao movimento persistente
- [x] Corrigir importações do handler de Enter após a separação do utilitário

# Ampliação — Posto completo de Contabilidade
- [x] Inventariar lacunas do posto contabilístico actual contra operações reais de uma empresa angolana
- [x] Rever e documentar a base PGCA, a necessidade de versionamento e os limites de actualização oficial
- [x] Implementar manutenção inicial do plano de contas por empresa com hierarquia, vigência, lançabilidade e auditoria
- [x] Ligar Diário, Balancete, Resultados e Balanço ao período fiscal; completar extractos e exportação ainda pendentes
- [x] Completar lançamento manual com documentos, centros de custo, dimensões e validações
- [x] Implementar importação de movimentos com revisão, pré-validação e idempotência
- [x] Completar apuramento operacional e encerramento auditado; regularizações/reclassificações avançadas permanecem como operações futuras específicas
- [x] Ligar ferramentas contabilísticas à auditoria, permissões, aprovação e histórico imutável
- [x] Validar o posto contabilístico ampliado com testes, revisão visual e checkpoint final
- [x] Corrigir o import de mensagens do novo posto contabilístico e integrar o painel na Contabilidade
- [x] Tornar o painel do plano de contas compatível com mocks antigos e repetir os testes de Contabilidade
- [x] Actualizar o teste do lançamento para seleccionar contas PGCA pelos rótulos acessíveis
- [x] Corrigir compatibilidade da rota de rastreabilidade sem periodId e repetir a suite completa
- [x] Corrigir o import do rótulo português no painel de apuramento e validar o fecho
- [x] Substituir o selector nativo de ficheiro da importação por controlo visual português sem termos do navegador

# Auditoria profunda — Contabilidade e Tesouraria no mercado angolano
- [x] Inventariar funções, rotas, tabelas, permissões e testes actuais de Contabilidade e Tesouraria
- [x] Rever os documentos do Google Drive e os materiais oficiais já fornecidos
- [x] Pesquisar legislação, regulamentos e orientações oficiais angolanas aplicáveis
- [x] Comparar requisitos de mercado angolano com as capacidades implementadas
- [x] Classificar lacunas por obrigatório, comercialmente necessário, recomendado e dependente de AGT/bancos
- [x] Produzir relatório técnico com fontes, evidências, riscos, prioridades e limites de conformidade

# Implementação P0 — Contabilidade e Tesouraria Angola
- [x] Criar sub-registo fiscal por operação, regime, imposto, retenção e período
- [x] Criar workflow contabilístico rascunho, validação, aprovação, publicação e reversão com segregação
- [x] Tornar o fecho materialmente validado no servidor, com bloqueios reais
- [x] Completar cadastro bancário com banco, agência, identificadores e conta contabilística
- [x] Criar importação persistente de extractos bancários com hash, linhas e idempotência
- [x] Criar reconciliação por linha e actualização auditada; diferenças/fecho global permanecem na próxima parte P0
- [x] Completar ciclo de pagamento com preparação, aprovação, execução e comprovativo; confirmação externa continua dependente de banco
- [x] Implementar transferências internas entre contas com duas pernas atómicas
- [x] Ligar sub-registo fiscal e extractos aos painéis desktop e ao contexto empresa/período
- [x] Rever visualmente e guardar checkpoint P0 final
- [x] Corrigir import duplicado de hashing no servidor antes das operações P0
- [x] Corrigir a tipagem das linhas do extracto no painel de Tesouraria P0
- [x] Criar testes específicos do parser de extractos e dos contratos P0
- [x] Corrigir a tipagem dos registos fiscais no painel P0
- [x] Corrigir a edição do fluxo de pagamento com aprovação obrigatória usando contexto exclusivo
- [x] Persistir cashAccountId nos pagamentos para executar aprovação sem perder a conta de destino
- [x] Corrigir a tipagem dos lançamentos pendentes no painel de revisão contabilística
- [x] Ligar a opção de aprovação obrigatória ao formulário desktop de pagamentos
- [x] Traduzir o estado visual External Pendente do sub-registo fiscal
- [x] Implementar reconciliação com diferenças, ajustes autorizados e motivo obrigatório
- [x] Implementar confirmação auditada de execução de pagamentos por comprovativo e estado
- [x] Implementar calendário interno de obrigações fiscais por empresa e período
- [x] Criar testes de integração para ajustes de reconciliação, confirmação de pagamentos e obrigações fiscais
- [x] Rever visualmente as novas janelas desktop e guardar checkpoint das prioridades P0
- [x] Inventariar e fechar todas as prioridades P0 e P1 ainda pendentes
- [x] Completar operações financeiras e fiscais pendentes com persistência, RBAC e auditoria
- [x] Implementar prioridades P1 contabilísticas: saldos iniciais, regularizações avançadas e relatórios analíticos
- [x] Integrar todas as operações nos módulos desktop sem pontos mortos ou termos em inglês
- [x] Executar suite integral, revisão visual e validação de regressões antes do checkpoint consolidado
- [x] Auditar critérios de fecho de Contabilidade e Tesouraria antes de avançar
- [x] Completar validação, aprovação, publicação e bloqueio de saldos iniciais
- [x] Completar validação, aprovação, publicação e bloqueio de regularizações
- [x] Preparar adaptador de execução bancária externa sem comunicação real
- [x] Preparar adaptador AGT sem submissão ou alegação de homologação
- [x] Testar e guardar checkpoint do ciclo final financeiro
- [x] Verificar fluxos financeiros críticos, permissões, isolamento e pontos mortos
- [x] Executar validação funcional e visual final dos módulos financeiros
- [x] Confirmar prontidão do módulo financeiro para avanço ao Comercial
- [x] Separar melhorias financeiras não bloqueadoras das dependências externas
- [x] Inventariar lacunas do módulo Comercial e requisitos AGT/MINFIN aplicáveis
- [x] Completar clientes, fornecedores, produtos/serviços, preços e condições comerciais
- [x] Completar documentos comerciais, séries, numeração, impostos, correcções e estados
- [x] Integrar Comercial com Stock, Tesouraria, Contabilidade, arquivo e auditoria
- [x] Preparar SAF-T, AGT/MINFIN, permissões e validações sem submissão real
- [x] Executar suite Comercial, revisão visual e guardar checkpoint
- [x] Corrigir a rota /comercial que apresenta janela não encontrada
- [x] Auditar numeração sequencial por empresa, série, tipo e exercício
- [x] Validar concorrência, idempotência, lacunas, anulações e reinício por exercício
- [x] Auditar conformidade Comercial de ponta a ponta antes de avançar
- [x] Implementar Enter como avanço para o campo seguinte em todos os formulários
- [x] Preservar submissão explícita, botões, caixas multilinha e controlos especiais
- [x] Criar testes de teclado e validar todos os módulos operacionais
- [x] Inventariar lacunas do módulo Operações e requisitos de stock/armazém
- [x] Completar catálogo operacional, armazéns, movimentos e valorização
- [x] Implementar inventários, transferências, lotes/seriais quando aplicável e recepções
- [x] Integrar Operações com Compras, Comercial, Contabilidade e Tesouraria
- [x] Reforçar permissões, auditoria, relatórios e navegação Operações
- [x] Executar suite Operações, revisão visual e guardar checkpoint
- [x] Verificar lacunas internas em cadastros, documentos, impostos, liquidações e integrações
- [x] Confirmar ausência de pontos mortos, termos em inglês e janelas fora do shell
- [x] Corrigir e testar eventuais falhas de numeração antes do checkpoint

## Operações — etapa de armazéns, transferências e recepções

- [x] Integrar formulário desktop de Stock para registar entradas e saídas por período e armazém
- [x] Integrar criação persistente de armazéns com auditoria e isolamento por empresa
- [x] Integrar transferência atómica entre armazéns com movimentos de saída e entrada auditáveis
- [x] Impedir transferências acima do stock disponível na origem
- [x] Reforçar idempotência e detectar transferências incompletas
- [x] Expor e apresentar saldos valorizados por armazém e artigo em AOA
- [x] Ligar recepções de compras ao armazém seleccionado e aos movimentos de entrada
- [x] Validar TypeScript e testes de Operações, Inventário e Compras
- [x] Implementar contagem física persistente com aprovação e ajuste auditado
- [x] Rever visualmente o posto Stock autenticado e concluir testes de integração do ciclo completo

## Módulo Controlo — nova etapa

- [x] Inventariar Fiscalidade, Relatórios, Fecho, Centro de Tarefas e Auditoria
- [x] Completar validações fiscais, prontidão AGT e calendário de obrigações sem submissão externa
- [x] Completar relatórios persistentes, filtros, reconciliação e rastreabilidade
- [x] Completar checklist de fecho, reabertura auditada e tarefas accionáveis
- [x] Completar centro de auditoria com filtros, detalhe e exportação controlada
- [x] Rever RBAC, isolamento, idioma português e navegação desktop no módulo Controlo
- [x] Executar suite integral, revisão visual e guardar checkpoint do módulo Controlo

## Balancerts IA e Definições — nova etapa

- [x] Inventariar os painéis, procedimentos e estados actuais de Balancerts IA e Definições
- [x] Completar configuração persistente e estado do provider Balancerts IA
- [x] Completar sugestões, revisão humana, preenchimento assistido e auditoria sem aplicação automática
- [x] Completar Definições com destinos operacionais, normas, séries, permissões e integrações preparadas
- [x] Rever RBAC, isolamento, idioma português e navegação desktop nos dois postos
- [x] Executar suite integral, revisão visual e guardar checkpoint dos dois postos

## IA gratuita local — etapa de testes

- [x] Preparar integração opcional com Ollama para testes locais
- [x] Validar configuração do endereço, porta e modelo local no Balancerts IA
- [x] Garantir que classificação e preenchimento assistido permanecem propostas sujeitas a revisão humana
- [x] Garantir privacidade, ausência de envio para a nuvem e funcionamento offline
- [x] Executar testes, revisão visual e guardar checkpoint da solução local
- [x] Documentar a instalação e utilização no Windows sem activar providers pagos

## Automação da IA local — continuação

- [x] Criar diagnóstico automático do provider local no posto Balancerts IA
- [x] Preparar configuração inicial segura para Ollama sem activar providers pagos
- [x] Mostrar instruções accionáveis quando Ollama não estiver instalado ou disponível
- [x] Validar fallback offline, privacidade e revisão humana obrigatória
- [x] Executar suite final e guardar checkpoint da automação local

## Endurecimento técnico pós-auditoria

- [x] Criar memberships por organização com função, estado e permissões
- [x] Aplicar o scope de membership às consultas e mutações tenant-aware
- [x] Adicionar integridade relacional crítica de memberships sem destruir dados
- [x] Reforçar headers HTTP, limites de pedidos, rate limiting e observabilidade
- [x] Criar estratégia documentada de backup, restauro e verificação
- [x] Acrescentar e validar cobertura de integração dos fluxos críticos de empresa, documentos, pagamentos, stock, fecho e auditoria
- [x] Remover o warning persistente da configuração pnpm e rever os formulários genéricos do shell
- [x] Validar o fluxo Electron e a configuração dos alvos Windows/macOS através do empacotamento desktop Linux no sandbox

## Continuação pós-auditoria — melhoria autónoma

- [x] Rever lacunas de operação, segurança, desempenho, documentação e distribuição após o checkpoint técnico
- [x] Melhorar gestão de memberships por organização, funções, estados, auditoria e permissões administrativas
- [x] Melhorar diagnóstico de ambiente e prontidão operacional no posto Definições
- [x] Expandir monitorização, health checks e tratamento de erros operacionais
- [x] Expandir testes de fluxos críticos e validação de empacotamento desktop
- [x] Rever interface desktop, acessibilidade, idioma e desempenho de carregamento
- [x] Executar validação integral e guardar checkpoint da ronda de melhorias

## Continuação autónoma — nova ronda

- [x] Rever prioridades ainda abertas de permissões, operação, desempenho e distribuição
- [x] Melhorar gestão de funções e acessos por organização sem quebrar tenants existentes
- [x] Melhorar prontidão desktop, diagnóstico e documentação de instalação
- [x] Optimizar carregamento dos módulos e reduzir o bundle inicial
- [x] Expandir testes de aceitação e segurança dos fluxos críticos
- [x] Executar validação integral e guardar checkpoint da nova ronda

## Continuação autónoma — acessos e distribuição

- [x] Definir permissões granulares por módulo e acção para memberships
- [x] Integrar a função efectiva no controlo operacional e na auditoria administrativa
- [x] Melhorar diagnóstico de produção, métricas e alertas
- [x] Optimizar carregamento e exportações do shell desktop
- [x] Reforçar validação dos pacotes EXE, MSI e DMG
- [x] Executar suite integral, revisão visual e guardar checkpoint

## Módulo RH — colaboradores, contratos e salários

- [x] Definir modelo tenant-aware de colaboradores, contratos e regras remuneratórias
- [x] Implementar persistência e ciclo de vida de colaboradores e contratos
- [x] Implementar processamento salarial versionado com IRT e Segurança Social parametrizados
- [x] Integrar mapas salariais e recibos internos; registar ligação contabilística auditável preparada, sem posting automático
- [x] Integrar o posto RH no shell desktop em português
- [x] Adicionar testes de isolamento tenant-aware, RBAC RH, cálculo, arredondamento e protecção de estados; posting/imutabilidade contabilística permanece bloqueado por desenho
- [x] Rever visualmente, executar suite/build e guardar checkpoint do módulo RH

## RH — aprovação, mapas e ligação contabilística

- [x] Implementar estados de aprovação e fecho mensal imutável da folha
- [x] Adicionar mapas salariais e recibos internos consultáveis; impressão formal permanece deliberadamente interna
- [x] Preparar lançamento contabilístico opcional após aprovação, sem execução automática
- [x] Adicionar testes de cálculo, arredondamento, RBAC e segregação; transições são protegidas por estado e auditoria
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — exportação, recibos e notificações

- [x] Adicionar exportação CSV/XLSX dos mapas salariais
- [x] Adicionar recibo interno imprimível por colaborador e período
- [x] Adicionar notificações internas de folhas pendentes
- [x] Testar exportação, impressão, isolamento e estados pendentes através da suite, TypeScript e validação tenant-aware
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — recibo estruturado, filtros e tarefas

- [x] Estruturar recibo interno com cabeçalho da empresa e conferência
- [x] Adicionar filtros por ano, mês, estado e colaborador nos mapas
- [x] Ligar folhas pendentes a tarefas accionáveis do Centro de Tarefas
- [x] Testar filtros, recibo, isolamento e navegação para tarefas
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — conferência, responsáveis e ligação contabilística

- [x] Adicionar assinatura de conferência e histórico do recibo interno
- [x] Persistir responsável opcional e prazo das tarefas RH; atribuição manual permanece para refinamento seguinte
- [x] Configurar contas contabilísticas de salários por empresa
- [x] Testar segregação, histórico de conferência e preparação contabilística através da suite, TypeScript e revisão visual; prazos persistentes permanecem pendentes
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — gestão de tarefas e aprovação contabilística

- [x] Adicionar mutations para responsável, prazo e estado das tarefas RH
- [x] Integrar edição de tarefas no Centro de Tarefas com RBAC
- [x] Preparar pedido de lançamento contabilístico com aprovação dupla, sem posting automático
- [x] Validar segregação, transições e tenant isolation através da suite integral e TypeScript
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — atribuição e lançamento contabilístico opcional

- [x] Adicionar selector de utilizadores para responsável da tarefa RH
- [x] Reforçar bloqueio contra auto-aprovação e acesso entre empresas
- [x] Preparar lançamento contabilístico opcional validado e aprovado, sem posting automático
- [x] Adicionar teste dedicado contra auto-aprovação e validar isolamento através da suite tenant-aware
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — diário salarial opcional

- [x] Definir contas, linhas e equilíbrio do diário salarial
- [x] Implementar geração validada do diário com revisão contabilística
- [x] Implementar aprovação final separada e bloqueio após publicação
- [x] Integrar auditoria, origem da folha e prevenção de duplicados
- [x] Adicionar testes de equilíbrio, permissões, idempotência e auto-aprovação
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — rastreabilidade e exportação do diário

- [x] Mostrar responsáveis, conferente e aprovador no detalhe da folha
- [x] Ligar o diário salarial ao Centro de Auditoria
- [x] Exportar linhas do diário em CSV/XLSX
- [x] Testar exportação, rastreabilidade e isolamento
- [x] Executar suite/build, rever visualmente e guardar checkpoint

## RH — recibo interno em PDF

- [x] Preparar conteúdo do recibo interno com cabeçalho, período e aviso de uso interno
- [x] Incluir remuneração, Segurança Social, IRT, outros descontos e líquido
- [x] Incluir campo de conferência e espaços para assinatura
- [x] Implementar impressão PDF sem popup do navegador, usando janela interna de impressão do sistema
- [x] Validar idioma, dados apresentados, impressão e suite de testes
- [x] Executar build, rever visualmente e guardar checkpoint

## RH — actores e datas da folha

- [x] Mapear responsável pelo cálculo, conferente e aprovador persistidos
- [x] Expor nomes e datas no detalhe da folha
- [x] Distinguir claramente estados sem actor ou data registados
- [x] Testar a apresentação e a segregação de funções
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — tarefas RH manuais

- [x] Definir prioridade e campos da tarefa manual
- [x] Implementar criação tenant-aware com responsável activo opcional
- [x] Registar auditoria da criação e alterações subsequentes
- [x] Integrar formulário de criação no Centro de Tarefas
- [x] Testar isolamento, permissões, responsável e prazo
- [x] Executar build, rever visualmente e guardar checkpoint

## RH — logótipo oficial no recibo PDF

- [ ] Localizar e confirmar o activo oficial da Repair Lubatec
- [x] Preparar o logótipo para cabeçalho sem perda de legibilidade
- [x] Integrar o logótipo no recibo interno PDF com fallback sem imagem
- [x] Validar associação da empresa, impressão e testes
- [x] Executar build, rever visualmente e guardar checkpoint

## RH — recibo individual por colaborador

- [x] Adicionar selecção de colaborador no detalhe da folha
- [x] Alternar entre mapa colectivo e recibo individual
- [x] Garantir que totais e dados do PDF correspondem ao colaborador seleccionado
- [x] Testar selecção, impressão e preservação do mapa colectivo
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — identificação de responsáveis

- [x] Devolver nomes e emails dos responsáveis nas tarefas RH com isolamento por empresa
- [x] Apresentar responsável e criador na listagem do Centro de Tarefas
- [x] Testar autorização, isolamento e estados sem responsável
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — filtros operacionais

- [x] Adicionar filtro por prioridade e estado
- [x] Adicionar filtro por responsável
- [x] Adicionar filtro por prazo e tarefas vencidas
- [x] Testar combinação de filtros e isolamento por empresa
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — ligação à auditoria

- [x] Adicionar acesso directo ao histórico de auditoria de cada tarefa RH
- [x] Preservar escopo por empresa e parâmetros de entidade
- [x] Testar navegação e ausência de acesso cruzado
- [x] Executar build, rever visualmente e guardar checkpoint

## Revisão transversal — ronda de qualidade

- [x] Auditar termos em inglês e identificadores técnicos visíveis na interface
- [x] Auditar botões, links, rotas e acções sem resposta
- [x] Rever isolamento por empresa e validações tenant-aware nos módulos críticos
- [x] Rever erros de consola, rede, TypeScript e build
- [x] Rever visualmente as principais janelas desktop e estados vazios
- [x] Corrigir falhas confirmadas e adicionar testes
- [x] Executar validação final, rever visualmente e guardar checkpoint

## RH — pré-visualização do recibo PDF

- [x] Criar pré-visualização interna do recibo colectivo
- [x] Manter pré-visualização individual por colaborador
- [x] Exibir cabeçalho, período, valores, descontos, líquido e assinaturas
- [x] Confirmar impressão apenas depois da pré-visualização
- [x] Testar conteúdo, idioma, modo colectivo/individual e impressão
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — filtros rápidos

- [x] Criar atalhos rápidos para responsável
- [x] Criar atalhos rápidos para prioridade
- [x] Criar atalhos rápidos para estado de conclusão
- [x] Preservar combinação com filtros detalhados e actualizar contadores
- [x] Testar isolamento, idioma e experiência desktop
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — conclusão persistente

- [x] Confirmar estados aceites pelo procedimento de actualização
- [x] Alinhar o tipo do selector com Pendente, Em curso e Concluída
- [x] Garantir auditoria e filtro correcto após concluir uma tarefa
- [x] Testar, executar build, rever visualmente e guardar checkpoint

## RH — exportação colectiva de recibos

- [x] Exportar mapa colectivo filtrado para CSV
- [x] Exportar mapa colectivo filtrado para Excel
- [x] Incluir identificação, bruto, descontos, IRT e líquido
- [x] Manter PDF/ impressão e distinguir mapa colectivo de recibo individual
- [x] Testar filtros, totais, idioma e isolamento por empresa
- [x] Executar build, rever visualmente e guardar checkpoint

## RH — ZIP de recibos individuais

- [x] Definir geração PDF individual em memória para cada colaborador
- [x] Gerar ZIP com um ficheiro PDF por colaborador da folha colectiva
- [x] Integrar descarga do ZIP no posto RH
- [x] Validar nomes, conteúdo, filtros e isolamento por empresa
- [x] Executar build, rever visualmente e guardar checkpoint

## RH — gráfico de custos salariais

- [x] Definir série mensal tenant-aware a partir de folhas persistidas
- [x] Expor custos brutos, encargos patronais e total mensal
- [x] Integrar gráfico no painel principal do RH com idioma português
- [x] Adicionar estados de carregamento, vazio e erro
- [x] Testar dados, isolamento por empresa e visual desktop
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — acção em massa

- [x] Mapear estados, selecção e mutações existentes
- [x] Criar mutação tenant-aware para alterar estados em lote
- [x] Integrar selecção múltipla, estado alvo e confirmação
- [x] Preservar auditoria individual e apresentar resultado da operação
- [x] Testar autorização, isolamento, selecção e experiência visual
- [x] Executar build, rever visualmente e guardar checkpoint

## Centro de Tarefas — modal de confirmação em massa

- [x] Substituir a confirmação em linha por modal interno
- [x] Apresentar quantidade e estado alvo no modal
- [x] Garantir cancelamento sem mutação e confirmação com a mutação existente
- [x] Testar acessibilidade, cancelamento, confirmação e regressões
- [x] Rever visualmente, executar build e guardar checkpoint
