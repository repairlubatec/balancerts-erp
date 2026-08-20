# BALANCERTS.ERP — Cronologia completa do projecto

**Documento de estado do projecto**  
**Data de referência:** 20 de Agosto de 2026  
**Empresa de referência:** Repair Lubatec  
**NIF:** 5001121871  
**Âmbito:** ERP empresarial angolano, com experiência de software desktop Windows-first, PWA complementar, isolamento multi-tenant, RBAC, auditoria e preparação fiscal AGT.

## 1. Objectivo e critério de leitura

Este documento regista a evolução do BALANCERTS.ERP desde a definição inicial até ao estado actual. A cronologia distingue quatro situações que não devem ser confundidas. **Concluído** significa que a funcionalidade foi implementada no código e incorporada no fluxo do produto. **Validado** significa que recebeu testes, verificação TypeScript, build, revisão visual ou prova de integração indicada no histórico. **Preparado** significa que a arquitectura e os contratos internos estão disponíveis, mas a execução depende de dados, credenciais, serviços ou aprovação externa. **Pendente** significa que ainda requer uma acção concreta antes de poder ser considerado encerrado.

> O ERP pode estar operacional internamente sem ser, por esse motivo, certificado pela AGT, homologado pela AGT, autorizado a comunicar com serviços bancários ou pronto para distribuição pública assinada.

## 2. Visão executiva do estado actual

O núcleo funcional do BALANCERTS.ERP encontra-se desenvolvido como uma aplicação empresarial de alta densidade, com shell de software, múltiplas janelas internas, separadores, barra de menus, barra de comandos, contexto de empresa e navegação por módulos. A aplicação não depende de janelas `alert`, `prompt`, `confirm` ou pop-ups externos do navegador nos fluxos operacionais revistos.

Os principais módulos de gestão empresarial estão implementados com consultas e mutações tenant-aware, RBAC, auditoria e estados de carregamento, vazio, erro e sucesso. A Repair Lubatec foi criada e activada como empresa real do ambiente, com regime de IVA de **Exclusão**, moeda AOA, período inicial 2023/09 e sem documentos, lançamentos, movimentos de stock, colaboradores, contratos ou folhas RH persistidos no momento da última verificação.

A preparação fiscal AGT, SAF-T AO e SIGT/FE está avançada, incluindo builders, contratos, validação local, XSD de referência, QR, hash, fila idempotente e consola interna. Contudo, a comunicação efectiva, homologação e certificação formal continuam dependentes de endpoint, credenciais, chaves, códigos oficiais, testes externos e decisão da AGT.

| Área | Estado actual | Limite principal |
|---|---|---|
| Shell desktop | Implementado e validado | Empacotamento e assinatura de distribuição ainda dependem do ambiente final |
| Multi-empresa e isolamento | Implementado e testado | Nenhum limite interno conhecido na superfície validada |
| Contabilidade | Posto operacional implementado | Regularizações avançadas específicas e posting salarial final exigem validação operacional |
| Tesouraria | Operacional com reconciliação, pagamentos e transferências | Execução bancária externa depende de banco e credenciais |
| Comercial | Documentos, séries, numeração, clientes, fornecedores e artigos implementados | Comunicação AGT real depende de homologação |
| Operações | Stock, armazéns, transferências, recepções, inventário e compras implementados | Lotes/seriais dependem do caso de negócio aplicável |
| Controlo | Fiscalidade, relatórios, fecho, tarefas e auditoria implementados | Dados reais adicionais são necessários para certos testes manuais |
| RH | Colaboradores, contratos, salários, IRT/INSS, recibos e tarefas implementados | Repair Lubatec ainda não possui dados RH para teste operacional real |
| Balancerts IA | Fase local/offline e revisão humana implementadas | Providers pagos ou serviços externos não estão activos por defeito |
| AGT | Preparação técnica avançada | Não declarar certificação, homologação ou submissão real |
| Distribuição | Targets EXE, MSI e DMG preparados/documentados | Assinatura, certificados e publicação final ainda requerem ambiente e identidade do editor |

## 3. Cronologia de evolução

### 3.1. Fundação empresarial e modelo angolano

