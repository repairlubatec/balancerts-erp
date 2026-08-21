# Parecer documental — PGCA oficial e Decreto n.º 82/01

**BALANCERTS.ERP — D1 | Data:** 21 de Agosto de 2026  
**Estado:** análise concluída; activação normativa ainda não executada

## 1. Objectivo e método

Foi recebido o PDF oficial **“Decreto n.º 82/01 de 16 de Novembro — Aprova o Plano Geral de Contabilidade”**. O ficheiro foi preservado sem alteração em `docs/normative-sources/decreto-82-01-pgca.pdf`. A fonte contém 97 páginas, corresponde ao *Diário da República*, I Série — n.º 52, de 16 de Novembro de 2001, e está marcada como encriptada, impedindo a extracção textual directa. Foi criada uma cópia OCR em português, página a página, para pesquisa e conferência, mantendo o PDF original como fonte primária.

A análise combinou a leitura visual das páginas relevantes, o OCR integral e uma consulta não destrutiva ao catálogo actualmente persistido no BALANCERTS.ERP. Não foram criadas contas, alterados nomes, activados estados, executadas migrações ou modificados lançamentos.

## 2. Confirmações normativas encontradas

As primeiras páginas do diploma identificam o Decreto n.º 82/01 como o acto que aprova o Plano Geral de Contabilidade e estabelecem a sua aplicação às sociedades comerciais e empresas públicas abrangidas pelo diploma. O documento inclui a estrutura de classes, contas, subcontas e orientações contabilísticas.

A página 48 introduz a **classe 4 — Meios Monetários**, com as rubricas 41 Títulos negociáveis, 42 Depósitos a prazo, 43 Depósitos à ordem, 44 Outros depósitos, 45 Caixa, 48 Conta transitória e 49 Provisões para aplicações de tesouraria.

A página 49 detalha a conta 45, apresentando **451 Fundo fixo**, **4511 Caixa**, **4512 Caixa**, 452 Valores para depositar e 453 Valores destinados a pagamentos específicos, incluindo 4531 Salários. O documento recebido **não apresenta literalmente “4511 Caixa Kwanza”**; essa expressão deve ser tratada como uma designação operacional ou uma fonte diferente, não como transcrição literal desta página do Decreto.

A página 50 introduz a **classe 6 — Proveitos e Ganhos por Natureza**, incluindo 61 Vendas, 62 Prestações de serviço, 63 Outros proveitos operacionais, 64 Variação nos inventários de produtos acabados e de produção em curso, 65 Trabalhos para a própria empresa, 66 Proveitos e ganhos financeiros gerais, 67 Proveitos e ganhos financeiros em filiais e associadas, 68 Outros proveitos não operacionais e 69 Proveitos e ganhos extraordinários.

Na mesma página, a conta 61 apresenta 611 Produtos acabados e intermédios, 612 Sub-produtos, desperdícios, resíduos e refugos, **613 Mercadorias**, 614 Embalagens de consumo, **6131 Mercado nacional** e **6132 Mercado estrangeiro**. O código 6131 e a designação “Mercado nacional” estão confirmados pela leitura visual do PDF.

## 3. Confronto com o catálogo actual

A consulta não destrutiva à base de dados encontrou a versão `PGCA-82-01`, denominada “Plano Geral de Contabilidade — Decreto n.º 82/01”, na organização 1, com estado `UNDER_REVIEW` e oito contas registadas. As fontes normativas do Decreto n.º 82/01 e da Lei n.º 14/23 permanecem com estado `PENDING`.

| Código | Designação persistida actual | Evidência no PDF recebido | Resultado documental |
|---|---|---|---|
| 4511 | Caixa Kwanza | Página 49 mostra “4511 Caixa” | Código confirmado; nome persistido requer decisão de normalização ou fonte adicional |
| 6131 | Mercado nacional | Página 50 mostra “6131 Mercado nacional” | Código e designação confirmados |

A diferença em 4511 é material para a proveniência. Não é seguro substituir silenciosamente “Caixa Kwanza” por “Caixa”, nem afirmar que ambas são equivalentes normativas sem uma regra de normalização aprovada. A opção tecnicamente mais segura é preservar o texto oficial como nome normativo e, caso necessário, manter “Caixa Kwanza” apenas como rótulo operacional ou alias explícito, com origem e justificação auditáveis.

## 4. Limites da confirmação

A leitura do PDF confirma o diploma, a estrutura das classes relevantes e os códigos 4511 e 6131. Não equivale ainda à validação automática de toda a árvore de contas, naturezas, níveis, aceitação de lançamentos, contas fiscais ou regras de correspondência operacional. Esses atributos devem ser extraídos e revistos com rastreabilidade de página antes de uma importação integral.

A Lei n.º 14/23 do IVA não foi incluída no anexo recebido. A página pública da AGT consultada apresenta legislação do IVA, incluindo a Lei n.º 7/19 e a Lei n.º 17/19, mas a confirmação integral da Lei n.º 14/23 exige o PDF exacto dessa lei e das alterações vigentes que devam ser aplicadas. Por isso, não devem ser activadas taxas, regimes, contas de IVA ou regras de apuramento apenas com base no índice web.

