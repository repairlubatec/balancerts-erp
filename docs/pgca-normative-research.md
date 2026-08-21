# Pesquisa normativa do PGCA — base para importação controlada

**Estado:** pesquisa técnica concluída; catálogo ainda não activado.

## Fontes consultadas

1. [Decreto n.º 82/01 — AngoLEX](https://angolex.com/paginas/decreto-presidencial/plano-geral-de-contabilidade-angolano-82a-01a.html), texto integral indexado. A página identifica o diploma como o instrumento que aprova o Plano Geral de Contabilidade e reproduz os artigos 1.º a 10.º. O artigo 2.º indica a aplicação obrigatória às sociedades comerciais e empresas públicas que exerçam actividade em Angola ou tenham sede em Angola; o artigo 6.º atribui ao Ministro das Finanças competência para alterar nomenclatura, códigos, conteúdo, introdução e eliminação de contas.
2. [Decreto n.º 82/01 — Lex Angola](https://lex.ao/docs/conselho-de-ministros/2001/decreto-n-o-82-01-de-16-de-novembro/), registo do diploma publicado no Diário da República I Série n.º 52, de 16 de Novembro de 2001, página 977, com ligação para o PDF da publicação.
3. [CNNCA / MINFIN — Sector Empresarial](https://cnnca.minfin.gov.ao/legislacao/sector-empresarial), portal institucional consultado; a página estava sem documentos listados no momento da consulta, pelo que não foi usada como prova textual de contas.

## Evidência extraída do diploma

O PDF público do Lex Angola tem 97 páginas e é digitalizado; a extracção directa de texto não foi suficiente. Foi executado OCR local em português, sem envio do documento para serviços externos. O OCR identifica o quadro e lista de contas e confirma a estrutura:

| Classe | Designação | Evidência OCR |
|---|---|---|
| 4 | Meios monetários | Secção do quadro de contas, página impressa 1025 |
| 41 | Títulos negociáveis | Subsecção da classe 4 |
| 42 | Depósitos a prazo | Subsecção da classe 4 |
| 43 | Depósitos à ordem | Subsecção da classe 4 |
| 44 | Outros depósitos | Subsecção da classe 4 |
| 45 | Caixa | Subsecção da classe 4 |
| 451 | Fundo fixo | Subsecção da conta 45 |
| 4511 / 4512 | OCR com perda parcial da designação | Deve ser conferido visualmente no PDF antes de confirmação normativa; não activar automaticamente |
| 452 | Valores para depositar | Subsecção da conta 45 |
| 453 | Valores destinados a pagamentos específicos | Subsecção da conta 45 |
| 4531 | Salários | Subsecção da conta 453 |
| 61 | Vendas | Secção da classe 6, página impressa 1027 |
| 613 | Mercadorias | Subsecção da conta 61 |
| 6131 | Mercado nacional | Subsecção da conta 613 |
| 6132 | Mercado estrangeiro | Subsecção da conta 613 |

A hierarquia do diploma é apresentada sem pontos em vários trechos do quadro, pelo que o serviço PGCA aceita códigos como **4511** e **6131**, além de codificações pontuadas quando uma organização as usar internamente. A conta **6131 — Mercado nacional** ficou corroborada no OCR. A designação exacta associada ao código **4511** não ficou suficientemente legível no OCR e permanece deliberadamente pendente de confirmação visual por contabilista, não sendo criada como conta confirmada pelo sistema.

## Decisão de implementação

A fonte deve ser registada como `PGC_BASE`, com o Decreto n.º 82/01 em estado de verificação pendente. Nenhuma conta deve ser marcada `CONFIRMED` apenas com OCR. O catálogo poderá conter rascunhos com proveniência e nota de validação, mas a activação da versão permanece bloqueada enquanto existirem contas ou fontes não confirmadas. O plano legado da empresa BALANCERTS Ambiente de Testes foi auditado sem alterações: duas contas existentes ficaram `UNVALIDATED` e requerem revisão humana.

> Esta nota é documentação técnica de implementação, não substitui a validação formal do contabilista responsável nem constitui parecer jurídico ou fiscal.
