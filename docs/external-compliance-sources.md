# Fontes externas de conformidade

## XSD SAF-T AO 1.01_01

Fonte: https://raw.githubusercontent.com/assoft-portugal/SAF-T-AO/master/XSD/SAFTAO1.01_01.xsd

O XSD declara o namespace `urn:OECD:StandardAuditFile-Tax:AO_1.01_01`, versão `1.01_01`, autor AGT, e organiza o ficheiro em `AuditFile`, `Header`, `MasterFiles`, `GeneralLedgerEntries` e `SourceDocuments`. O contrato local mantém a exportação bloqueada até existir cobertura completa e validação AGT/XSD.

Repositório de referência: https://github.com/assoft-portugal/SAF-T-AO

## Decreto Presidencial n.º 71/25

Fonte oficial AGT: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2391

O projecto referencia o Decreto Presidencial n.º 71/25, de 20 de Março, para emissão, rectificação, anulação, conservação e arquivamento de facturas e documentos fiscalmente relevantes. A parametrização local deve continuar conservadora até haver evidência oficial suficiente para cada regra operacional.

Fonte complementar consultada: https://www.ey.com/pt_ao/technical/tax-alerts/novo-regime-juridico-das-facturas

Nota: resultados de pesquisa e páginas externas são referências informativas; não substituem validação jurídica ou certificação AGT. Nenhuma fonte externa autoriza afirmar submissão SAF-T neste projecto.

## Estado técnico após a revisão D3/D5

A preparação local de D3 dispõe agora do contrato semântico `D3.1` em `server/bank-statement-contract.ts`. Este contrato normaliza extractos provenientes de CSV, MT940, CAMT.053, API ou entrada manual sem assumir um banco específico. Exige moeda ISO de três letras, datas de movimento, direcção, valor positivo, saldo inicial/final reconciliável, hash SHA-256, chave de idempotência e máximo de 5.000 linhas. O contrato ainda não liga qualquer banco externo e não autoriza pagamentos.

A preparação local de D5 aplica `assertAllowedDesktopUrl` e `canOpenExternalUrl` em `electron/desktop-security.mjs`. Fora do desenvolvimento, a origem do ERP deve ser HTTPS e o host deve estar em `BALANCERTS_DESKTOP_ALLOWED_HOSTS`; links externos só podem ser HTTPS e constar de `BALANCERTS_EXTERNAL_LINK_ALLOWED_HOSTS`. Certificados, assinatura, notarização, runners nativos, instaladores Windows/macOS e actualizações continuam dependentes de ambientes externos.

D4 tem validação reforçada do destino e do resultado pós-restauro, mas não foi executado qualquer restauro real. Nenhuma credencial bancária, AGT ou certificado foi acrescentado ao projecto.
