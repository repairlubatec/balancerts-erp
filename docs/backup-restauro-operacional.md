# Backup e restauro operacional

## Objectivo

O BALANCERTS.ERP utiliza MySQL/TiDB como fonte de verdade dos dados transaccionais. O backup deve ser executado pelo administrador da infraestrutura, com retenção, cifragem e teste de restauro definidos antes da entrada em produção.

## Backup lógico

Num ambiente com `mysqldump`, executar a partir de uma máquina de administração:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
mysqldump --single-transaction --routines --triggers --hex-blob --set-gtid-purged=OFF "$env:DATABASE_URL" | gzip > "balancerts-$timestamp.sql.gz"
```

A variável `DATABASE_URL` deve ser fornecida pelo gestor de segredos e nunca escrita no repositório, nos logs ou em tickets.

## Verificação

Cada ficheiro deve ter hash SHA-256, data, ambiente, versão do schema e período de retenção. Pelo menos uma vez por mês, o ficheiro deve ser restaurado para uma base de dados isolada e devem ser executados os testes de integridade e os testes de leitura dos módulos Empresas, Documentos, Contabilidade, Tesouraria, Stock e Auditoria.

## Restauro

O restauro de produção exige aprovação explícita, janela de manutenção e cópia de segurança do estado actual. O procedimento recomendado é restaurar primeiro para uma base isolada, validar o schema e a contagem de registos, e só depois promover a base restaurada. Nunca executar `DROP DATABASE`, `TRUNCATE` ou restauração directa sobre produção sem confirmação operacional e cópia anterior.

## Limitações actuais

O ERP não executa backups automáticos dentro da aplicação e não guarda credenciais de base de dados. A periodicidade, retenção, cifragem, armazenamento externo e alertas devem ser configurados na infraestrutura de produção.
