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

O destino respondeu com TiDB `v8.5.3`, schema `sys`, e uma vista de sistema. O preflight de segurança confirmou que a ligação, a allowlist do host, o fingerprint do destino, a atestação `ISOLATED` e a aprovação operacional estão configurados. A credencial não é escrita neste documento, no código, nos testes ou nos registos.

## Bloqueios mantidos correctamente

O restauro real **não foi executado** porque não existe no projecto um pacote de backup `*.sql.gz` ou `*.backup` acompanhado do manifesto SHA-256 correspondente. O preflight também mantém o estado `PENDENTE_EXTERNO` enquanto não existir `RESTORE_PRODUCTION_FINGERPRINT`, necessário para provar que o destino não coincide com a produção.

Esta decisão é intencional: sem backup real e sem fingerprint de produção verificável, qualquer importação seria insegura e não demonstraria a integridade do sistema. O utilitário existente continua a exigir aprovação, destino isolado, utilizador restrito, allowlist, fingerprint, hash do backup e validação pós-restauro completa antes de aceitar o resultado.

## Próximo passo seguro

Disponibilizar no ambiente de trabalho um backup real exportado da produção, acompanhado do respectivo manifesto SHA-256 e da evidência/fingerprint de produção através do armazenamento seguro. Só então poderá ser executado o fluxo protegido: verificar hash, restaurar para `balancerts-restore`, validar schema, contagens, integridade referencial, módulos, isolamento por organização/empresa e prontidão de rollback.
