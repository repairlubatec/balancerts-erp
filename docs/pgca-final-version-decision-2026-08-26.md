# Decisão de reconciliação da versão PGCA

**Empresa:** Repair Lubatec  
**Data:** 26 de Agosto de 2026  
**Decisão técnica:** adoptar uma única linha contabilística canónica **PGCA-82-01 — Plano Geral de Contabilidade — Decreto n.º 82/01, de 16 de Novembro**, mantendo os demais diplomas contabilísticos e fiscais como fontes relacionadas, não como versões concorrentes do plano de contas.

> **Conclusão:** o pacote `pgc-angola-main.zip` é a representação digital mais completa recebida para a estrutura do PGC 82/01, mas não é um novo PGCA jurídico nem pode ser activado automaticamente como versão operacional do ERP.

## Evidência comparada

O ZIP recebido tem hash SHA-256 `ee9c532afe652ac7182444db8a1b11711b48059b5f350937e7059078f5dda6e9`. Contém o PDF `docs/pgc.pdf` com hash `4654e5b7524df2ce7bd1be532d88fddee328e570a2c6992b1297bc7d90c1e124`, o texto `pgc.txt`, três representações JSON, documentação e scripts de validação. As representações hierárquica, plana e `type/detailType` contêm 776 registos, correspondentes a **767 contas mais 9 classes**, sem códigos duplicados e com 767 relações pai registadas no formato plano. A própria documentação do pacote declara que é gerada em 2025, versão técnica 1.0, a partir do Decreto n.º 82/01.

A versão existente no ERP é `PGCA-82-01`, id 1, em estado `UNDER_REVIEW`, com 27 contas confirmadas e duas fontes confirmadas. A diferença determinística de códigos encontrou 765 registos do pacote sem confirmação visual equivalente no inventário actual; estes incluem classes, contas agregadoras e contas de níveis inferiores, não sendo duplicações apenas por aparecerem em diferentes níveis da hierarquia. O novo pacote não deve ser registado como uma segunda versão jurídica, porque declara a mesma fonte legal. Deve ser tratado como **evidência técnica complementar/candidato de importação** da versão PGCA-82-01, preservando o histórico e os hashes.

## Fonte oficial e vigência

A página oficial do CNNCA para **Legislação → Sector Empresarial** lista o **Decreto n.º 82/01 de 16 de Novembro — Aprova o Plano Geral de Contabilidade**. O Decreto Presidencial n.º 65/19, consultado no texto publicado, refere o PGC de Angola aprovado pelo Decreto n.º 82/01 e atribui ao CNNCA a apresentação de proposta de um novo PGC e de normas para um futuro sistema de normalização. A existência de uma proposta institucional não equivale à aprovação de uma nova versão do plano de contas.

Assim, a cadeia deve ficar identificada no ERP da seguinte forma:

| Camada | Designação | Tratamento |
|---|---|---|
| Plano de contas vigente de referência | Decreto n.º 82/01, de 16 de Novembro — Plano Geral de Contabilidade de Angola | Base canónica PGCA-82-01 |
| Órgão de normalização | Decreto Presidencial n.º 65/19, de 21 de Fevereiro — CNNCA | Diploma institucional relacionado; não substitui o plano |
| Regras fiscais posteriores | Lei n.º 7/19, Lei n.º 17/19, Decreto Presidencial n.º 180/19, Decreto Executivo n.º 134/19 e Lei n.º 14/23, conforme fontes recebidas | Camadas fiscais/versionadas; não são uma nova versão do PGCA |
| Estrutura técnica recebida | `pgc-angola-main.zip`, gerado em 2025 | Evidência/importação candidata ligada ao Decreto 82/01 |

## Bloqueios para activação

O pacote é estruturalmente rico, mas os JSONs não fornecem os campos jurídicos de **natureza devedora/credora/mista**, nem confirmação humana conta a conta. A execução do validador sobre as 776 entradas, depois de corrigida a regra legítima Classe→Conta (por exemplo, 1→11), eliminou os 65 falsos bloqueios de prefixo; o resultado final permanece `valid: false` e `activationEligible: false`, com 776 erros `ACCOUNT_NATURE_INVALID` e 560 avisos `GROUP_WITHOUT_CHILDREN`. `type` e `detailType` são classificações técnicas auxiliares e não devem ser convertidos automaticamente em natureza contabilística. O workflow do ERP exige contas confirmadas, fontes confirmadas, ausência de bloqueadores estruturais e cobertura completa das regras contabilísticas antes de permitir `VALIDATED` e `ACTIVE`.

O resultado PGCA anteriormente produzido registou 51 erros e 16 avisos no inventário confirmado de 27 contas. A comparação de códigos foi guardada em `docs/pgca-code-diff-2026-08-26.json` e confirmou 776 registos no pacote, 27 no inventário visual actual e 765 ainda pendentes de confirmação equivalente. Portanto, activar agora seria contrário ao requisito fail-closed. A decisão correcta é consolidar o pacote como fonte técnica complementar da versão PGCA-82-01, importar apenas após validação normativa das contas e manter a versão operacional bloqueada enquanto essa validação não existir.

## Resultado operacional

Não foi criada uma versão PGCA concorrente, não foi apagada a versão histórica e não foi feita activação automática. O pacote recebido foi preservado em `docs/normative-sources/pgc-angola-main-2025/`; a matriz de comparação, os hashes e a evidência oficial do CNNCA permanecem auditáveis no projecto.

**Referências:** [1] [2]

[1]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial "CNNCA — Legislação do Sector Empresarial"
[2]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-65-19-de-21-de-fevereiro/ "Decreto Presidencial n.º 65/19 de 21 de Fevereiro"
