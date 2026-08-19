# Conversão de recepção em documento de fornecedor — P1

## Objectivo

O posto Compras passou a permitir converter uma recepção de stock concreta num **rascunho de documento de fornecedor**. Esta operação prepara os dados comerciais sem emitir o documento, sem o comunicar à AGT e sem criar automaticamente um lançamento contabilístico.

| Área | Garantia implementada |
|---|---|
| Origem | O documento guarda a recepção que lhe deu origem em `sourceReceiptId` |
| Idempotência | `conversionKey` única impede rascunhos duplicados para a mesma recepção |
| Empresa | A recepção, fornecedor e documento são validados na mesma empresa e organização |
| Estado fiscal | O documento nasce em `DRAFT`; emissão e contabilização continuam a ser operações separadas |
| Linhas | São copiadas apenas as quantidades efectivamente recebidas, com produto, descrição, custo e imposto da encomenda |
| Auditoria | É registada a conversão com origem, número do documento e estados de emissão/contabilização falsos |
| Segurança | O comando exige permissão de validação no módulo Compras e empresa operacional |

## Implementação técnica

A migração `drizzle/0026_fresh_cloak.sql` acrescentou `sourceReceiptId` e uma `conversionKey` única a `businessDocuments`. O backend valida o acesso tenant-aware à recepção, confirma que existem linhas, reutiliza a criação existente de rascunhos de documentos de fornecedor e associa a origem após a criação. Uma repetição devolve o documento previamente criado em vez de reservar outro número.

A operação foi exposta como `purchases.convertToSupplierDraft`. O comando usa a série e o regime de IVA configurados para a empresa activa. O documento não é submetido à AGT, não é marcado como emitido e não é contabilizado automaticamente. A decisão mantém os limites actuais de preparação fiscal e evita confundir recepção física com factura de fornecedor.

## Interface

Cada recepção apresentada no posto Compras dispõe do comando **Criar rascunho**. O feedback informa o número criado ou comunica que a recepção já tinha sido convertida. A janela continua integrada no shell Windows, sem pop-ups do navegador e sem exposição de identificadores técnicos ao utilizador.

## Validação

Foram actualizadas as matrizes crítica e pendente, adicionados testes do contrato tRPC e corrigidas as expectativas da política de mutações. A validação final aprovou **57 ficheiros de teste e 204 testes**, TypeScript, build de produção e revisão visual do posto Compras. A comunicação real com a AGT mantém-se desligada até existirem credenciais, endpoint, especificação oficial e homologação.
