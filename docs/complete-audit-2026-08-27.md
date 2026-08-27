# Auditoria completa do BALANCERTS.ERP

**Data:** 27 de Agosto de 2026  
**Versão auditada:** `a98b035c`  
**Âmbito:** arquitectura, módulos ERP, motor contabilístico/fiscal, PGCA, SAF-T, AGT, base de dados, segurança, desktop/PWA, testes, build, logs e documentação.  
**Método:** revisão de código e contratos tRPC, leitura do schema Drizzle, consultas read-only à base de dados, suite integral, build de produção, preflight de integrações e verificação visual dos módulos principais.

## 1. Conclusão executiva

O projecto está tecnicamente estável como **protótipo operacional controlado**, com uma arquitectura full-stack real, autenticação, RBAC, persistência TiDB/MySQL, auditoria, módulos de contabilidade, tesouraria, facturação, compras, stock, imobilizado, fiscalidade, SAF-T e preparação desktop. A suite e o build passam, e os fluxos visuais principais carregam depois da recuperação do preview.

Contudo, **a aplicação ainda não está pronta para produção fiscal oficial nem para aceitação externa**. O bloqueio principal não é um erro escondido: é deliberado e correcto. O plano `PGCA-82-01` permanece `UNDER_REVIEW`, existem **0 regras contabilísticas activas**, não há movimentos elegíveis para uma simulação integrada de cálculo/posting, a comunicação AGT está desactivada e faltam homologação, credenciais e ambiente externo bancário. Activar estas partes sem concluir o circuito de regras, fontes, aprovação humana e testes seria inseguro e contrário ao desenho fail-closed.

## 2. Matriz de estado

| Área | Estado | Evidência | Consequência |
|---|---|---|---|
| Aplicação web/PWA | **Implementada e operacional em ambiente de preview** | Rotas, autenticação, layout desktop e módulos carregaram | Ainda falta aceitação formal em vários fluxos e validação em browsers/dispositivos alvo |
| Contabilidade | **Parcial / protegida** | Workbench, plano, simulação, relatórios e posting têm guards | Posting PGCA produtivo fica bloqueado sem versão activa e regras elegíveis |
| PGCA | **Confirmado na estrutura, não activo** | 792 contas persistentes, todas `CONFIRMED`; versão `UNDER_REVIEW` | Não pode ser usado como plano produtivo até transição auditada |
| Regras operacionais | **Não concluído** | 0 linhas activas em `accountingRules`; seis modelos continuam `DRAFT_ONLY` | Compras, vendas, stock, tesouraria, salários e imobilizado não têm posting automático produtivo |
| REPORT_ONLY | **Implementado e validado** | Exportação local apresenta XSD/semântica, hash e submissão `false` | Serve para preparação/diagnóstico; não substitui ciclo integrado com dados elegíveis |
| SAF-T AO | **Estrutural implementado; semântico implementado; integração produtiva pendente** | XSD e validador semântico cobertos por testes | Não há submissão oficial nem prova de aceitação AGT |
| Fiscalidade | **Parcial e fail-closed** | IVA, II, IRT, IP, IS e CEC catalogados com estados e guardes | Parâmetros de referência não equivalem a taxas/regras produtivas completas |
| Facturação | **Funcional em preview, dependente de configuração** | Série FT, rascunho, linhas, cliente e documento persistente visíveis | É necessário período fiscal seleccionado, série aplicável e circuito de validação/PGCA |
| Tesouraria | **Funcional em preview, posting bloqueado** | Movimentos, reconciliação, aprovação e importação visíveis | Pré-validação indica “PGCA activo necessário”; reconciliação externa bancária pendente |
| AGT | **Preparação local בלבד / não homologado** | Consola de fila e estados; comunicação real explicitamente desactivada | Não existe submissão oficial, endpoint/credenciais ou aceitação AGT comprovada |
| Bancos | **Não disponível em ambiente externo** | Preflight indica documentação, ambiente de testes e credenciais em falta | Não há integração bancária real |
| Desktop Windows/macOS | **Código preparado, distribuição não pronta** | Electron/electron-builder presentes; preflight sem `BALANCERTS_DESKTOP_URL`, `CSC_LINK`, `CSC_KEY_PASSWORD` | Não há instalador Windows/MSI assinado nem artefacto macOS assinado/notarizado auditado |
| Backup/restauro | **Preparado para validação isolada** | Preflight: `PRONTO_PARA_VALIDACAO_ISOLADA`, sem contacto de rede | Ainda é necessária execução/aceitação do restauro isolado e verificação de integridade |
| Base de dados | **Persistente e acessível, com dados de teste** | TiDB responde; existem movimentos/documentos da Repair Lubatec | Os dados existentes não demonstram readiness global nem devem ser tratados como dados de produção |
| Suite/build | **Aprovados** | 156 ficheiros e 636 testes; build concluído | Há aviso de chunks grandes, não bloqueante |
| Logs/preview | **Recuperável, com incidente transitório observado** | Facturação ficou inicialmente indisponível; reinício recuperou; houve `request aborted` | Deve ser monitorizado antes de aceitar como disponibilidade de produção |

