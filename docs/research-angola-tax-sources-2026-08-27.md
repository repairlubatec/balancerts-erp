# Pesquisa de fontes fiscais angolanas — 27/08/2026

## Escopo

Foi feita pesquisa dirigida em páginas oficiais do Portal do Contribuinte do Ministério das Finanças e da Administração Geral Tributária. As páginas abaixo são tratadas como evidência institucional de trabalho para incidência, regimes, taxas e obrigações, sem substituir a confirmação jurídica da vigência de cada alteração legislativa.

## Resultados confirmados nas páginas oficiais

| Imposto | Evidência oficial consultada | Parâmetros expressamente apresentados | Consequência para o ERP |
|---|---|---|---|
| Imposto Industrial (II) | [Portal do Contribuinte — Imposto Industrial](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial) | Incide sobre lucros de actividade comercial/industrial; regimes geral e simplificado; taxa geral de 25%, actividades exclusivamente agrícolas/aquícolas/apícolas/avícolas/piscatórias/silvícolas/pecuárias a 10%, sectores bancário/seguros/telecomunicações/petrolíferas angolanas a 35%; pagamento provisório sobre vendas a 2% até ao último dia útil de Agosto; pagamento definitivo até Maio no regime geral e Abril no simplificado. | O motor deve parametrizar taxa por regime/actividade e separar imposto definitivo de pagamento provisório. Não deve aplicar uma taxa única a todas as empresas. |
| IRT | [Portal do Contribuinte — IRT](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho) | Incide sobre rendimentos do trabalho por conta própria e de outrem; grupos A, B e C; grupo A usa tabela anexa; grupos B e C apresentam 25% quando não sujeitos a retenção e 6,5% quando sujeitos a retenção; a página também apresenta retenção de 2%/6,5% em auto-facturação nas condições descritas. | O cálculo requer motor por grupo, tipo de rendimento, deduções/isenções e retenção. Não é seguro criar uma regra única de IRT. |
| Imposto Predial (IP) | [Portal do Contribuinte — Imposto Predial](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano) | Incide sobre valor patrimonial/renda e transmissões de imóveis; matéria colectável depende do tipo de prédio/operação; 0,6% para terrenos para construção, 25% para prédios arrendados e 2% para transmissão de imóvel; há tributação adicional de 50% em hipóteses específicas. | O motor precisa distinguir detenção, renda, transmissão onerosa/gratuita e terreno para construção. As taxas não podem ser aplicadas sem classificar o facto tributário. |
| Imposto do Selo (IS) | [Portal do Contribuinte — Imposto do Selo](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo) | Incide sobre actos, contratos, documentos, títulos, livros, papéis, operações e outros factos previstos na tabela anexa ao Código ou em leis especiais; taxas podem ser absolutas ou percentuais; pagamento até ao fim do mês seguinte ao facto tributário; declaração anual até ao último dia útil de Março do ano seguinte. | O motor deve usar a verba/tabela do IS e não uma taxa genérica. A tabela de incidência e o responsável pela liquidação são obrigatórios para activar cálculo produtivo. |
| IVA | [Portal do Contribuinte — IVA](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado) | Incide sobre transmissões de bens, prestações de serviços e importações; página apresenta taxa de 14% e taxa de 2% em Cabinda para importação de mercadorias e transmissão de bens; descreve regimes, isenções, imposto cativo e direito à dedução; entrega até ao fim do mês seguinte às operações. | O ERP deve manter regime, localização, natureza da operação, isenção, cativação e dedutibilidade como dimensões distintas. A cadeia IVA permanece versionada por diplomas, não substitui o PGCA canónico. |

## Catálogo legislativo institucional encontrado

A [página oficial de Legislação do Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/legislacao) lista, entre outros, Lei n.º 19/14 e Lei n.º 26/20 para II; Lei n.º 18/14 e Lei n.º 28/20 para IRT; Lei n.º 20/20 para IP; Decreto Legislativo Presidencial n.º 3/14 para IS; e Lei n.º 7/19, Lei n.º 17/19 e Decreto Executivo n.º 134/19 para IVA. A mesma página lista o OGE 2026, que deve ser confrontado com cada código e alteração antes de activar parâmetros temporais.

A página da AGT mostra uma comunicação de 27 de Agosto de 2026 sobre a liquidação e pagamento provisório do II de 2026 e uma taxa de 2% sobre o volume total das vendas para o regime geral, coerente com a informação apresentada no Portal do Contribuinte. A comunicação é operacional e não deve ser tratada como substituto do Código do II.

## Limitações e decisão técnica

