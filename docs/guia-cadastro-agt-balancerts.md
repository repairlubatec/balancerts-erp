# Guia operacional — cadastro do BALANCERTS.ERP na AGT

**Estado:** preparação local; não constitui homologação da AGT.

## Dados a preencher no Portal

| Campo | Valor recomendado |
|---|---|
| NIF do produtor de software | **5017205540** — confirmar no cadastro da Repair Lubatec antes de submeter |
| Nome do programa | **Balancerts.ERP** |
| Versão do produto | **1.0.0** |
| Marca | **Repair Lubatec** |
| Versão da chave pública | **1** |
| Aplicação do tipo Open Source | **Não**, salvo indicação jurídica em contrário |
| Solicitação de envio de documentos por Webservice | **Não**, enquanto a integração AGT não estiver homologada |

O ficheiro a anexar é `balancerts-erp-agt-public.txt`. O conteúdo é uma chave pública RSA em formato PEM, apesar da extensão TXT. Não editar, reformatar, converter para certificado ou remover as linhas `BEGIN PUBLIC KEY` e `END PUBLIC KEY`.

## Gestão da chave

A chave pública serve para identificação/verificação conforme o procedimento da AGT. A chave privada correspondente foi gerada separadamente e permanece fora do projecto, com acesso restrito. **Nunca deve ser anexada ao Portal, enviada no chat, colocada no repositório ou incorporada no frontend.** A chave privada só deverá ser configurada no ambiente de produção através de um mecanismo seguro de segredos, depois de a AGT aceitar o cadastro e fornecer as instruções de homologação.

A chave entregue é RSA de 2048 bits. O SHA-256 do ficheiro público é `9cdaa7a14e501c3d1bebe5e506f27308ff11f3105e345cd988d02fcf7b20272f`; este valor pode ser usado para confirmar que o ficheiro não foi alterado.

## Estado actual da integração

O BALANCERTS.ERP possui preparação local para configuração AGT, estabelecimentos, séries, chaves, submissões idempotentes e validações. A verificação de prontidão apresenta os bloqueios por empresa e mantém `externalSubmissionAllowed=false` até existir homologação real. Portanto, o cadastro no Portal não deve ser interpretado como autorização para submeter documentos através de Webservice.

A passagem para homologação exige, fora desta etapa, a confirmação do NIF do produtor, o número/resultado de validação do software, os códigos oficiais, os endpoints, a documentação técnica vigente da AGT, a configuração segura da chave privada e testes controlados. Sem esses dados, o sistema deve permanecer em preparação local e não deve fabricar respostas, certificados ou credenciais.

## Checklist de segurança antes da submissão

1. Confirmar que o NIF do produtor está correcto e pertence à entidade que registará o software.
2. Anexar exclusivamente `balancerts-erp-agt-public.txt`.
3. Preencher versão do produto `1.0.0` e versão da chave `1` apenas se estes valores corresponderem ao cadastro pretendido.
4. Guardar o comprovativo ou número de processo fornecido pela AGT fora do código-fonte.
5. Não activar Webservice no ERP apenas porque o formulário foi submetido.
6. Se a AGT rejeitar a chave ou exigir outro formato, gerar uma nova versão de chave e revogar a anterior no registo interno, sem substituir silenciosamente a chave activa.

> Este guia apoia o preenchimento inicial do cadastro. A validade jurídica, a homologação e os requisitos finais de integração dependem exclusivamente da confirmação oficial da AGT.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao — Portal do Contribuinte do Ministério das Finanças/AGT, legislação e procedimentos institucionais.

A localização do cadastro e os requisitos efectivamente aceites devem ser confirmados no próprio Portal da AGT [1].
