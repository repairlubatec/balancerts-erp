# Compras e encomendas P1 — BALANCERTS.ERP

## Resultado funcional

Foi implementado um posto de **Compras** integrado no shell desktop Windows do BALANCERTS.ERP. O posto permite seleccionar um fornecedor existente, criar uma encomenda com linha, quantidade, preço unitário e IVA, calcular os totais em AOA, registar data prevista e observações, e acompanhar o ciclo operacional.

| Estado | Transição disponível |
|---|---|
| Rascunho | Submeter ou anular |
| Submetida | Aprovar ou anular |
| Aprovada | Registar recepção ou anular |
| Recebida | Estado final operacional |
| Anulada | Estado final operacional |

A persistência é tenant-aware e exige empresa pronta, fornecedor da mesma empresa e pelo menos uma linha válida. O servidor recalcula líquidos, imposto e total; o cliente apenas apresenta uma prévia. As mutações são auditadas com antes/depois e correlação própria.

## Integração técnica

A migração `drizzle/0024_rich_marvel_zombies.sql` criou as tabelas `purchaseOrders` e `purchaseOrderItems` sem apagar dados anteriores. Foram acrescentadas permissões para o módulo `purchases`, contratos tRPC de listagem, criação e transição, e entradas nas matrizes de auditoria e de operações críticas pendentes.

O posto foi registado em `/compras`, no encaminhamento da aplicação, no menu lateral e na barra de janelas. Todos os rótulos e estados visíveis são apresentados em português. A data prevista usa o formato explícito `AAAA-MM-DD`, evitando o placeholder nativo inglês do navegador.

## Validação

A suite completa terminou com **57 ficheiros de teste e 202 testes aprovados**. Foram validados RBAC, isolamento da empresa, criação, transições, política de mutações críticas, rótulos portugueses e regressões do shell existente. O TypeScript e o build de produção terminaram sem erros. A revisão visual de `/compras` confirmou o alinhamento no shell Windows, a densidade operacional e a ausência do placeholder inglês.

A funcionalidade de Compras não emite facturas, não efectua pagamentos e não comunica com a AGT automaticamente. A recepção é uma transição operacional auditada; a contabilização e a integração fiscal devem permanecer ligadas a documentos e regras contabilísticas explícitas quando forem implementadas.
