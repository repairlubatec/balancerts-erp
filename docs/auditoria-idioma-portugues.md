# Auditoria 360 de idioma — BALANCERTS.ERP

## Objectivo

O BALANCERTS.ERP deve apresentar ao operador uma experiência integralmente em português europeu, com terminologia adequada ao contexto empresarial e fiscal angolano. Os identificadores técnicos internos permanecem estáveis para não quebrar contratos tRPC, auditoria, SAF-T, integrações futuras ou dados persistentes.

## Âmbitos revistos

Foram revistos o shell Windows, menus, separadores, barra de tarefas, página inicial, Centro de Tarefas, Empresas, Contabilidade, Facturação, Clientes, Fornecedores, Stock, Imobilizado, Tesouraria, Documentos, Fiscalidade, Relatórios, Fecho, Auditoria, importação/exportação e mensagens de erro.

## Correcções aplicadas

Foi criado um mapa central de apresentação em `client/src/lib/presentationLabels.ts`. Estados como `PENDING`, `READY`, `ISSUED`, `VALIDATED`, `ACCOUNTED`, `CANCELLED`, `UNRECONCILED` e `READY_TO_CONFIRM` são apresentados como **Pendente**, **Pronto**, **Emitido**, **Validado**, **Contabilizado**, **Anulado**, **Por reconciliar** e **Pronto para confirmar**.

As acções e entidades que apareciam no resumo de actividade, como `PAYMENT_CREATED`, `DOCUMENT_NUMBER_RESERVED`, `treasuryTransaction` e `businessDocument`, passaram a ser apresentadas como **Pagamento Criado**, **Documento Número Reservado**, **Tesouraria Movimento** e **Operacional Documento**. Os códigos originais continuam apenas no contrato interno e no trilho técnico quando necessários.

As mensagens de erro de validação, autorização, permissões, transições documentais, períodos fechados e requisitos contabilísticos passaram a ser normalizadas por `userFacingError`. O painel de importação fiscal também traduz estados de lotes, linhas e erros de privacidade antes de os mostrar.

Foram removidos termos visíveis como `tenant-aware` e `PII`, substituídos por **isolamento por empresa** e **dados identificáveis**. A sigla técnica AGT, os formatos CSV/Excel/PDF, AOA, NIF e SAF-T permanecem porque são designações técnicas ou oficiais, não linguagem de interface inglesa a traduzir.

## Regra de manutenção

Novos valores técnicos devem ser enviados ao servidor no idioma/código definido pelo contrato, mas nunca devem ser impressos directamente na interface. Qualquer estado, acção, tipo de entidade ou mensagem deve passar por `presentationLabel`, `statusLabel` ou `userFacingError` antes da renderização.

## Validação

A suite validou **56 ficheiros e 194 testes**, com TypeScript sem erros, build de produção concluído e verificação visual em 1280px dos módulos inicial, Centro de Tarefas, Tesouraria, Documentos e Fiscalidade. A única advertência de build permanece relacionada com o tamanho de um bloco JavaScript, sem impacto funcional.
