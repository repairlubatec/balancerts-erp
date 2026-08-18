# Implementação P0 — fluxos operacionais

## Escopo

Foram completados os principais fluxos P0 do BALANCERTS.ERP sem activar comunicação real com a AGT.

## Facturação e Documentos

O formulário de facturação passou a trabalhar com cliente, catálogo, múltiplas linhas, vencimento, regime IVA e totais calculados. O ciclo documental expõe as transições persistentes de validação, emissão, contabilização e anulação, com confirmação, regras de transição, hash na emissão, auditoria e invalidação das consultas.

## Contabilidade

Foi criado um posto de lançamento manual com descrição, contas de débito/crédito, valor, validação server-side e publicação apenas quando o lançamento está equilibrado. O lançamento utiliza período fiscal, idempotência, isolamento da empresa, ligação opcional ao documento e auditoria.

## Tesouraria

Foi criado um posto de movimentos para recebimentos e pagamentos, com conta de caixa/banco, método, valor, documento opcional, idempotência, persistência e feedback de sucesso/erro. O layout foi tornado responsivo em 1280px para que campos e comandos não sejam cortados.

## Fecho

O checklist foi convertido num posto transaccional ligado ao período persistente. O fecho exige avaliação anterior e permissão própria; a reabertura exige motivo obrigatório, é auditada e invalida o estado de períodos em cache.

## SAF-T

O readiness deixou de apresentar zero artificial para clientes, fornecedores, produtos e regras fiscais. As contagens são agora derivadas de queries tenant-aware às tabelas persistentes. A exportação continua bloqueada para submissão até validação AGT, XSD, endpoint e credenciais oficiais.

## Validação

A suite passou com 53 ficheiros e 189 testes. TypeScript e build de produção passaram. Foram revistas visualmente Facturação, Contabilidade, Tesouraria e Fecho em 1280×720; os grids passam a refluír em larguras Windows comuns e o selector Repair Lubatec permanece legível.

## Limites

Não foi feita comunicação AGT, homologação, assinatura oficial, nem declaração de certificação. A distribuição Windows continua preparada, mas os binários finais assinados exigem runner Windows e certificados próprios.
