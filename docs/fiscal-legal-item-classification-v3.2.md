# Classificação documental dos requisitos fiscais V3.2

**Autor:** Manus AI  
**Data:** 26 de Agosto de 2026  
**Projecto:** BALANCERTS.ERP

## Regra de classificação

> `CONFIRMADO` significa que existe uma fonte institucional/localização confiável e o diploma está identificado. `A CONSOLIDAR` significa que o diploma foi identificado, mas a cadeia de alterações, vigência, anexos ou impacto ainda não foi fechada. `PDF OFICIAL A LOCALIZAR` significa que o requisito é necessário, mas o PDF primário legível não foi obtido. `HISTÓRICO` significa que a referência é preservada para contexto temporal e não alimenta o cálculo actual.

A classificação abaixo é documental, não é aprovação de regra fiscal. Um diploma em `CONFIRMADO` nesta tabela continua sujeito a confirmação de vigência, anexos e parametrização antes de entrar no motor.

## Matriz por pasta/área

| Pasta/área | Requisitos nominalmente identificáveis | Estado actual | Justificação e bloqueio |
|---|---|---|---|
| Controlo/OGE | Lei n.º 14/25; Circular n.º 01 GACA/GJ/AGT/2026; Calendário Fiscal AGT 2026 | Lei 14/25: `CONFIRMADO` como PDF institucional obtido; circular/calendário: `A CONSOLIDAR` | O PDF do OGE foi obtido e tem hash; falta mapear artigos, mapas fiscais e efeitos da circular/calendário. |
| Imposto Industrial | Lei n.º 19/14; Lei n.º 26/20; DE n.º 83/19; DP n.º 194/20; reintegrações/amortizações; provisões; preços de transferência | Leis 19/14 e 26/20: `A CONSOLIDAR`; DE 83/19 e DP 194/20: `A CONSOLIDAR`; matérias sem diploma nominal: `PDF OFICIAL A LOCALIZAR` | É necessária a cadeia do Código, alterações, modelos e anexos. Não activar taxas ou dedutibilidade por resumo. |
| IRT | Lei n.º 18/14; Lei n.º 28/20; DP n.º 194/20 quando aplicável; tabelas e modelos AGT | Leis: `A CONSOLIDAR`; tabelas/modelos: `PDF OFICIAL A LOCALIZAR` | A Lei 28/20 foi confirmada como alteração e revogação de diplomas anteriores; faltam tabelas e cadeia posterior integral. |
| IVA | Lei n.º 7/19; Lei n.º 17/19; DP n.º 180/19; DE n.º 134/19; alterações posteriores; modelos | Diplomas centrais: `A CONSOLIDAR` | A cadeia temporal está registada no ERP, mas os PDFs Lex.AO são cópias secundárias; a Lei 14/23 é a peça central da consolidação já identificada. |
| Imposto Predial | Lei n.º 20/20; DP n.º 191/21; alterações/modelos posteriores | `A CONSOLIDAR` | O DP 191/21 foi localizado e identificado; falta fechar tabelas, alterações e modelos oficiais vigentes. |
| IVM | Lei n.º 24/20; alterações; tabelas/procedimentos/modelos | Lei 24/20: `A CONSOLIDAR`; restantes: `PDF OFICIAL A LOCALIZAR` | A lei e as tabelas operacionais do portal foram identificadas; é necessário confronto integral das tabelas e ajustes OGE. |
| IEC | Lei n.º 8/19; Lei n.º 18/19; alterações posteriores; tabelas/modelos | Leis: `A CONSOLIDAR`; posteriores/tabelas: `PDF OFICIAL A LOCALIZAR` | A Lei 16/21 não foi aceite como Código do IEC; a cadeia mínima segura é 8/19 → 18/19. |
| IAC | DLP n.º 2/14; alterações; Código dos Benefícios Fiscais quando aplicável; modelos AGT | `A CONSOLIDAR` | O portal confirma escopo e taxas operacionais, mas falta o pacote primário completo de alterações e modelos. |
| Imposto do Selo | DLP n.º 3/14; tabela anexa; alterações; modelos/procedimentos; OGE 2026 | Código/tabela: `A CONSOLIDAR`; modelos e alterações: `PDF OFICIAL A LOCALIZAR` | A tabela anexa é indispensável; o portal não é substituto da tabela normativa. |
| Legislação geral | Lei n.º 21/14 — CGT; Lei n.º 21/20; DP n.º 245/21 — NIF; DE n.º 456/17; DE n.º 372/17; Despacho n.º 316/17 | `A CONSOLIDAR` | Diplomas identificados no índice oficial; falta obter e validar os PDFs e delimitar alterações posteriores. |
| Benefícios fiscais | Lei n.º 8/22; alterações e regulamentação | Lei 8/22: `A CONSOLIDAR`; restantes: `PDF OFICIAL A LOCALIZAR` | A lei foi identificada no Diário; não activar benefícios sem artigos, anexos e condições verificadas. |
| Facturação e SAF-T | DP n.º 292/18; DP n.º 312/18; DP n.º 71/25; DE n.º 73/19; DE n.º 74/19; facturação electrónica e procedimentos AGT | DP 312/18 e DE 73/19/74/19: `A CONSOLIDAR`; DP 71/25: `A CONSOLIDAR`; DP 292/18: `HISTÓRICO/A CONSOLIDAR` | O DP 92/25 foi retirado desta pasta: é o Estatuto Orgânico da AGT. O regime de facturação deve ser temporalmente fechado em torno do DP 71/25. |
| CEOC | Lei n.º 14/25; Circular AGT 01/2026; regulamentação/instruções | `A CONSOLIDAR` | OGE/circular foram localizados, mas falta o conjunto completo de regras operacionais. |
| IEJ | Lei n.º 17/24 — Lei da Actividade de Jogos; regulamentação fiscal/sectorial; modelos | Lei 17/24: `A CONSOLIDAR`; restantes: `PDF OFICIAL A LOCALIZAR` | A lei foi identificada nas imagens; falta a regulamentação fiscal e os modelos aplicáveis. |
| IVRM/Sectorial | Legislação vigente do Imposto sobre o Valor dos Recursos Minerais; regulamentação mineira; tabelas/procedimentos | `PDF OFICIAL A LOCALIZAR` | A área está identificada, mas não há ainda diploma nominal e PDF primário completo no pacote validado. |