A primeira fase definiu o produto como um ERP para Angola, com foco em contabilidade, fiscalidade, gestão empresarial, auditoria e preparação AGT. Foram estabelecidos o nome **BALANCERTS.ERP**, a organização proprietária e a necessidade de suportar Windows e macOS com uma experiência semelhante à de software empresarial profissional, mantendo PWA como forma complementar de acesso.

Foi criado o modelo hierárquico **Plataforma → Organização → Empresa → Exercício → Período**, com isolamento de dados por empresa e organização. O sistema passou a distinguir administrador, contabilista, financeiro, operador e auditor, aplicando segregação de funções às operações de leitura, escrita, emissão, contabilização, fecho, ficheiros, reconciliação e auditoria.

Para a Repair Lubatec foram registados o NIF 5001121871, a morada Shopping Millennium, Loja 141, Lubango, Huíla, a actividade de prestação de serviços, a moeda AOA, o ano de criação 2023, a forma jurídica Sociedade por Quotas, os representantes Luís Jordão e Fausto Silva, com Fausto Silva como representante legal principal, e o período inicial de Setembro de 2023. O regime de IVA foi confirmado como **Exclusão**.

A empresa passou por estado pendente, validações de configuração e activação administrativa auditada para estado READY. A activação não criou documentos, lançamentos nem movimentos automaticamente.

### 3.2. Motor contabilístico, fiscal e de auditoria

Foi implementado o motor contabilístico de partidas dobradas, com validação de débito igual a crédito, conta vigente e lançável, período válido, origem, idempotência, atomicidade e imutabilidade. Foram criados fluxos de lançamento, aprovação, publicação, estorno controlado e correcção auditada, incluindo `sourceDocumentId` e `reversalOfEntryId` quando aplicável.

Foi criada a cadeia navegável **Documento → Lançamento → Conta → Relatório** e o percurso inverso. Os relatórios persistentes incluem Diário, Razão, Balancete, Demonstração de Resultados, Balanço, auxiliares, fiscais, IVA, registo fiscal, antiguidade de saldos e reconciliação da origem documental.

O motor fiscal foi parametrizado por vigência e evidência normativa. Os regimes de IVA suportados são Geral, Simplificado e Exclusão. A regra de Exclusão foi reforçada para rejeitar IVA positivo liquidado ou dedutível quando incompatível com o regime. Foram ainda parametrizados o Decreto Presidencial n.º 71/25 e as regras internas correspondentes, sempre distinguindo evidência normativa interna de validação oficial externa.

A auditoria de negócio foi separada dos logs técnicos e tornou-se append-only, com actor, organização, empresa, entidade, acção, estado anterior, estado posterior, timestamp, correlação, hash e reconstrução por empresa ou entidade. Foram criadas matrizes e testes para as mutações críticas, incluindo documentos, posting, estornos, stock, ficheiros, depreciação, empresas, pagamentos, compras, fecho e reabertura.

### 3.3. Comercial, facturação e numeração documental

O módulo Comercial evoluiu de uma superfície de cadastro para um ciclo documental com clientes, fornecedores, produtos, serviços, artigos, preços, condições comerciais, itens, impostos, pagamentos, séries e numeração sequencial por empresa, série, tipo e exercício.

Foi implementada a máquina de estados `DRAFT → VALIDATED → ISSUED → ACCOUNTED → CANCELLED`, com imutabilidade pós-emissão e bloqueios para impedir alterações indevidas em documentos emitidos, contabilizados ou anulados. Foram implementadas anulações com motivo obrigatório, notas de crédito/débito referenciadas, rectificação controlada, arquivo lógico e preservação do documento original.

A numeração foi protegida contra duplicação, concorrência, lacunas não autorizadas, reinício indevido e reserva fora do tenant. Também foram criados testes para a sequência reserva → emissão → posting e para a associação entre documento, lançamento e origem contabilística.

A Repair Lubatec recebeu uma série operacional FT/FT com próximo número 1 e foi criado um documento de teste interno FT/000001 no valor de 1.000 AOA, com contraparte anonimizada. O documento foi validado e emitido internamente, mas a contabilização foi correctamente bloqueada porque não existia lançamento publicado associado. O documento não foi comunicado à AGT.

### 3.4. Contabilidade e Tesouraria

