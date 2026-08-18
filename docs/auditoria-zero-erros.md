# Auditoria zero-erros — BALANCERTS.ERP

## Resultado

A auditoria zero-erros foi executada sobre o estado actual do BALANCERTS.ERP. Foram recolhidos logs de desenvolvimento, consola do browser e pedidos de rede, seguidas de revisão visual das rotas principais e execução da suite completa.

## Falhas internas encontradas e corrigidas

| Observação | Causa | Correcção |
|---|---|---|
| O contexto visual aparecia como `BALANCERTS Test Tenant - Disposable` | Um ID antigo persistido no `localStorage` tinha prioridade sobre a empresa real | O resolvedor prefere Repair Lubatec pelo NIF `5001121871`; tenants descartáveis só permanecem activos após selecção manual. |
| O Overview apresentava o tenant descartável como empresa autorizada | Registo de teste persistente era enviado directamente para o portefólio visual | O tenant explicitamente descartável é ocultado apenas na apresentação; os dados não são apagados. |
| O módulo Stock mostrava “Documentos e dados fiscais” | O painel fiscal estava incluído por engano na lista de títulos do Stock | O painel foi removido do Stock; a área apresenta produto/serviço e movimentos de inventário. |

## Evidência técnica

Os pedidos tRPC observados após as correcções devolveram HTTP 200 com `content-type: application/json`. Não foram encontrados novos erros `500`, `404`, `401`, parsing HTML/JSON, excepções não tratadas ou erros tRPC nos registos posteriores à revisão visual. Os estados sem dados apresentados são estados legítimos da Repair Lubatec, que ainda não possui documentos ou séries comerciais configuradas.

A suite terminou com **53 ficheiros e 187 testes aprovados**. TypeScript, build de produção e `git diff --check` também passaram. Foram carregadas visualmente as rotas Overview, Empresas, Contabilidade, Facturação, Documentos, Tesouraria, Stock, Imobilizado, Fecho, Fiscalidade, Relatórios, Auditoria e Definições. A revisão final confirmou Repair Lubatec como empresa activa e Stock sem painel fiscal incorrecto.

## Limite importante

“Zero-erros” significa que não foi encontrada falha interna reproduzível no estado validado. Não significa homologação AGT nem certificação fiscal. A comunicação real com a AGT continua desactivada até existirem endpoint, credenciais, especificação técnica e autorização formal. Também permanece necessário o teste de aceitação com utilizadores da empresa em ambiente controlado antes de uma distribuição comercial.