## Regras de segurança

Nenhum requisito classificado como `A CONSOLIDAR`, `PDF OFICIAL A LOCALIZAR` ou `HISTÓRICO` pode activar uma taxa, código de isenção, tabela, conta, regra de contabilização ou cálculo automático. Os itens não legíveis nas imagens permanecem requisitos de pesquisa, não são preenchidos por inferência.

A classificação será revista quando forem obtidos os PDFs institucionais integrais, os anexos e a prova de vigência. A cadeia normativa deve conservar histórico e não pode substituir o PGCA-82-01 canónico por um pacote fiscal misturado.

## Referências

[1]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/circulares#collapse2398 "AGT — Circulares"
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas "Portal do Contribuinte — Impostos e Taxas"
[3]: https://lex.ao/docs/assembleia-nacional/2020/lei-n-o-26-20-de-20-de-julho/ "Lex.AO — Lei n.º 26/20"
[4]: https://lex.ao/docs/assembleia-nacional/2020/lei-n-o-28-20-de-22-de-julho/ "Lex.AO — Lei n.º 28/20"
[5]: https://lex.ao/docs/assembleia-nacional/2020/lei-n-o-24-20-de-13-de-julho/ "Lex.AO — Lei n.º 24/20"
[6]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-18-19-de-13-de-agosto/ "Lex.AO — Lei n.º 18/19"
[7]: https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf "MINFIN/AGT — Lei n.º 14/25 OGE 2026"