Contabilidade e Tesouraria receberam contexto explícito de empresa activa e exercício fiscal, com selector de exercício em calendário, janela interna para escolha entre empresas autorizadas e avanço por tecla Enter nos formulários financeiros.

O posto de Contabilidade passou a incluir plano de contas por empresa, hierarquia, vigência, contas lançáveis, lançamento manual, documentos, centros de custo, dimensões, importação de movimentos com pré-validação e idempotência, diário, balancete, resultados, balanço, saldos iniciais, regularizações, reclassificações e revisão contabilística. A aprovação e o posting são separados por função e auditados.

Tesouraria passou a suportar contas de caixa e bancos, pagamentos, recebimentos, transferências internas atómicas, extractos bancários com hash e idempotência, reconciliação por linha, diferenças, ajustes autorizados, comprovativos, calendário de obrigações e estados de execução. O adaptador de execução bancária externa está preparado, mas não comunica com bancos sem credenciais e configuração autorizada.

Foram efectuados testes de fornecedor → documento emitido → lançamento publicado, fluxos bancários de saída, reconciliação persistente de saldo, pagamentos com aprovação obrigatória e transferências internas. A Repair Lubatec recebeu um núcleo inicial PGC operacional com 12 contas hierárquicas, incluindo clientes, caixa e prestação de serviços, com vigência desde Setembro de 2023.

### 3.5. Operações, Stock, Compras e arquivo digital

O módulo Operações foi completado com catálogo operacional, armazéns, entradas, saídas, movimentos persistentes, valorização em AOA, transferências atómicas, recepções de compras, contagem física, aprovação, ajustes auditados e bloqueio de transferências acima do stock disponível.

Foi criado o módulo Compras com encomendas e linhas persistentes, estados controlados, permissões, idempotência e auditoria. As recepções suportam quantidades parciais e diferenças controladas, podendo ser convertidas em rascunhos de documentos de fornecedor sem emissão automática.

O arquivo digital recebeu classificação, descrição, referência, versionamento, permissões, novas versões, consulta tenant-aware e auditoria. Foi integrado um visualizador PDF interno com fechar, maximizar, restaurar, zoom e download controlado, sem abrir nova janela do navegador nem utilizar `target="_blank"`.

### 3.6. Fiscalidade, SAF-T AO e preparação AGT

Foi realizado o levantamento documental dos materiais do Portal do Parceiro AGT e dos documentos disponíveis no espaço de trabalho. Os requisitos foram comparados com schema, routers, integrações, builders, filas, auditoria, RBAC, UI e testes.

A preparação AGT inclui configuração versionada de XSD, endpoint, autenticação, códigos oficiais e estado de homologação; configuração de estabelecimentos, séries e contingência; requestID; respostas e códigos de resultado; fila de submissão com estados `PENDING → SENT → COMPLETED/FAILED`; idempotência; timeout; retry; reprocessamento; auditoria; JWS de teste; QR Code AGT; hash; assinatura versionada; rotação e revogação de chaves; consola de pedidos; recibos; ValidarDocumento e cliente REST seguro.

Foi integrado o ficheiro oficial `SAFTAO1.01_01.xsd` como referência de validação local reproduzível. O builder XML SAF-T AO foi tornado determinístico, com Header, contas, lançamentos, documentos, escapamento e ordenação estável. A prontidão SAF-T apresenta lacunas explícitas, `submissionEligible` permanece falso enquanto faltarem entidades ou validação externa e `exportBlockedReason` distingue ausência de dados obrigatórios de validação AGT pendente.

Foram ainda implementados PDF fiscal de preparação com cabeçalho, linhas, totais, hash e QR, importação e exportação CSV/Excel com pré-validação fiscal, revisão comercial de linhas, totais e impostos, identificação de dados potencialmente pessoais e fluxo de ficheiros anonimizados. Estes documentos não devem ser apresentados como documentos certificados pela AGT.

### 3.7. Shell Windows-first e experiência de software

A interface foi transformada de uma composição semelhante a uma página web para um shell de software profissional. A estrutura actual inclui barra lateral persistente, barra de título, menus Ficheiro, Editar, Ver, Operações, Relatórios e Janela, barra de tarefas, separadores, janelas internas sobrepostas ou ancoradas, minimizar, maximizar, restaurar, fechar, foco activo, barra de estado e contexto de empresa.

