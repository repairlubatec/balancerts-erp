# Evidência documental — Portal do Parceiro AGT

Fonte primária local: `docs/agt-portal.pdf` e texto extraído `docs/agt-portal-extracted/agt-portal.pdf.txt`, descarregados da pasta Drive `Portal do Parceira AGT` (folder ID `1hfo4e_mSE45C21EiodNVY2qgDpv-8qEa`). O PDF tem 96 páginas. Os dois XLSX foram lidos temporariamente e eliminados localmente depois de redacção; continham chaves privadas e públicas associadas a NIFs de teste. Nenhum segredo foi copiado para o projecto.

## Achados técnicos iniciais

A documentação descreve assinatura digital de solicitações e documentos com **JWS**, incluindo referência explícita ao algoritmo **RS256** e uso da chave privada do software. Também descreve campos como `jwsDocumentSignature` para assinatura da factura e `jwsSignature` para assinatura digital da solicitação.

A documentação inclui o ecossistema **SIGT/FE**, com namespaces e endpoints SOAP/XML aparentes, incluindo `http://sifp.minfin.gov.ao/sigt/fe/ws/v1` e exemplos `ValidarDocumentoRequest`/`ValidarDocumentoResponse`. O fluxo não é apenas exportação SAF-T: envolve comunicação de documentos/facturas ao serviço AGT e respostas de validação.

Os exemplos documentais usam NIF angolano como identificador do emissor/participante e apresentam arrays/linhas de NIFs em algumas respostas. A configuração AGT do ERP já existente deve ser comparada com estes contratos para verificar transporte, namespace, versão, método, headers, assinatura e tratamento de resposta.

## Termos documentais a aprofundar

As ocorrências relevantes estão no texto extraído aproximadamente nas linhas 501–598 (assinatura e campos de factura), 1047–1095 (assinatura da solicitação e valores enumerados), 1270–1274, 1623–1674, 2101–2116, 2436–2452 e 2689–2693 (repetição de contratos de assinatura/resposta), e 2569–2591 (request/response de validação de documento no namespace SIGT/FE v1).

## Limite de segurança

Os XLSX da pasta contêm material que se apresenta como `BEGIN PRIVATE KEY` e `BEGIN PUBLIC KEY`. Estes valores foram tratados como segredos e não serão usados como credenciais de desenvolvimento, não serão enviados para o código, não serão incluídos em testes e não serão reproduzidos em relatórios.

## Contrato RegistarFactura confirmado

O serviço `RegistarFactura` está documentado com comunicação síncrona, protocolo HTTPS e formatos SOAP e REST. O exemplo REST de homologação indica `https://sifphml.minfin.gov.ao/sigt/fe/v1/registarFactura`, devendo o endpoint permanecer configurável e não ser tratado como produção sem confirmação oficial.

Os parâmetros de cabeçalho documentados são `Username` e `Password`, sendo o segundo descrito como token de acesso. O pedido exige `schemaVersion`, `submissionUUID` em formato UUID standard, `taxRegistrationNumber`, `submissionTimeStamp`, `softwareInfo`, `numberOfEntries` e `documents`.

O documento contém `documentNo`, `documentStatus`, `jwsDocumentSignature`, `documentDate`, `documentType`, `companyName`, linhas, impostos e `documentTotals`. A documentação enumera tipos de documento como FT, FR, FS, FA, RE, ND, NC, entre outros, e exige linhas para os tipos que não sejam AR, RC ou RG.

Implementação interna concluída neste bloco: configuração AGT com `productId`, `productVersion`, `softwareValidationNumber` e `serviceNamespace`; builders tipados para as sete operações documentadas; JWS compacto RS256 com chaves efémeras em testes; validação de UUID, contagem de documentos, campos obrigatórios e sequência de linhas; classificação conservadora de respostas para retry/failed/completed. A assinatura real e o transporte autenticado permanecem deliberadamente desactivados até existirem credenciais oficiais.

## Validação desta fase

A regressão completa após a implementação dos contratos SIGT/FE passou com **43 ficheiros e 151 testes**. TypeScript e build de produção passaram. A validação local do SAF-T AO contra `SAFTAO1.01_01.xsd` passou nos casos válido e inválido. O build emitiu apenas o aviso habitual de bundle frontend superior a 500 kB; não houve erro de compilação.

A validação comprova preparação interna, não comunicação real com a AGT. Continuam dependentes de configuração oficial: `Username`, token `Password`, chaves privadas RS256, endpoint definitivo, certificado, `softwareValidationNumber` atribuído e homologação/certificação AGT.

## Matriz de lacunas e dependências

| Prioridade | Lacuna | Estado | Dependência externa |
|---|---|---|---|
| P0 | Assinatura JWS RS256 real do software e do emissor | Preparada e testada com chaves efémeras | Chaves PEM oficiais e rotação segura |
| P0 | Comunicação HTTPS real com SIGT/FE | Cliente REST seguro implementado, chamadas reais não executadas | Endpoint definitivo, Username/token e autorização AGT |
| P1 | `softwareValidationNumber` | Campo configurável, actualmente `PENDING` nos testes | Número atribuído pela AGT após validação/homologação |
| P1 | Códigos oficiais de resposta e estados | Classificação base implementada; códigos configuráveis | Tabela oficial completa e ambiente de homologação |
| P1 | SOAP/XML | Namespace e operações identificados; cliente REST implementado | WSDL/contrato SOAP final e testes AGT |
| P2 | Consola AGT dedicada na UI | Fila e configuração existem no backend; UX dedicada ainda requer evolução | Nenhuma, trabalho interno de produto |
| P2 | Validação integral contra exemplos oficiais | XSD SAF-T e contratos principais testados; exemplos de todos os serviços requerem fixtures sanitizadas | Exemplos oficiais sem segredos |

Esta matriz evita declarar certificação, homologação ou comunicação real antes de existir evidência externa da AGT.
