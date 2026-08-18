# Auditoria dos módulos comerciais — BALANCERTS.ERP

## Critério

Cada módulo foi confrontado com a implementação do cliente, os procedimentos tRPC utilizados, a persistência esperada, o feedback de sucesso/erro e os testes existentes. Estados vazios ou bloqueios por regras de negócio foram tratados como estados explícitos, não como funções em falta.

| Módulo | Leitura persistente | Operações principais verificadas | Feedback e bloqueios | Cobertura encontrada |
|---|---|---|---|---|
| Empresas | `companies.list`, exercícios e períodos | Criar empresa, definir representante, criar exercício/período, activar, seleccionar contexto | PENDING, READY, permissões e confirmação literal | Home, Repair Lubatec e testes de tenant/permissions |
| Facturação | Documentos e séries por empresa | Criar série, reservar numeração através do servidor, criar rascunho, exportar auditoria, QR/PDF de preparação | Série obrigatória, contraparte, totais e AGT não homologada | `documents.test`, fiscal PDF/tabular e integração |
| Documentos | `documents.list` e ferramentas fiscais | Importar, validar, rever lote, exportar CSV/XLSX, preparar PDF | Importação fiscal exige revisão; mensagens de erro preservam a causa | Testes de documentos e revisão prática |
| Clientes e fornecedores | `counterparties.list` filtrado por tipo | Criar e actualizar contraparte, seleccionar linha, editar por ID | Contexto de empresa e RBAC são verificados no servidor | `expanded-modules.test` e testes de permissões |
| Stock | `catalog.list` e períodos | Criar produto/serviço, actualizar, registar entrada/saída persistida | Código, período, quantidade e custo validados; movimento auditado | `inventory.test`, `inventory-posting.test` e expansão de módulos |
| Tesouraria | Contas e movimentos persistentes | Criar/actualizar caixa ou banco, consultar movimentos, filtrar grelha | Conta, moeda, permissões e reconciliação controladas | Expansão de módulos, reconciliação e permissions |
| Imobilizado | `fixedAssets.list` | Registar activo, actualizar/baixar, calcular depreciação | Valores contabilísticos validados; depreciação é operação de servidor | `fixed-assets.test` e `fixed-assets-posting.test` |
| Contabilidade | Diário/razão persistente | Seleccionar lançamento, abrir cadeia de rastreabilidade e origem | Motor de partidas dobradas, imutabilidade e RBAC | `reports.test`, audit-chain, reversal e integração |
| Fiscalidade | Normas e registo fiscal por empresa | Consultar regras, calendário/evidências e console de pré-homologação | AGT real permanece bloqueada por ausência de endpoint/credenciais/homologação | `fiscal.test`, `fiscal-tabular.test`, SAF-T e validação |
| Relatórios | Balancete, antiguidade, reconciliação e registo fiscal | Abrir percurso para conta/documento/auditoria, pesquisar e filtrar grelha | Dados sem fonte aparecem como “sem dados”; não são inventados | `report-suite`, `auxiliary-reports` e `reports.test` |
| Fecho | Checklist através de `closing.evaluate` | Marcar verificações e validar o fecho | Bloqueadores são comunicados; não há fecho destrutivo automático | `closing.test` e `closing.router.test` |
| Auditoria | Eventos append-only filtráveis | Abrir actividade, filtrar por acção/utilizador/data, exportar CSV/XLSX | RBAC e tenant isolation aplicados | `audit-chain`, `audit-mutation-matrix` e router permissions |
| Definições | Índice de configuração | Abrir Empresas, Séries, Normas e Auditoria | A janela não apresenta opções fictícias; cada destino leva à área concreta | Testes de Home e navegação |

## Pontos mortos removidos

Foi removido o atalho para uma empresa fictícia codificada e o atalho para reconciliação bancária que não tinha ainda um painel de execução completo. O menu Editar, a selecção de Empresas e os comandos de Facturação receberam destinos operacionais concretos. As pesquisas e filtros da grelha passaram a operar sobre os dados actualmente carregados.

## Resultado

A auditoria funcional dos módulos foi concluída para o escopo actual do produto. Os módulos têm operações persistentes ou estados de preparação/bloqueio explícitos. A única dependência externa deliberadamente não executada continua a ser a comunicação real e homologação AGT. Esta dependência não é um ponto morto: é um bloqueio regulamentar explícito até existirem credenciais, endpoint, especificação e autorização formal.
