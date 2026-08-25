# Inventário do Motor Fiscal — pesquisa oficial

**Data:** 25 de Agosto de 2026  
**Objectivo:** confrontar a cobertura técnica do BALANCERTS.ERP com a enumeração e legislação fiscal angolana apresentada por fontes oficiais.

## Evidência inicial

O [Portal da AGT — Legislação Fiscal](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal) apresenta categorias separadas de legislação aduaneira, fiscal, tributação especial, outros, circulares, instrutivos e programas validados. Na página consultada surgem, entre outros, o Decreto Presidencial n.º 71/25 sobre o regime jurídico das facturas, o Decreto Executivo n.º 74/19 sobre regras de validação de sistemas, o Decreto Presidencial n.º 245/21 sobre o NIF e diplomas orçamentais/manuais. A listagem é dinâmica e não deve ser tratada como uma lista exaustiva de impostos.

O [Portal do Contribuinte — Impostos e taxas](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas) enumera explicitamente: **Imposto Industrial (II), Imposto Predial (IP), Imposto Sobre os Rendimentos do Trabalho (IRT), Imposto sobre a Aplicação de Capitais (IAC), Imposto de Selo (IS), Imposto sobre Sucessões e Doações (SISA), Imposto sobre o Valor Acrescentado (IVA), Imposto Especial de Consumo (IEC) e Impostos sobre os Veículos Motorizados (IVM)**.

## Limite da evidência

A enumeração institucional confirma o conjunto inicial de áreas a auditar, mas não confirma taxas, isenções, prazos, incidência, sujeitos passivos ou regras contabilísticas concretas. Esses parâmetros só podem entrar no Motor Fiscal depois da leitura da legislação primária vigente e da confirmação de vigência temporal. Não foram activadas regras novas nesta etapa.

## Referências consultadas

[1]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal — Portal da AGT, Legislação Fiscal.  
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas — Portal do Contribuinte, Impostos e taxas.


## Imposto Industrial — fonte oficial

A página oficial [Imposto Industrial (II)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial) descreve incidência sobre lucros de actividades comerciais ou industriais, sujeitos passivos incluindo pessoas colectivas e entidades sem personalidade jurídica, Regime Geral e Regime Simplificado, e obrigações declarativas e de pagamento. A página apresenta taxas de 25% como geral, 10% para actividades exclusivamente agrícolas/aquícolas/apícolas/avícolas/piscatórias/silvícolas/pecuárias e 35% para sectores indicados na própria página; apresenta ainda pagamento provisório de 2% sobre vendas nos primeiros seis meses para o Regime Geral e prazos anuais distintos. Estes valores são evidência para posterior parametrização versionada, não autorização para os activar sem confirmar o diploma e a vigência aplicáveis à empresa e ao exercício.

## IAC — fonte oficial

A página oficial [Imposto sobre a Aplicação de Capitais (IAC)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-aplicacao-de-capitais) divide os rendimentos em Secção A e Secção B. A fonte descreve juros e rendimentos de crédito na Secção A; dividendos, juros de títulos, suprimentos, royalties, prémios e outras categorias na Secção B; prevê regras de incidência subjectiva, isenções, determinação da matéria colectável, liquidação por titulares ou entidades pagadoras e declaração anual. A página apresenta taxas de 5%, 10% e 15%, com aplicação diferenciada às secções e categorias descritas, e pagamento até ao último dia do mês seguinte.

## Implicação para o modelo

O Motor Fiscal actual suporta apenas o cálculo comum de IVA (`taxType: "IVA"`) embora o schema já enumere `IAC`, `INDUSTRIAL`, `IRT`, `IEC`, `RETENCAO` e `OUTRO` em `fiscalTaxRecords`. Portanto, esses valores são actualmente **catálogo de persistência**, não motores fiscais concluídos. O próximo passo seguro é criar um contrato fiscal comum por tipo de imposto, com base, taxa/regra, direcção, retenção, vigência, fonte e obrigação declarativa, mantendo cada imposto em estado `NÃO CONFIGURADO` até as regras primárias serem catalogadas e confirmadas.

[3]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial — Portal do Contribuinte, Imposto Industrial.  
[4]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-aplicacao-de-capitais — Portal do Contribuinte, Imposto sobre a Aplicação de Capitais.


## Imposto de Selo — fonte oficial

