# BALANCERTS.ERP — Evidência pós-restauro e matriz de aceitação

**Data:** 25 de Agosto de 2026  
**Destino:** TiDB Cloud Starter, schema `balancerts_restore`  
**Âmbito:** validação técnica não destrutiva após importação do backup real; não constitui homologação AGT nem aceitação formal.

## 1. Resultado técnico comprovado

O backup foi exportado em modo read-only, comprimido em GZIP e verificado por SHA-256 antes da importação. O restauro foi executado exclusivamente no cluster TiDB isolado, com TLS obrigatório. A produção não recebeu comandos de escrita. O schema de sistema `sys` foi rejeitado pelo próprio serviço para operações de criação; por isso, foi utilizado o schema dedicado `balancerts_restore`.

| Área | Evidência observada | Estado técnico |
|---|---|---|
| Integridade do pacote | GZIP válido e SHA-256 conforme manifesto | Confirmado |
| Destino | TiDB v8.5.3, região Frankfurt, schema dedicado | Confirmado |
| Estrutura | 96 tabelas importadas | Confirmado |
| Contabilidade | `chartAccounts`: 18; `journalEntries`: 1; `journalLines`: 2 | Confirmado |
| Organização e empresas | 1 organização; 2 empresas; 2 períodos fiscais | Confirmado |
| Documentos | 1 documento comercial | Confirmado |
| Auditoria | 14.877 eventos | Confirmado |
| Integridade referencial | Zero empresas, períodos fiscais e linhas de lançamento órfãos nas verificações seleccionadas | Confirmado |
| Rollback | Backup original e manifesto retidos separadamente | Preparado |
| Produção | Nenhuma escrita executada; o fingerprint foi usado apenas para rejeitar destino coincidente | Confirmado |

As contagens foram obtidas por consultas exactas `COUNT(*)` no destino e não por estimativas de `information_schema.table_rows`. A validação pós-restauro também confirmou a presença das tabelas essenciais `organizations`, `companies`, `fiscalPeriods`, `chartAccounts`, `journalEntries`, `journalLines`, `businessDocuments` e `auditEvents`.

## 2. Critérios para aceitação externa

| Dependência | Evidência exigida | Responsável | Estado |
|---|---|---|---|
| Homologação AGT | Endpoint oficial, credenciais de teste, versão do pacote e resultado formal | Repair Lubatec / AGT | Pendente |
| Instalação Windows | Máquina Windows limpa, instalação EXE/MSI, actualização, desinstalação e logs | Repair Lubatec | Pendente |
| Assinatura Windows | Certificado de distribuição, cadeia válida e verificação de assinatura | Repair Lubatec | Pendente |
| Integração bancária | Documentação do banco, ambiente de testes, credenciais e reconciliação controlada | Repair Lubatec / banco | Pendente |
| Aceitação operacional | Sessão autorizada, utilizadores definidos e dados controlados/anónimos | Repair Lubatec | Pendente |
| Normativa PGCA/IVA | Confirmação visual humana da fonte primária e regras elegíveis | Contabilista responsável | Pendente |
| Restauro local Docker | Computador do utilizador com Docker, volume separado e prova de isolamento | Repair Lubatec | Pendente |

Nenhum estado pendente deve ser promovido a concluído por inferência. A validação técnica do TiDB prova o fluxo de cópia, importação e verificação isolada, mas não substitui a confirmação humana, a homologação legal ou os ensaios em plataformas externas.

## 3. Ficheiros e comandos de evidência

O backup verificável está separado fora do projecto em `/home/ubuntu/restore-backups/`, acompanhado pelo manifesto SHA-256. O fluxo de importação é `scripts/restore-and-validate-mysql2.mjs`; a verificação pós-restauro read-only é `scripts/post-restore-readonly-validate.mjs`; o relatório técnico detalhado está em `docs/restore-validation-2026-08-25.md`.

A suite direccionada terminou com 10 testes aprovados; `pnpm check` e `pnpm build` também terminaram com sucesso. A correcção da chave React duplicada no balancete foi coberta por teste dedicado e não produziu novos erros no log após a verificação visual de Contabilidade.
