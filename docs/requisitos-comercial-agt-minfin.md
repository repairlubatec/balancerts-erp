# Requisitos oficiais consultados para o módulo Comercial

## Fontes

1. Portal de Facturação Electrónica AGT/MINFIN: https://quiosqueagt.minfin.gov.ao/doc-agt/faturacao-electronica/1/
2. Portal AGT — notícia SAF-T: https://agt.minfin.gov.ao/PortalAGT/#!/sala-de-imprensa/noticias/7007/saft-um-valor-acrescentado-ao-nosso-iva
3. Portal AGT — Regime Jurídico das Facturas e Documentos Equivalentes: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//novo-menu-3
4. Portal AGT — Regime Jurídico da Autofacturação: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//regime-juridico-da-autotacturacao

## Constatações relevantes

A documentação pública da API de Facturação Electrónica descreve comunicação de documentos por JSON, assinatura digital JWS, controlo de séries, processamento assíncrono, requestID, marcas temporais, fila, consulta posterior por polling e histórico de processamento. O sistema deve, portanto, manter a emissão local, a fila de integração, a idempotência, o reprocessamento e a separação clara entre preparado e submetido.

O portal AGT indica a obrigatoriedade de emissão de facturas ou documentos equivalentes nas transmissões onerosas de bens e prestações de serviços. O módulo Comercial deve conservar cliente/fornecedor, NIF quando aplicável, documento, série, numeração, linhas, impostos, totais, estado, hash e rastreabilidade.

A autofacturação deve ser tratada como fluxo próprio e configurável, não como simples factura de fornecedor, com requisitos e permissões separados. A integração real e qualquer alegação de certificação/homologação permanecem desligadas até credenciais, especificação definitiva e autorização da AGT.

## Impacto no inventário

O Comercial precisa de catálogo de clientes, fornecedores e produtos/serviços; listas de preços e condições; documentos de venda e compra; séries e numeração; notas de crédito/débito e documentos de correcção; impostos e regimes; recibos e ligações a tesouraria; integração com stock e contabilidade; arquivo e auditoria; exportação SAF-T; e fila de comunicação preparada para AGT/MINFIN.