A direcção visual foi baseada na análise dos materiais PMR disponíveis, mas adaptada ao BALANCERTS.ERP. Foram removidos cartões excessivamente espaçosos e padrões de landing page, reforçada a densidade informativa e normalizados toolbars, grelhas, formulários, menus, diálogos, alertas, relatórios, auditoria e estados vazios.

A revisão desktop Windows/macOS foi realizada em conjunto com a preservação PWA e acessibilidade. Foram eliminados diálogos nativos do navegador nos fluxos operacionais, incluindo `window.prompt`, `window.alert` e `window.confirm`. Os controlos internos apresentam foco, validação, cancelamento, carregamento, sucesso e erro em português.

Foram preparados targets EXE, MSI e DMG e avaliada a configuração Electron. O projecto está preparado para empacotamento, mas a distribuição final ainda exige ambiente de build correspondente, identidade do editor, assinatura de código, testes em Windows/macOS e decisão sobre publicação.

### 3.8. Balancerts IA

Foi criada a Fase 1 do Balancerts IA com contrato modular de providers, provider local, providers externos configuráveis sem credenciais expostas, roteamento offline-first, estado de ligação, configuração não secreta tenant-aware, logs mínimos, permissões, desactivação segura e integração no shell.

A classificação documental assistida cria sugestões com confiança, origem e estado de revisão, sem alterar documentos automaticamente. O preenchimento assistido de rascunhos permanece sujeito a revisão e aprovação humana. Foram adicionados filtros por confiança, estado, provider e período, diagnóstico de Ollama, instruções accionáveis, privacidade e funcionamento local sem envio para a nuvem quando configurado dessa forma.

### 3.9. Recursos Humanos

O módulo RH recebeu modelo tenant-aware de colaboradores, contratos e regras remuneratórias, ciclo de vida de colaboradores e contratos, processamento salarial versionado, IRT e Segurança Social parametrizados, arredondamentos, mapas salariais, recibos internos, aprovação, conferência, fecho mensal imutável e responsáveis persistidos.

Foram implementadas exportações CSV/XLSX dos mapas, recibo individual por colaborador e período, mapa colectivo, ZIP com recibos individuais, impressão PDF interna sem pop-up do navegador, pré-visualização antes de imprimir, cabeçalho, período, remuneração, Segurança Social, IRT, descontos, líquido, espaços de assinatura e exposição do nome e data do responsável, conferente e aprovador.

Foi criado o diário salarial opcional com contas, linhas, equilíbrio, revisão contabilística, aprovação final separada, bloqueio após publicação, auditoria, origem da folha, idempotência e prevenção de auto-aprovação. Por desenho, a ligação contabilística está preparada e protegida, mas o posting automático não é executado.

Foi acrescentado um gráfico de evolução dos custos salariais mensais com bruto, encargos patronais e total. O logótipo oficial da Repair Lubatec foi formalmente adiado até ser fornecido o activo real; não foi fabricada uma imagem provisória.

### 3.10. Centro de Tarefas

O Centro de Tarefas tornou-se um posto operacional RH com criação manual tenant-aware, responsável, criador, prazo, prioridade, estado, origem, empresa, auditoria e acesso ao histórico de cada tarefa. Os filtros incluem responsável, prioridade, estado, prazo, atrasadas, hoje/amanhã, sem data limite, pesquisa por título ou descrição e limpeza rápida de filtros.

A lista possui selecção múltipla, seleccionar tudo, estado parcial, contador exacto, paginação de 20 itens, ordenação por nome, prioridade e data limite, ordenação combinada por urgência operacional, indicadores de prioridade, alertas vermelhos para atrasadas e amarelos para hoje/amanhã, edição rápida de prazo, prioridade e estado, remoção de prazo e toasts com desfazer.

As acções em massa permitem alterar estado, prioridade e data limite, limpar prazos, confirmar em janela interna, registar auditoria por tarefa e desfazer alterações com validação tenant-aware e protecção contra alterações concorrentes. A lista pode ser exportada para CSV e XLSX. O histórico de notificações de urgência também pode ser consultado e exportado para Excel.