## 3. Evidência da base de dados

A consulta foi exclusivamente de leitura. O estado observado foi:

| Tabela/entidade | Contagem/estado observado |
|---|---:|
| `pgcVersions` | 1 versão: `PGCA-82-01`, `UNDER_REVIEW` |
| `pgcAccounts` | 792, todas `CONFIRMED` |
| `pgcSources` | 10, todas `CONFIRMED` |
| `accountingRules` | 0 regras activas; a tabela não contém cobertura produtiva elegível |
| `normativeSources` | 0 registos persistidos |
| `journalEntries` / `journalLines` | 1 / 2 |
| `businessDocuments` | 2 |
| `fiscalTaxRecords` | 0 |
| `agtIntegrationConfigs` | 0 |
| `agtSubmissions` | 0 |

### Achado de consistência normativa

O catálogo normativo principal existe em código (`server/normative.ts`), enquanto a tabela persistente `normativeSources` apresentou zero linhas. Isto **não prova uma falha**, porque a arquitectura pode intencionalmente usar catálogo versionado em código para a referência normativa. Porém, é uma lacuna de rastreabilidade que deve ser decidida antes da produção: ou o catálogo em código é formalmente a fonte imutável e auditada, ou as fontes utilizadas por cada activação devem ser persistidas e ligadas à regra/versão activada.

## 4. Auditoria funcional por módulo

### 4.1 Contabilidade e PGCA

A interface de contabilidade carrega empresa, exercício, período, operações, tesouraria, terceiros, fiscal, existências, activos, fecho e consultas. O código possui guards de versão activa, contas lançáveis, natureza confirmada, equilíbrio e permissões. O problema actual é de **readiness**, não de ausência de interface: o plano ainda não transitou para activo e não existem regras de movimentação produtivas.

Os seis modelos operacionais estão disponíveis apenas como `DRAFT_ONLY`. A matriz não pode, por si só, escolher contas, taxas ou contrapartidas. Permanecem por concluir a associação de cada operação a contas lançáveis PGCA, documento, condição fiscal, vigência, fonte e aprovação humana.

### 4.2 Tesouraria

O módulo carregou com movimentos persistentes, reconciliação, aprovação de pagamentos, importação de extractos e criação de movimento. A pré-validação mostrou `Bloqueada`, com `Débito: Não definido`, `Crédito: Não definido` e `PGCA activo necessário`. Este comportamento é **esperado e correcto** enquanto não houver versão PGCA activa e regras aprovadas.

Há dados persistentes da empresa de teste Repair Lubatec. Estes dados não constituem prova de que o ERP esteja pronto para qualquer empresa e devem ser separados da aceitação global.

### 4.3 Facturação e documentos

Depois do reinício do preview, o módulo carregou com série `FT`, reserva de numeração, cliente, linhas, IVA/regime, rascunho, histórico e um documento persistente emitido de 104 900 AOA. O formulário apresentou também “Nenhuma série documental activa” quando o contexto não tinha período seleccionado, apesar de existir série configurada. Classificação: **funcional, mas dependente de contexto/configuração**.

A aceitação deve verificar explicitamente: selecção de exercício/período, série correcta, transições `DRAFT → VALIDATED → ISSUED → ACCOUNTED`, anulação justificada, impostos, reflexo contabilístico bloqueado quando aplicável e não duplicação de numeração.

### 4.4 Fiscalidade e SAF-T