A página [Imposto de Selo (IS)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo) indica incidência sobre actos, contratos, documentos, títulos, livros, papéis, operações e outros factos previstos na tabela anexa ao Código ou em leis especiais. Identifica vários sujeitos que liquidam/entregam o imposto e o titular do interesse económico como responsável financeiro. A fonte indica que as taxas constam da tabela anexa ao Código, podendo ser valores absolutos ou percentagens; o pagamento é apresentado até ao final do mês seguinte e a declaração anual discriminativa até ao último dia útil de Março do ano seguinte. O modelo actual não pode tratar `RETENCAO` como substituto do IS nem aplicar uma taxa genérica.

## IRT — fonte oficial

A página [Imposto Sobre os Rendimentos do Trabalho (IRT)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho) descreve incidência sobre rendimentos de trabalho por conta própria e de outrem e divide-os nos Grupos A, B e C. A fonte apresenta diferentes bases, deduções, situações de não sujeição/isenção, liquidação pelo empregador, titular ou entidade pagadora e retenções distintas, incluindo 6,5% e regras de auto-facturação nela descritas. Para o Grupo A, a matéria colectável depende das remunerações e deduções legais; para B/C, depende do serviço, contabilidade, tabela de lucros mínimos e retenção. Logo, IRT exige motor de folha/pagamentos, perfis de trabalhador, deduções, retenções e declarações; não é uma simples extensão do cálculo IVA por documento comercial.

[5]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo — Portal do Contribuinte, Imposto de Selo.  
[6]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho — Portal do Contribuinte, Imposto Sobre os Rendimentos do Trabalho.


## Imposto Predial — fonte oficial

A página [Imposto Predial (IP)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano) descreve incidência sobre valor patrimonial/renda de prédios urbanos e rústicos e transmissões gratuitas ou onerosas de imóveis. Distingue detenção, renda e transmissão, com sujeitos e bases diferentes, e apresenta obrigações, declarações, liquidação e pagamento próprios. A fonte inclui taxas e limiares específicos na página consultada, mas estes devem ser versionados por modalidade, data e diploma antes de activação. O IP exige cadastro de imóveis, avaliação/valor patrimonial, contratos de arrendamento, transmissões e calendário próprio; não deve ser calculado a partir de uma factura comercial genérica.

## IEC — fonte oficial indisponível nesta consulta

A rota de detalhe [Imposto Especial de Consumo (IEC)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-especial-de-consumo) devolveu uma página oficial de erro (“ocorreu algo inesperado”). Assim, fica confirmado apenas pela enumeração oficial de impostos, mas **não há evidência suficiente nesta consulta para parametrizar incidência, produtos, taxas, isenções ou prazos**. O Motor Fiscal deve manter IEC como `NÃO CONFIGURADO` até ser possível obter e confirmar a legislação/tabela oficial aplicável.

[7]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano — Portal do Contribuinte, Imposto Predial.  
[8]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-especial-de-consumo — Portal do Contribuinte, Imposto Especial de Consumo; consulta devolveu erro do portal.


## SISA — fonte oficial

A página [Imposto sobre Sucessões e Doações (SISA)](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-sucessoes-e-doacoes) indica incidência sobre transmissão gratuita de bens mobiliários, enumera isenções, apresenta escalões/taxas conforme o grau de relação e atribui o encargo ao beneficiário. A liquidação é tratada pela Repartição Fiscal competente e o pagamento segue a notificação. O SISA exige dados de transmissão gratuita, beneficiário, relação, valor/UCF e processo fiscal; não é uma retenção de folha ou imposto de factura.

## IVM e confirmação institucional da lista

O texto extraído da página de serviços da AGT inclui uma área específica de **Impostos sobre os Veículos Motorizados (IVM)** e disponibiliza um guia para cadastrar, liquidar, pagar e obter o selo. A página de detalhe do IVM não foi extraída com conteúdo nesta consulta, pelo que não se deve parametrizar a base ou taxas apenas com o nome do imposto. A mesma página AGT mostra calendário fiscal 2026, legislação, programas validados e outros materiais, mas esses conteúdos operacionais não substituem a legislação primária.

## IVA — estado da fonte consultada

A página de detalhe IVA do Portal do Contribuinte não devolveu conteúdo na extracção realizada. O projecto já possui Motor Fiscal IVA versionado e fail-closed, baseado na cadeia normativa IVA previamente auditada, mas esta consulta não adiciona qualquer taxa ou regra IVA nova.