As preferências de filtros e ordenação são persistidas por utilizador e empresa. O resumo operacional apresenta contadores separados para atrasadas, hoje e amanhã. As notificações internas têm deduplicação por tarefa, intervalo, data, utilizador e empresa, histórico consultável, destinatários configuráveis por empresa e opção de dispensar avisos da sessão.

Foi criado um cenário E2E descartável para exercitar tarefas RH, alteração em massa, reversão, auditoria, permissões e isolamento. Durante esse teste foi corrigida uma falha real em junções tenant-aware. A Repair Lubatec não foi alterada pelo cenário descartável.

## 4. Bugs e correcções importantes

Foram corrigidas chaves React duplicadas na Contabilidade, queries executadas com `companyId` inválido na página inicial, respostas HTML indevidas no endpoint tRPC de Empresas, contratos da janela de edição de empresa, importações React, links de paginação, referências técnicas visíveis como `ui-payment`, termos ingleses expostos, diálogos nativos do navegador, funções sem handler, rotas sem destino, estados de erro ausentes e problemas de tipagem nos painéis financeiros, contabilísticos e RH.

Foi realizada uma ronda específica após a utilização reportar 29 erros. Os problemas foram recolhidos por runtime, consola, rede e servidor, separados entre erros reais, warnings de HMR e bloqueios de autenticação, corrigidos quando reproduzíveis e cobertos por regressões. A auditoria funcional e visual dos botões, links, menus, rotas e command actions não identificou pontos mortos internos na ronda final validada.

## 5. Validação técnica acumulada

O projecto acumulou centenas de testes unitários, de integração, E2E, RBAC, isolamento multi-tenant, concorrência, idempotência, reconciliação, recuperação, auditoria, fiscalidade, importação, exportação, UI e regressão. Os checkpoints recentes do Centro de Tarefas foram validados com suites direccionadas entre 31 e 38 testes, conforme a alteração, além da cobertura histórica mais ampla do projecto.

| Tipo de validação | Resultado registado |
|---|---|
| TypeScript | Sem erros nas validações recentes |
| Build de produção | Aprovado nas rondas recentes |
| Testes de isolamento | Consultas, mutações, ficheiros, exportações e integrações cobertos |
| RBAC | Funções críticas testadas por papel |
| Auditoria | Actor, tenant, entidade, correlação e snapshots cobertos |
| Browser desktop | Revisão visual realizada em várias rondas |
| PWA | Manifesto, instalação, responsividade e comportamento validados |
| SAF-T | Builder, namespace, versão XSD, XML e bloqueios locais validados |
| AGT real | Não executado; depende de endpoint, credenciais e homologação |
| Dados reais RH | Não executado na Repair Lubatec; não existem tarefas/folhas para o ensaio solicitado |

## 6. O que está feito, mas depende de validação externa

A integração AGT está preparada, não concluída como comunicação homologada. Ainda são necessários endpoint oficial, credenciais, número ou identificador de validação, chaves, códigos oficiais, ambiente de testes, critérios de homologação e confirmação formal da AGT. Enquanto esses elementos não forem entregues, o ERP deve manter a submissão real desactivada e apresentar o estado de preparação.

A execução bancária externa está preparada, mas depende do banco, credenciais, certificados, formato de extracto, endpoint e autorização para comunicação. Os fluxos internos de preparação, aprovação, comprovativo, reconciliação e auditoria não devem ser confundidos com execução bancária efectiva.

A distribuição Windows/macOS está preparada em termos de arquitectura e targets, mas ainda depende de empacotamento final em ambiente Windows/macOS, certificado de assinatura de código emitido para o editor correcto, testes de instalação, actualização, desinstalação, antivírus, SmartScreen/Gatekeeper e política de publicação. A assinatura de código não é certificação AGT e não prova, por si só, que um software não contém código malicioso.

## 7. O que ainda falta concluir

O único bloco documental explicitamente pendente no TODO é a própria cronologia, que este documento encerra. No produto, permanecem dependências operacionais concretas que não devem ser mascaradas como concluídas.

