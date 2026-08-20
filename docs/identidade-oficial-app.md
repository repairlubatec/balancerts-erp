# Identidade oficial da aplicação BALANCERTS.ERP

O activo fornecido pelo proprietário foi preservado como origem visual da marca e preparado em tamanhos apropriados para a aplicação. Os ficheiros não são colocados dentro do código como cópias locais; são mantidos no armazenamento persistente do projecto.

| Uso | Activo preparado | Estado |
|---|---|---|
| Ícone Windows multi-tamanho | `balancerts-icon.ico` | Preparado |
| Favicon pequeno | `balancerts-icon-32.png` e `balancerts-icon-64.png` | Integrado |
| Ícone PWA | `balancerts-icon-192.png` e `balancerts-icon-512.png` | Integrado |
| Ícone Apple touch | `balancerts-icon-180.png` | Integrado |
| Recurso de alta resolução | `balancerts-icon-1024.png` | Preparado |

## Utilização na distribuição

O instalador Windows deverá apontar o recurso `.ico` preparado para o executável, atalhos e entrada de desinstalação. A escolha final entre EXE/MSI, MSIX ou Microsoft Store será feita na etapa de empacotamento e assinatura, porque cada canal possui requisitos próprios.

Uma futura versão macOS deverá converter o mesmo activo original para o conjunto `.icns` dentro do pacote da aplicação. A conversão deve preservar a composição quadrada e a legibilidade do símbolo em tamanhos pequenos; a criação do pacote `.icns` depende da máquina macOS ou da ferramenta de empacotamento seleccionada.

A integração actual não declara assinatura de código, publicação na Microsoft Store, notarização Apple ou certificação AGT. Esses estados só podem ser confirmados depois de o instalador final ser criado, assinado, testado e, quando aplicável, notarizado ou homologado pela entidade externa.

## Titularidade

O nome comercial do produto permanece **BALANCERTS.ERP**. A atribuição de autoria e titularidade apresentada no produto é:

> Copyright © Repair Lubatec

Esta atribuição identifica a entidade criadora e titular indicada pelo proprietário do projecto. Não substitui eventuais registos de propriedade intelectual, contratos de cessão, licenças de terceiros ou outros documentos jurídicos que possam ser necessários para a distribuição comercial.
