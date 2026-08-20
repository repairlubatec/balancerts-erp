# P1 — Protecção operacional do BALANCERTS.ERP

## Estado da implementação

A P1 acrescentou comandos operacionais explícitos para backup lógico, verificação de restauro e auditoria read-only de integridade referencial. Os comandos não guardam credenciais no repositório e usam `DATABASE_URL` apenas no processo de execução. A palavra-passe MySQL é passada ao cliente através de `MYSQL_PWD`, não como argumento de linha de comandos.

| Área | Implementação | Validação |
|---|---|---|
| Backup | `pnpm db:backup` cria `sql.gz`, hash SHA-256 e manifesto JSON fora do projecto | Backup real criado em 20/08/2026; gzip e hash verificados |
| Restauro | `pnpm db:restore:verify` exige alvo isolado, aprovação explícita, hash válido e `RESTORE_DATABASE_URL` | Salvaguardas unitárias aprovadas; restauro em base isolada ainda depende de uma URL isolada fornecida pela infraestrutura |
| Integridade | `pnpm db:integrity:audit` executa 17 verificações read-only de relações críticas | 15 relações sem órfãos; 2 linhas contabilísticas apontam para contas inexistentes |
| Segurança HTTP | Headers de isolamento, no-store para API/health, HSTS fora de desenvolvimento, request ID, rate limit e métricas | Testes de segurança aprovados |
| Observabilidade | `/healthz` expõe estado do processo e métricas agregadas sem corpo de pedido | Cobertura existente preservada e validada |
| Memberships/RBAC | Testes de actor distinto, override de membership, bloqueio sem membership e separação de consultas | Testes de router aprovados |
| Posting contabilístico | O backend passou a rejeitar contas inexistentes ou fora da empresa antes de inserir linhas | Testes contabilísticos e de integração aprovados |

## Backup realizado

Foi criado um backup lógico real fora do directório do projecto. O artefacto foi comprimido, passou `gzip -t` e o SHA-256 calculado coincidiu com o manifesto:

```text
Ficheiro: balancerts-20260820T153729Z.sql.gz
SHA-256: f91f6b2290bab8be239805caced543f2d537524c7dae4b11648b5410dfe1bc84
Tamanho: 589824 bytes
Modo: skip-lock-tables-explicit
```

O ambiente actual rejeitou `--single-transaction` com `ROLLBACK TO SAVEPOINT sp: SAVEPOINT sp does not exist`. Por isso, o backup realizado usou o modo explicitamente alternativo `BACKUP_SINGLE_TRANSACTION=false`, registado no manifesto. Este modo não oferece a mesma garantia de snapshot consistente durante escritas concorrentes; em produção deve ser substituído por uma ferramenta de backup compatível com o fornecedor MySQL/TiDB ou executado numa janela controlada.

## Excepção de integridade encontrada

A auditoria encontrou duas linhas no lançamento `3420001`, descrição `Cama`, empresa `1`, com `accountId` `4511` e `6131`. Não existem contas com esses IDs nem códigos correspondentes no plano de contas actual. As linhas não foram apagadas nem alteradas porque a escolha da conta correcta é uma decisão contabilística da Repair Lubatec e não deve ser inferida automaticamente.

A partir desta entrega, novos postings não podem criar o mesmo problema: o servidor confirma que cada conta existe, pertence à empresa e é postável antes da transacção. O lançamento histórico permanece uma pendência de dados que deve ser corrigida por um contabilista autorizado, com estorno/correcção auditada, ou associada a contas válidas após confirmação documental.

## Limitações ainda abertas

A validação de restauro foi feita ao nível das salvaguardas, do hash e da integridade do artefacto. Não foi executado um restauro real porque não existe uma `RESTORE_DATABASE_URL` isolada autorizada. Não seria seguro restaurar sobre a base operacional actual.

A suite completa continua a ter o teste SMTP Gmail 535, porque a conta externa ainda rejeita a credencial. Os testes internos P1 e os testes do painel financeiro estão verdes.
