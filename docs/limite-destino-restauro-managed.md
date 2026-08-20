# Limitação do destino isolado de restauro

## Verificação realizada

O ambiente actual disponibiliza os clientes `mysql`, `mysqladmin` e `mysqldump`, e a aplicação usa uma ligação MySQL válida à base do BALANCERTS. No entanto, a ligação gerida foi verificada com privilégios limitados:

| Verificação | Resultado |
|---|---|
| Base activa | `hXmUvi64UErkBaaL99DrK7` |
| Privilégio global | Apenas `USAGE` |
| Privilégio na base activa | `ALL PRIVILEGES` |
| Acesso a `information_schema` | `SELECT` |
| Criar outra base | Não autorizado pela concessão actual |
| Criar utilizador restrito | Não autorizado pela concessão actual |

## Consequência

Não é seguro nem tecnicamente possível configurar automaticamente `RESTORE_DATABASE_URL` no ambiente actual sem receber uma base isolada real de um serviço de infraestrutura que permita a sua criação. Uma URL inventada, uma URL `localhost` ou a URL da produção violaria o objectivo do teste e poderia causar perda ou alteração de dados.

O utilitário de restauro permanece protegido: exige `RESTORE_APPROVED=true`, exige `RESTORE_DATABASE_URL`, recusa destinos identificados como produção e verifica o SHA-256 do backup antes de iniciar qualquer comando de restauro.

## Requisito externo para fechar a validação

É necessário disponibilizar uma base MySQL/TiDB isolada, chamada por exemplo `balancerts_restore_test`, com um utilizador exclusivo e permissões limitadas a essa base. Depois de existir esse recurso, a URL deve ser configurada através do cartão seguro de segredos; nunca deve ser escrita no código, no TODO, no chat ou nos registos.

Até esse recurso existir, o estado correcto é **backup lógico criado e verificado; restauro isolado preparado, mas ainda não executado**.
