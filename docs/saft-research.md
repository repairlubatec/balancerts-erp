# Referência técnica SAF-T AO

A documentação pública consultada identifica o repositório `assoft-portugal/SAF-T-AO` como contendo o XSD oficial do Governo de Angola para SAF-T AO e indica o ficheiro `XSD/SAFTAO1.01_01.xsd`.

A documentação descreve a estrutura principal do XML como `AuditFile`, `Header`, `MasterFiles`, `GeneralLedgerEntries` e `SourceDocuments`, e recomenda validação contra XSD com `xmllint`.

A fonte também refere que o SAF-T é um ficheiro XML normalizado para exportação de informação contabilística por período, incluindo contas, clientes, fornecedores, produtos, tabelas fiscais, lançamentos e documentos de origem.

Fontes consultadas:

1. https://github.com/assoft-portugal/SAF-T-AO/blob/master/README.pt-AO.md — README português do repositório SAF-T AO.
2. https://github.com/assoft-portugal/SAF-T-AO/tree/master/XSD — directório público do XSD, contendo `SAFTAO1.01_01.xsd`.

Nota de conformidade: esta referência técnica não substitui a confirmação da versão normativa actualmente exigida pela AGT, da obrigação aplicável à empresa concreta ou da certificação do software. O exportador não deve ser declarado conforme nem submetido sem validação contra o XSD e revisão profissional/fiscal actualizada.

## Nota de teste da Repair Lubatec

Foi feita uma consulta somente de leitura à tabela `documentSeries` para localizar séries da Repair Lubatec. Não foi inserido nem reservado qualquer número. Na ausência de uma série operacional confirmada para o cenário de teste, a reserva real não será forçada, para evitar alterar numeração fiscal de uma empresa real apenas para fins de teste.