A pesquisa confirma parâmetros úteis para a modelação, mas não autoriza ainda a criação automática das seis regras contabilísticas por operação. II, IRT e IP dependem de classificação do facto, regime, grupo ou tipo de imóvel; IS depende da tabela/verba; IVA depende de regime, localização, isenção, cativação e dedução. As fontes confirmam a estrutura do cálculo, mas não fornecem por si só a correspondência universal entre cada operação de negócio e as contas débito/crédito do PGCA para todos os sectores.

Consequentemente, o código deve incorporar estes parâmetros como catálogo versionado e regras condicionais em rascunho, sem activação produtiva automática. A activação continua a exigir fonte, vigência, contas PGCA confirmadas, regra operacional completa, revisão humana e auditoria append-only.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/legislacao "Portal do Contribuinte — Legislação"
[2]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial "Portal do Contribuinte — Imposto Industrial"
[3]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho "Portal do Contribuinte — IRT"
[4]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano "Portal do Contribuinte — Imposto Predial"
[5]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo "Portal do Contribuinte — Imposto do Selo"
[6]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado "Portal do Contribuinte — IVA"
[7]: https://agt.minfin.gov.ao/PortalAGT/#!/iva/imposto-sobre-o-valor-acrescentado/o-iva "AGT — O IVA"

## Confirmação visual no navegador

Em 27/08/2026, a página oficial **Legislação | Portal do Contribuinte** foi aberta e visualmente confirmada. O índice apresenta as secções Imposto Predial, Imposto Industrial, Imposto sobre os Rendimentos do Trabalho, Imposto Especial de Consumo e Imposto sobre o Valor Acrescentado, além das áreas Geral, OGE 2026, Retenção na Fonte, Aduaneiros e outras. Esta verificação confirma que o catálogo institucional é uma fonte navegável do MINFIN, mas a página de índice não substitui a leitura das leis e tabelas anexas.

## Verificação persistente do motor — 27/08/2026

Foi executada uma consulta somente de leitura no destino TiDB configurado. O resultado confirmou uma versão `PGCA-82-01` em estado `UNDER_REVIEW`, zero registos activos em `accountingRules` e um registo em `journalEntries`. A existência de um lançamento persistente isolado não é suficiente para simulação fiscal integrada: sem regras activas e sem readiness normativo completo, o motor deve rejeitar cálculo/posting produtivo e permitir apenas os testes controlados já cobertos pela suite. Nenhum dado foi inserido, alterado ou apagado.

## Nota de logs e separação do ambiente de teste

A revisão dos logs após a consulta read-only mostrou um `request.aborted` isolado durante actualização de dados, sem erro TypeScript e com o servidor a continuar operacional. Os logs também contêm eventos históricos da empresa de teste `Repair Lubatec`/`BALANCERTS Ambiente de Testes`, incluindo documentos e lançamentos de teste. Esses eventos não são evidência de readiness fiscal global e não foram usados para activar regras. A separação entre dados de teste e configuração normativa global permanece obrigatória.

## Imposto do Selo — leitura adicional

Foi localizada a referência institucional AGT ao **Guia do Sistema Tributário Angolano 2017**, que identifica o Decreto Legislativo Presidencial n.º 3/14 como diploma do Código do Imposto do Selo, mas o próprio guia declara que não reproduz integralmente a legislação e não substitui os códigos vigentes. Foi também lido o texto do DLP n.º 3/14 disponibilizado pela Lex Angola: o artigo 1.º estabelece que os actos, contratos, documentos, títulos, operações e outros factos estão sujeitos nos termos da tabela anexa ou de leis especiais; o diploma determina a entrada em vigor na data da publicação. O texto confirma que o IS exige classificação por acto/verba e não uma taxa única.

No OCR local da Lei n.º 14/23, a referência cruzada à verba 23.3 indica taxa de 1% para o recibo de quitação nas condições do regime descrito. O ERP registou esta informação somente como `IS-VERBA-23-3-RECIBO-1`, `REFERENCE_ONLY`, com nota de que a tabela integral do Código do IS continua necessária. Não foi criada uma regra geral de IS.

## Verificação de alterações posteriores — 2025/2026

A pesquisa de notícias e páginas oficiais do MINFIN/AGT encontrou o índice de Legislação com OGE 2026, a comunicação operacional de 27/08/2026 sobre o pagamento provisório do II e uma área de medidas fiscais que inclui alterações ao IRT e regimes especiais. Também apareceu a página oficial do regime MPME com taxas efectivas dependentes da zona e condições próprias. Estes resultados não foram convertidos em taxa geral nem em regra automática: regimes MPME, medidas de OGE, tabelas de IRT e alterações específicas devem ser modelados como camadas versionadas, com elegibilidade e vigência próprias. A página oficial de impostos continua a publicar 25% como taxa geral do II, mas isso não elimina a necessidade de aplicar camadas especiais quando o sujeito passivo for elegível.

## Conferência adicional no navegador — DLP n.º 3/14