O motor distingue fontes normativas, parâmetros de referência, medidas OGE/CEC, regras contabilísticas e readiness. A validação SAF-T cobre moeda AOA, período, contas, contas lançáveis, equilíbrio de débitos/créditos, datas, numeração, totais e coerência básica do IVA. O modo `REPORT_ONLY` expõe inconsistências sem permitir submissão externa.

O que ainda não funciona como operação oficial é a cadeia completa **documento/movimento persistente elegível → cálculo fiscal → posting com regra activa → SAF-T final → validação integrada → submissão AGT**. Essa cadeia está bloqueada de propósito.

### 4.5 AGT

A consola mostra fila, requestID, resposta, estados e reprocessamento interno. O próprio texto da interface afirma que a comunicação real permanece desactivada. O preflight confirma falta de endpoint, credenciais e resultado oficial de homologação. Logo, qualquer texto de “Preparação AGT” não deve ser interpretado como submissão real ou certificação.

### 4.6 Bancos

Não existe ambiente bancário oficial, documentação de integração, credenciais ou testes externos. A reconciliação local e importação de extractos não equivalem a integração bancária.

### 4.7 Desktop Windows/macOS

Existe uma base Electron com `contextIsolation`, `nodeIntegration: false`, sandbox, controlo de URLs externas e electron-builder para NSIS/MSI, DMG e ZIP. Contudo, o preflight confirma:

- `BALANCERTS_DESKTOP_URL` ausente para empacotamento;
- `CSC_LINK` ausente;
- `CSC_KEY_PASSWORD` ausente;
- assinatura Windows pendente;
- não existe artefacto Windows/MSI assinado auditado;
- não existe artefacto macOS assinado/notarizado auditado.

Existe um artefacto Linux em `release/`, mas ele não prova que os instaladores Windows/macOS existam ou estejam prontos.

## 5. Segurança e controlo de acesso

O sistema usa autenticação, `protectedProcedure`, `adminProcedure` e um `roleProcedure` com módulo/permissão. As operações sensíveis devem ainda aplicar o escopo empresa/organização; existe função de verificação de empresas autorizadas e várias operações de dados filtram empresa/organização.

A chave privada AGT não é aceite como material PEM pelo servidor (`AGT_PRIVATE_KEY_MATERIAL_FORBIDDEN`) e os eventos de auditoria mascaram a referência privada. No entanto, o modelo ainda aceita e persiste um campo `privateKeyReference`. Antes da produção, deve ser formalizado que esse campo só pode conter uma referência a um gestor seguro de segredos, nunca caminho local, token, conteúdo de chave ou credencial reutilizável. A protecção actual é boa como barreira inicial, mas não substitui um secret store e rotação controlada.

A auditoria append-only e os hashes de eventos estão presentes no desenho e nos dados observados. A aceitação deve testar tentativas de alteração, acesso cruzado entre organizações, alteração de estados sem permissão e reprocessamento idempotente.

## 6. Qualidade técnica

A execução independente mais recente concluiu:

- **156 ficheiros de teste passaram**;
- **636 testes passaram**;
- build Vite e bundle do servidor passaram;
- TypeScript/LSP sem erros reportados;
- o warning de chunks grandes permanece: `Home` cerca de 1 005 kB, `react-vendor` cerca de 775 kB, `Pgca` cerca de 742 kB e `spreadsheet-vendor` cerca de 429 kB após minificação.

O warning de tamanho não impede a execução, mas deve ser corrigido antes de distribuição desktop/PWA em redes lentas. A suite unitária não substitui aceitação manual de emissão fiscal, integração AGT, bancos, instaladores e restauração.

## 7. Problemas concretos encontrados