| Pendente | Motivo | Condição de conclusão |
|---|---|---|
| Teste real de alteração em massa RH | Repair Lubatec não tem tarefas RH persistidas | Criar pelo menos duas tarefas RH reais e executar alteração, confirmação e desfazer |
| Teste real RH → Contabilidade → Auditoria | Repair Lubatec não tem colaboradores, contratos nem folhas | Criar dados RH reais e executar o ciclo com aprovação manual |
| Posting final do diário salarial | O sistema prepara e revê, mas não publica automaticamente por desenho | Aprovação contabilística autorizada e validação do fluxo de lançamento |
| Logótipo oficial Repair Lubatec | O activo real ainda não foi fornecido | Receber PNG/SVG oficial e confirmar associação à empresa |
| Comunicação AGT | Dependente de chaves, endpoint, XSD/credenciais e homologação | Receber dados oficiais e efectuar homologação controlada |
| Execução bancária externa | Dependente de banco e credenciais | Configurar banco, certificados, endpoints e autorização de teste |
| Pacotes finais EXE/MSI/DMG | Preparados, mas falta pipeline e assinatura finais | Empacotar em ambientes alvo e testar distribuição assinada |
| Ficheiro real anonimizado da equipa | A cobertura utiliza fixtures seguras; ficheiro da equipa não foi fornecido | Receber ficheiro anonimizado e executar pré-validação controlada |

## 8. Critérios para declarar o produto pronto para comercialização

Antes da comercialização, deverá ser concluído um ciclo de aceitação com uma empresa de teste autorizada. Esse ciclo deve cobrir criação de utilizadores e memberships, configuração de empresa, série e plano de contas, cliente, fornecedor, artigo, documento comercial, validação, emissão, posting aprovado, recibo, pagamento, reconciliação, fecho, reabertura auditada, relatório, exportação e recuperação após falha.

Deverá também ser produzida uma matriz de evidência que diferencie testes internos, testes com dados reais anonimizados, validação local SAF-T, homologação técnica AGT e certificação formal AGT. Nenhum material comercial deverá chamar o ERP de certificado AGT enquanto essa decisão não for emitida pela própria AGT.

Para a distribuição Windows, deverá ser gerado um instalador assinado, acompanhado de versão, soma de verificação, notas de versão, política de actualização, política de suporte, instruções de restauro e procedimento de resposta a incidentes. A distribuição macOS deverá ser verificada separadamente quanto a assinatura, notarização e permissões do sistema.

## 9. Conclusão

O BALANCERTS.ERP deixou de ser apenas um protótipo de ecrãs e evoluiu para uma plataforma ERP empresarial com shell desktop, módulos financeiros, comerciais, operacionais, RH, controlo, auditoria, IA local e preparação fiscal AGT. A base interna encontra-se desenvolvida e amplamente validada, com isolamento por empresa, RBAC, auditoria e estados operacionais.

O estado correcto para apresentação a um cliente é: **produto interno funcional e preparado para implantação controlada, com integração AGT e distribuição assinada ainda dependentes de validações externas, credenciais, activos e dados de aceitação**. O próximo marco operacional real é criar dados RH autorizados na Repair Lubatec e executar o ensaio de alteração em massa, desfazer e fluxo RH → Contabilidade → Auditoria.

---

## Anexo — resumo cronológico por ordem de prioridade

| Ordem | Marco | Resultado |
|---:|---|---|
| 1 | Fundação multi-tenant e empresa Repair Lubatec | Implementado e validado |
| 2 | Motor contabilístico, fiscal e auditoria | Implementado e testado |
| 3 | Comercial, facturação e numeração | Implementado e testado |
| 4 | Contabilidade e Tesouraria | Implementado; bancos externos preparados |
| 5 | Operações, Compras, Stock e arquivo | Implementado e testado |
| 6 | SAF-T, QR, hash e preparação AGT | Preparado; homologação externa pendente |
| 7 | Shell Windows-first e múltiplas janelas | Implementado e revisto visualmente |
| 8 | Balancerts IA e provider local | Implementado em modo controlado/offline |
| 9 | RH, salários, IRT/INSS e recibos | Implementado; posting final opcional protegido |
| 10 | Centro de Tarefas e acções em massa | Implementado, auditado e exportável |
| 11 | Exportações CSV/XLSX e auditoria | Implementado e validado |
| 12 | Teste operacional real RH | Adiado por ausência de dados reais |
| 13 | Certificação/homologação AGT | Dependente exclusivamente da AGT |
| 14 | Distribuição final assinada | Preparada; pipeline e identidade final pendentes |