A página consultada apresenta o DLP n.º 3/14 como revisão e republicação do Código do Imposto do Selo, publicado no Diário da República I Série n.º 191 de 21 de Outubro de 2014. O texto visível confirma no artigo 1.º a incidência segundo a tabela anexa ou leis especiais e no artigo 12.º que as taxas são as constantes da tabela anexa em vigor no momento em que o imposto é devido. A busca visual directa pela expressão `23.3` não devolveu uma ocorrência navegável no recorte actual; por isso, a verba 23.3 a 1% permanece suportada pela remissão legível no OCR da Lei n.º 14/23, não pela tabela integral do DLP nesta consulta. O ERP mantém essa referência condicionada e não cria uma taxa universal de IS.

## Confirmação oficial AGT em 27/08/2026

A leitura actualizada da página AGT mostrou a Folha Tributária n.º 94, edição Junho de 2026, e o Calendário Fiscal 2026 disponíveis para download. A mesma página exibe o comunicado de 27/08/2026 sobre liquidação e pagamento provisório do Imposto Industrial para contribuintes do regime geral, indicando o termo do prazo em 31 de Agosto de 2026. Este achado reforça que prazos e obrigações devem ser versionados no calendário fiscal por exercício e regime, não codificados como constantes fiscais universais. O motor já mantém o calendário separado da taxa e das regras contabilísticas.

A pesquisa também confirmou a necessidade de distinguir a taxa geral do II dos regimes especiais e das medidas fiscais anuais. Nenhuma nova regra de posting ou taxa de OGE/MPME foi activada nesta etapa.

## Busca institucional adicional — Imposto do Selo

A pesquisa adicional em páginas AGT/MINFIN encontrou o Guia do Sistema Tributário Angolano 2017 e referências institucionais ao DLP n.º 3/14, mas o Guia declara não substituir a legislação integral. A página AGT de impostos disponibiliza o Calendário Fiscal 2026 e notícias operacionais, sem expor a tabela integral de verbas do IS. Um activo CMS localizado na pesquisa corresponde a uma proposta/documento do OGE 2022, não ao OGE 2026 nem à tabela do IS, pelo que não foi incorporado como fonte fiscal vigente. O bloqueio da tabela integral permanece legítimo.

## OGE 2026 — confirmação institucional adicional

A pesquisa no MINFIN encontrou a página oficial de propostas do OGE 2026: https://www.minfin.gov.ao/oge/proposta-oge. Também encontrou a comunicação oficial do MINFIN que identifica o OGE 2026 como aprovado pela **Lei n.º 14/25, de 30 de Dezembro**: https://www.minfin.gov.ao/sala-de-imprensa/noticias/noticia/rigor-na-execucao-do-oge-2026. O activo CMS institucional com o texto da lei aparece em https://cms.minfin.gov.ao/api/assets/portal-minfin/8983392b-8784-45d7-a23d-1aa35cf938b4/. Esta confirmação é suficiente para catalogar a Lei do OGE 2026 como camada anual de referência e vigência do exercício, mas não autoriza assumir que alterou taxas gerais de II, IRT, IVA, IP ou IS sem ler os artigos tributários específicos do diploma. A camada OGE continua separada das tabelas gerais e de regras de posting.

### OGE 2026 — artigos fiscais concretos conferidos no texto institucional

A leitura das páginas OCR do documento institucional confirmou: artigo 16.º cria Contribuição Especial sobre Operações Cambiais, com base no montante em moeda nacional e taxas de 2,5% para pessoas singulares e 10% para pessoas colectivas, com exclusões e isenções próprias; artigo 21.º prevê, para Grupo C nas condições do n.º 1, matéria colectável sobre vendas não sujeitas a retenção a 6,5%, isenção de rendimentos até 150.000 Kz conforme Anexo I e taxa de 10% para certas actividades agropecuárias/piscatórias acima do limiar; artigo 22.º exige submissão electrónica para II geral/simplificado e prevê amortizações condicionadas de 5 anos e até 8 anos; artigo 23.º prevê IVA de 5% para equipamento industrial mediante solicitação, aprovação AGT e prova de finalidade, além de mudança de regime até ao fim do mês seguinte quando ultrapassados limiares; artigo 27.º isenta transmissões habitacionais até 40.000.000 Kz e reduz em 50% a taxa entre mais de 40.000.000 e 100.000.000 Kz; artigo 30.º isenta IS da verba 16 para operações do MMI e da verba 7.3 para aumento de capital de sociedade comercial legalmente constituída. Todas estas medidas são camadas anuais e condicionadas: foram catalogadas como REFERENCE_ONLY, sem substituir os códigos-base, sem alterar taxas gerais e sem activar posting automático. A Contribuição Especial sobre Operações Cambiais foi preservada como matéria de possível extensão futura, não adicionada silenciosamente às cinco cadeias actuais.