| ID | Severidade | Classificação | Problema | Acção necessária |
|---|---|---|---|---|
| AUD-001 | Crítica | **Bloqueado por desenho** | PGCA-82-01 está `UNDER_REVIEW` | Fechar evidências, validar versão e fazer transição auditada somente sem bloqueadores |
| AUD-002 | Crítica | **Não concluído** | 0 regras contabilísticas produtivas activas | Mapear seis operações a contas/eventos/fontes/vigência e obter aprovação humana |
| AUD-003 | Crítica | **Não concluído** | Não existe ciclo integrado elegível cálculo → posting → SAF-T | Criar cenário empresarial controlado após regras aprovadas e validar semântica ponta a ponta |
| AUD-004 | Crítica | **Dependente externo** | AGT não homologado, sem endpoint/credenciais/submissão real | Obter documentação, ambiente, credenciais e aceitação oficial; não simular como real |
| AUD-005 | Alta | **Dependente externo** | Bancos não configurados | Obter documentação, ambiente de testes e credenciais bancárias |
| AUD-006 | Alta | **Dependente de configuração** | Windows/macOS sem URL de distribuição e certificados | Configurar URL, certificado, password segura e executar builds verificáveis |
| AUD-007 | Alta | **Lacuna de rastreabilidade a decidir** | `normativeSources` vazio apesar do catálogo em código | Formalizar fonte canónica persistida ou política de catálogo imutável com ligação às activaçōes |
| AUD-008 | Alta | **Aceitação pendente** | Dados da Repair Lubatec misturam movimentos/documentos de teste com o ambiente | Definir dataset de aceitação, limpar/isolar dados ou criar organização de teste separada antes da produção |
| AUD-009 | Média | **Risco de segurança a endurecer** | `privateKeyReference` é persistível e depende da disciplina do chamador | Restringir a identificadores de secret store, validar formato e garantir que nunca contém segredo/caminho local |
| AUD-010 | Média | **Performance** | Chunks grandes após build | Aplicar code-splitting dos módulos pesados e medir carregamento real |
| AUD-011 | Média | **Disponibilidade de preview** | Preview ficou temporariamente indisponível e recuperou após reinício | Monitorizar, capturar métricas e repetir aceitação em ambiente estável |
| AUD-012 | Baixa/Média | **Não é falha funcional** | `baseline-browser-mapping` desactualizado no build | Actualizar dependência como manutenção técnica, sem alterar regras fiscais |

## 8. Ordem segura de correcção

### P0 — Bloqueios de produção fiscal

1. Fechar o catálogo de regras dos seis modelos operacionais, sem inventar contrapartidas.
2. Submeter cada regra a aprovação humana com fonte, vigência, natureza, contas lançáveis e condições.
3. Completar a decisão de rastreabilidade entre `server/normative.ts`, fontes persistidas e versões activadas.
4. Promover `PGCA-82-01` apenas por `UNDER_REVIEW → VALIDATED → ACTIVE`, com todos os guards satisfeitos.
5. Executar ciclo integrado em ambiente controlado: documento/movimento, cálculo, posting, relatório e SAF-T.
6. Manter submissão AGT desligada até homologação oficial e aceitação documentada.

### P1 — Operação empresarial

1. Seleccionar e validar exercícios/períodos em Facturação, Tesouraria e Contabilidade.
2. Isolar dados de teste e definir empresa/dataset de aceitação.
3. Implementar reconciliação bancária contra formato oficial quando a documentação chegar.
4. Testar fechamento real de período, reversões, anulações, idempotência e auditoria.
5. Concluir backup/restauro isolado e respectivo relatório de integridade.

### P2 — Distribuição e qualidade

1. Configurar e executar Windows NSIS/MSI e macOS DMG/ZIP com certificados reais.
2. Fazer code-splitting de `Home`, `Pgca`, React e spreadsheet vendor.
3. Aceitar os fluxos em Chrome/Edge/Firefox e em PWA instalável.
4. Testar permissões entre organizações, exportações, ficheiros e rotação de chaves.
5. Actualizar dependências de manutenção e manter regressão completa.

## 9. Veredicto

**Não foram encontrados erros de compilação ou regressões nos testes que justifiquem considerar o projecto instável. Foram encontrados bloqueios funcionais e externos que impedem, com razão, declarar o ERP pronto para produção fiscal oficial.**

O estado actual deve ser comunicado como:

> **BALANCERTS.ERP — ambiente operacional controlado, com motor fiscal e contabilístico em preparação auditada; PGCA, posting produtivo, submissão AGT, bancos e instaladores assinados ainda não aceites para produção.**

A recomendação é **não remover os bloqueios vermelhos**. O próximo avanço seguro é concluir e aprovar as regras dos seis modelos operacionais, depois executar a simulação integrada com dados elegíveis e só então iniciar a transição normativa e a homologação externa.