## 5. Proposta para aprovação do utilizador

Propõe-se que o catálogo PGCA seja actualizado em duas camadas. A primeira camada deve conservar a fonte primária e importar a árvore oficial com nomes transcritos literalmente, estados `NEEDS_NORMATIVE_VALIDATION` até à revisão humana e referência de página para cada conta. A segunda camada deve conter aliases e correspondências operacionais, como “Caixa Kwanza”, sempre separadas do nome oficial e ligadas a uma fonte ou decisão documentada.

Para os dois códigos já verificados, a proposta é: manter **4511 — Caixa** como designação normativa oficial do Decreto n.º 82/01; manter **6131 — Mercado nacional** como designação normativa e operacional, salvo decisão contabilística posterior; e não activar ainda regras de IVA nem completar a importação integral sem o texto oficial da Lei n.º 14/23.

A activação deverá ocorrer somente após confirmação expressa do utilizador sobre a normalização de 4511 e após a recepção/leitura da Lei n.º 14/23. Qualquer activação posterior deverá ser não destrutiva, versionada, auditada e não deverá reclassificar lançamentos históricos automaticamente.

## 6. Ficheiros de evidência preservados

| Ficheiro | Finalidade |
|---|---|
| `docs/normative-sources/decreto-82-01-pgca.pdf` | PDF oficial original recebido |
| `docs/normative-sources/decreto-82-01-pgca-metadata.txt` | Metadados técnicos do PDF |
| `docs/normative-sources/decreto-82-01-pgca-ocr.txt` | OCR integral em português para pesquisa |
| `docs/normative-sources/pgca-ocr/` | OCR individual por página |
| `docs/normative-research-proposal-2026-08-21.md` | Dossier acumulado de pesquisa e proveniência |

## Conclusão

O **Decreto n.º 82/01 e os códigos 4511 e 6131 foram confirmados documentalmente no PDF oficial recebido**. A confirmação revela uma correcção importante: o texto oficial visível para 4511 é “Caixa”, não “Caixa Kwanza”. O BALANCERTS.ERP deve manter a versão PGCA em revisão até que a decisão de normalização seja aprovada e até que a Lei n.º 14/23 seja igualmente lida a partir do documento integral. Nenhuma alteração operacional foi feita nesta fase.

## Referências

[1]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial “CNNCA — Sector Empresarial, Decreto n.º 82/01 de 16 de Novembro”

[2]: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao “AGT — Legislação IVA”

[3]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ “Lei n.º 14/23 — referência catalogada para validação documental posterior”

## Evidência adicional sobre a Lei n.º 14/23

Foi consultada a página jurídica Lex Angola, que identifica a Lei n.º 14/23, de 28 de Dezembro, como diploma da Assembleia Nacional publicado no Diário da República, I Série, n.º 246, de 28 de Dezembro de 2023, página 8519. A página descreve a primeira alteração ao Código do IVA, enumera os artigos alterados, indica revogações, adita os artigos 69.º-A a 69.º-D e 74.º a 78.º, e republica o Código do IVA. O conteúdo consultado também apresenta no artigo 19.º as taxas de 14% como taxa geral, 7% para o regime simplificado e determinados serviços, 5% para bens alimentares de amplo consumo e insumos agrícolas constantes dos anexos, e 1% para o regime especial da Província de Cabinda, com excepções indicadas no texto.

Esta página é uma fonte jurídica secundária, não o PDF oficial fornecido pela AGT. A evidência é suficiente para actualizar a pesquisa e preparar uma matriz de artigos, mas não deve por si só activar regras fiscais de produção. O HTML capturado foi preservado em `docs/normative-sources/lei-14-23-lex-capture.html`; permanecem necessárias a validação da versão oficial, vigência aplicável e leitura dos anexos antes da activação.

## Confirmação visual da Lei n.º 14/23 recebida

O PDF oficial recebido tem 77 páginas e a primeira página identifica o Diário da República, I Série, n.º 246, de 28 de Dezembro de 2023, com a Lei n.º 14/23 publicada na página 8519. A página 2 identifica a Assembleia Nacional e o objecto “Lei de alteração ao Código do Imposto sobre o Valor Acrescentado — Primeira Alteração/2023”.

As páginas 8 e 9 confirmam visualmente o artigo 19.º: 14% como taxa geral; 7% para o regime simplificado; 7% para hotelaria e restauração, condicionada às obrigações cumulativas do n.º 2; 5% para bens alimentares de amplo consumo e insumos agrícolas constantes dos Anexos I e II; e 1% para o regime tributário especial da Província de Cabinda, com a excepção dos bens constantes do Anexo III, aos quais se aplica a taxa geral. A página 9 também confirma o artigo 21.º e a obrigação de cativação de 50% para entidades nele indicadas, incluindo o Banco Nacional de Angola, bancos comerciais, seguradoras, resseguradoras e operadoras de telecomunicações com título global unificado.