[9]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-sucessoes-e-doacoes — Portal do Contribuinte, Imposto sobre Sucessões e Doações.  
[10]: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//impostos — Portal da AGT, serviços fiscais e materiais de IVM/calendário.  
[11]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/impostos-sobre-veiculos-motorizados — Portal do Contribuinte, página de detalhe IVM sem conteúdo extraível nesta consulta.  
[12]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-o-valor-acrescentado — Portal do Contribuinte, página de detalhe IVA sem conteúdo extraível nesta consulta.


## Matriz de cobertura técnica do BALANCERTS.ERP

| Imposto/área | Cobertura actual no código | Estado seguro | Dados/fluxos que faltam antes de activar |
|---|---|---|---|
| IVA | Motor versionado por vigência, regimes Geral/Simplificado/Exclusão, validação fail-closed, facturação, compras e registo fiscal documental | Implementado parcialmente | Cobertura integral de incidências/excepções, obrigações declarativas e submissão AGT |
| Imposto Industrial (II) | `fiscalTaxRecords.taxType` aceita `INDUSTRIAL`; não existe cálculo versionado específico | Persistência apenas / não configurado | Matéria colectável por regime, custos/ajustes, provisional sobre vendas, declaração, prazos e regras por actividade |
| IRT | `fiscalTaxRecords.taxType` aceita `IRT`; existe infraestrutura de recursos humanos/folha, mas o Motor Fiscal não calcula IRT | Persistência apenas / não configurado | Grupos A/B/C, remunerações, deduções, não sujeição, escalões/tabela, retenção e declarações |
| IAC | `fiscalTaxRecords.taxType` aceita `IAC`; não existe cálculo específico por Secção A/B | Persistência apenas / não configurado | Categorias de rendimento, titular/substituto, isenções, taxas por facto, retenção, pagamento e declaração |
| Imposto de Selo (IS) | Não existe código `IS` no enum de `fiscalTaxRecords`; existe apenas `OUTRO` | Não configurado | Catálogo da tabela anexa, acto/operação tributável, sujeito passivo, interesse económico, valor/taxa e declaração |
| Imposto Predial (IP) | Não existe cálculo ou cadastro fiscal de imóveis no Motor Fiscal | Não configurado | Imóveis, avaliação/matriz, detenção, renda, transmissão, isenções, contratos e calendário |
| SISA | Não existe cálculo ou entidade própria de sucessões/doações | Não configurado | Transmissão gratuita, beneficiário, grau de relação, UCF, escalões, liquidação e notificação |
| IEC | Não existe detalhe de produto/classificação ou cálculo específico; a rota oficial não respondeu nesta consulta | Não configurado | Legislação/tabela confirmada, produto, importação/produção, base, taxa, isenção e declaração |
| IVM | Não existe cadastro/liquidação de veículos; apenas material operacional AGT foi localizado | Não configurado | Veículo, titular, características, selo, calendário, taxa e integração AGT |
| Retenções transversais | `direction=WITHHELD`, `withheldAmount` e tipo `RETENCAO` existem na persistência | Infraestrutura parcial | Motor por imposto de origem, substituto tributário, momento da retenção, certificado, entrega e reconciliação |

A enumeração acima mostra uma distinção importante: **o enum de persistência não é prova de implementação fiscal**. O código do Motor Fiscal calcula actualmente IVA; os restantes códigos persistidos devem permanecer bloqueados para cálculo automático até existir regra versionada activa, evidência e testes específicos.

## Ordem técnica recomendada

A ordem segura para expansão é: (1) completar IVA e obrigações AGT; (2) Imposto Industrial, porque se liga directamente ao PGCA, demonstrações financeiras e apuramento anual; (3) IRT, em conjunto com folha e pagamentos; (4) retenções transversais, modeladas como consequência do imposto principal; (5) IAC e Imposto de Selo, ligados a tesouraria, contratos, financiamentos e documentos; (6) IP e SISA, que exigem cadastro patrimonial e transmissões; e (7) IEC e IVM, que exigem catálogos específicos de produtos/veículos e regras de tributação especial.

Esta ordem é uma decisão de arquitectura e não uma conclusão sobre taxas. Cada activação futura deve conter fonte primária, artigo/anexo, página/evidência, vigência, teste de cálculo, regra contabilística e obrigação declarativa. Até lá, a interface deve mostrar **Não configurado** ou **Persistência apenas**, e o servidor deve rejeitar cálculos sem regra activa.
