# Validação de restauro isolado — 25 de Agosto de 2026

## Objectivo

Foi preparado um destino TiDB Cloud separado para validação de restauro do BALANCERTS.ERP. O procedimento mantém a base de produção fora do fluxo e não aceita dados demonstrativos, URLs inventadas ou restaurações sem manifesto de integridade.

## Destino confirmado

| Campo | Resultado |
|---|---|
| Serviço | TiDB Cloud Starter |
| Nome da instância | `balancerts-restore` |
| Estado | Activo |
| Região | AWS Frankfurt (`eu-central-1`) |
| Base seleccionada | `sys` |
| Limite de gasto | 0 USD/mês |
| Ligação | TLS validado pelo cliente MySQL |
| Estado de dados antes do restauro | Sem tabelas InnoDB; apenas a vista de sistema `schema_unused_indexes` |

## Testes executados

O teste de conectividade usou exclusivamente `SELECT 1 AS restore_connection_ok` e terminou com sucesso. A verificação adicional executou apenas consultas de leitura a `DATABASE()`, `CURRENT_USER()`, `@@version` e `information_schema.tables`. Não foram executados `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, importações ou comandos de restauro.

O destino respondeu com TiDB `v8.5.3`, schema `sys`, e uma vista de sistema. O preflight de segurança confirmou que a ligação, a allowlist do host, o fingerprint do destino, a atestação `ISOLATED` e a aprovação operacional estão configurados. O utilitário de restauração foi reforçado para passar `--ssl-mode=REQUIRED` ao cliente mysql, mantendo encriptação obrigatória quando um backup real for disponibilizado. A credencial não é escrita neste documento, no código, nos testes ou nos registos.

## Resultado do restauro isolado

Depois de confirmado o fingerprint da produção, foi criado o schema dedicado `balancerts_restore`, porque o schema de sistema `sys` rejeitou correctamente operações de criação. O backup foi importado nesse schema através de uma ligação mysql2 TLS com múltiplas instruções, removendo apenas `DROP TABLE`, `LOCK TABLES` e `UNLOCK TABLES` do stream para respeitar o utilizador restrito e o destino vazio.

A validação pós-restauro confirmou SHA-256 válido, 96 tabelas, todas as oito tabelas essenciais presentes e TiDB `v8.5.3`. As contagens exactas foram: uma organização, duas empresas, dois períodos fiscais, 18 contas do plano, um lançamento, duas linhas de lançamento, um documento comercial e 14.877 eventos de auditoria. As verificações read-only encontraram zero empresas órfãs, zero períodos fiscais órfãos e zero linhas de lançamento órfãs.

O resultado foi classificado como `HASH_VALIDATED`, `RESTORED`, `SCHEMA_VALIDATED`, `DATA_VALIDATED`, `MODULES_VALIDATED` e `ROLLBACK_READY`. A cópia original e o manifesto continuam retidos separadamente para rollback. Nenhuma operação de escrita foi executada na produção.

## Limitações mantidas

A validação confirma o schema, os módulos essenciais, as contagens exactas e as relações referenciais seleccionadas do destino. Não equivale a homologação AGT, aceitação formal ou validação completa numa máquina Windows. Os restantes itens externos continuam pendentes no todo.md e não foram marcados como concluídos por inferência.

## Evidência técnica

O fluxo executado está em `scripts/restore-and-validate-mysql2.mjs`, a inspecção read-only está em `scripts/post-restore-readonly-validate.mjs`, e o backup verificável encontra-se separado em `/home/ubuntu/restore-backups/` com o manifesto SHA-256 correspondente.
