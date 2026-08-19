# Recepção de stock ligada a Compras — P1

## Âmbito

O BALANCERTS.ERP passou a ligar encomendas de compra aprovadas a recepções de stock persistentes. A recepção aceita quantidades parciais, actualiza a quantidade recebida por linha, cria movimentos de entrada no stock e altera a encomenda para **Recebida** apenas quando todas as linhas ficam integralmente recebidas.

| Controlo | Comportamento implementado |
|---|---|
| Estado da encomenda | Só encomendas aprovadas ou já parcialmente recebidas podem receber stock |
| Quantidade | A quantidade recebida tem de ser positiva e não pode exceder o saldo da linha |
| Produto | Cada linha tem de estar ligada a um produto activo da empresa |
| Período | A recepção exige um período fiscal válido da empresa activa |
| Idempotência | A chave da recepção impede duplicação do mesmo pedido operacional |
| Auditoria | Regista recepção, estado anterior, estado resultante e correlação |
| Stock | Cria movimento de entrada com código do produto, quantidade, custo e correlação |

## Implementação

A migração `drizzle/0025_slippery_brother_voodoo.sql` criou `purchaseReceipts` e `purchaseReceiptItems`. As tabelas mantêm a organização, empresa, encomenda, período, utilizador, chave idempotente e linhas efectivamente recebidas. O backend usa uma transacção para gravar a recepção, linhas, actualização de `receivedQuantity` e movimentos de stock como uma unidade.

O router expõe `purchases.receive` com validação Zod e permissões de validação. A operação foi incluída nas matrizes de auditoria e de mutações críticas pendentes. O perfil operador continua impedido de validar recepções; contabilista, financeiro e administrador seguem as permissões configuradas.

## Interface desktop

No posto Compras, encomendas aprovadas apresentam o comando **Receber restante**. O comando calcula o saldo de cada linha e envia a recepção para o servidor. A criação de encomenda passou a exigir fornecedor e produto, evitando encomendas que não possam alimentar o stock. O posto Stock continua disponível para movimentos manuais, enquanto as recepções originadas em Compras ficam ligadas por correlação e trilho de auditoria.

## Validação

A suite terminou com **57 ficheiros de teste e 203 testes aprovados**. Foram verificados o router, RBAC, matrizes de auditoria, política de empresa pendente, rótulos portugueses, TypeScript e build de produção. A revisão visual de `/compras` e `/stock` confirmou a integração no shell Windows, os controlos operacionais e a ausência de placeholders ingleses.

Este fluxo não cria facturas, não contabiliza automaticamente a compra e não comunica com a AGT. A recepção é uma operação física de inventário auditada; a facturação de fornecedor e a contabilização permanecem fluxos separados e controlados.
