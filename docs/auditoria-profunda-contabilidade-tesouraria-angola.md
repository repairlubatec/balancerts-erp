# Auditoria profunda de Contabilidade e Tesouraria

**BALANCERTS.ERP — mercado angolano**  
**Data da análise: 19 de Agosto de 2026**  
**Autor: Manus AI**

## 1. Conclusão executiva

A análise do código, do esquema de dados, dos testes, dos materiais do projecto e das fontes institucionais angolanas mostra que o BALANCERTS.ERP já possui um núcleo sólido de dupla partida, períodos fiscais, plano de contas por empresa, mapas contabilísticos, centros de custo, importação controlada, arquivo documental, auditoria, reconciliação de tesouraria, RBAC e isolamento por empresa. Este núcleo é superior a uma maqueta e já suporta uma parte real do trabalho diário.

Contudo, **ainda não deve ser considerado um produto contabilístico e financeiro completo para comercialização no mercado angolano**. As lacunas mais importantes estão na parametrização normativa versionada, no sub-registo fiscal e de retenções, no ciclo de revisão e aprovação contabilística, nas regularizações e reclassificações, no fecho materialmente validado, na reconciliação bancária baseada em linhas de extracto, na gestão profissional de pagamentos e na previsão de tesouraria.

A conclusão mais importante é esta: **o projecto tem o motor, mas ainda precisa de completar os instrumentos de trabalho e os controlos de operação**. A conformidade deve ser afirmada por capacidade preparada e evidência de testes, não por declarar certificação AGT ou homologação bancária antes dessas validações.

> O PGCA actualmente referenciado no portal institucional do CNNCA é aprovado pelo Decreto n.º 82/01, de 16 de Novembro. A solução deve manter a fonte e a versão normativa explícitas, em vez de chamar “actualizado” a um plano sem revisão formal de diploma ou instrução oficial.[1]

## 2. Base da auditoria

A auditoria combinou quatro camadas: leitura do código e esquema do projecto; revisão dos testes e contratos tRPC; consulta dos documentos internos do projecto, incluindo materiais de Contabilidade PMR e a documentação AGT já reunida; e pesquisa de fontes institucionais angolanas, principalmente CNNCA, AGT e BNA.

| Camada | Evidência utilizada | Resultado |
|---|---|---|
| Código | `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`, relatórios e componentes | Inventário funcional e lacunas de dados |
| Segurança | RBAC, isolamento tenant, matriz de auditoria e testes | Boa base de controlo, mas precisa de segregação operacional mais fina |
| Normativa | CNNCA e AGT | Requisitos PGCA, IVA, SAF-T e calendário fiscal a considerar |
| Tesouraria | BNA, esquema de caixa/bancos e reconciliação | Necessidade de ciclo bancário, canais, extractos e pagamentos mais completos |
| Qualidade | Suite actual do projecto | 60 ficheiros e 219 testes no checkpoint d008e9dd |

As páginas da AGT são aplicações dinâmicas. Quando a extracção não expôs o corpo completo de uma notícia ou anexo, a informação foi tratada como indício institucional e não como base para fixar automaticamente taxas, prazos ou uma obrigação nova.

## 3. O que já está bem implementado

### 3.1 Contabilidade

O modelo possui exercícios e períodos mensais por empresa, com estados de abertura, encerramento e reabertura. O plano de contas tem código, nome, hierarquia, lançabilidade e vigência. O lançamento usa dupla partida, linhas de débito e crédito, moeda e taxa de câmbio, chave de idempotência e estados de publicado/revertido.

O posto contabilístico já foi ampliado com Diário, Balancete, Demonstração de Resultados e Balanço por período; campos de diário, referência documental, ficheiro do arquivo, centro de custo e dimensão analítica; centros de custo persistentes; importação CSV com pré-validação, resolução de códigos PGCA e idempotência; e avaliação/encerramento auditado.

### 3.2 Tesouraria

O modelo possui contas de caixa e banco por empresa, moeda, pagamentos e recebimentos, movimentos de tesouraria por período, estados de reconciliação, reconciliação individual com motivo e auditoria. O fluxo já contempla métodos de caixa, transferência bancária, cartão e outros, além de idempotência e associação opcional ao lançamento contabilístico.

A selecção da empresa e do período é feita numa janela interna desktop com calendário, e o fluxo de preenchimento usa Enter para avançar entre campos. Esta experiência está alinhada com o objectivo de software desktop e não de página web.

## 4. Lacunas da Contabilidade

| Lacuna | Estado actual | Prioridade | Porque importa em Angola |
|---|---|---:|---|
| Versão e origem do PGCA | Há contas por empresa, mas não há pacote normativo versionado, data de adopção, fonte, alterações e comparação entre versões | P0 | O Decreto 82/01 é a fonte institucional identificada; alterações futuras devem ser rastreáveis[1] |
| Sub-registo fiscal | Não existe um livro fiscal completo para IVA liquidado/suportado, retenções, imposto industrial, IAC, IRT e outros impostos aplicáveis | P0 | A AGT disponibiliza informação separada para vários impostos, regimes e obrigações[2] |
| IVA por operação | O ERP trata regimes na empresa e documentos, mas a Contabilidade precisa de mapas de IVA por taxa, regime, dedução, retenção, isenção, período e origem | P0 | A AGT distingue Regime Geral, Simplificado e Exclusão, com regras distintas de apuramento e dedução[3] |
| Retenções | Falta ciclo de cálculo, retenção, certificado, pagamento, declaração e reconciliação por beneficiário | P0 | A informação oficial da AGT trata retenções e impostos sobre rendimentos como obrigações próprias; não devem ser reduzidos a uma descrição livre[2] |
| Lançamento em rascunho | O modelo tem `reviewStatus`, mas o posto precisa de ciclo explícito rascunho → validação → aprovação → publicação, com permissões separadas | P0 | Segregação de funções é controlo comercial essencial e reduz risco de erro ou fraude |
| Regularizações e reclassificações | Não há fluxo profissional completo com motivo, origem, aprovação, impacto e reversibilidade | P0 | São operações normais de fecho e correcção contabilística |
| Datas contabilísticas | Há `createdAt` e período, mas o contabilista precisa de data do documento, data contabilística, data de vencimento e data de liquidação distintas | P0 | Sem estas datas os mapas, aging, IVA e fecho podem ficar materialmente errados |
| Numeração por diário | Existe `idempotencyKey`, mas não está demonstrada uma numeração sequencial por série/diário com controlo de saltos e motivos | P0 | O diário deve ser auditável e reproduzível; uma chave técnica não substitui número contabilístico visível |
| Plano analítico | `costCenter` e `analyticalDimension` também existem como texto livre, apesar da tabela de centros de custo | P1 | O texto livre impede validação, mapas comparáveis e controlo de centros activos |
| Saldos iniciais | Não foi demonstrado fluxo completo de abertura de saldos, transporte, validação e fecho do exercício anterior | P1 | Empresas já existentes precisam de migração e continuidade contabilística |
| Moeda e reexpressão | Há moeda e taxa na linha, mas falta política de fonte, data da taxa, diferenças cambiais realizadas/não realizadas e reavaliação de saldos | P1 | O BNA publica informação de câmbio e o mercado angolano opera com AOA e operações em moeda estrangeira[4] |
| Imobilizado e depreciação | Existe módulo de imobilizado e lançamento de depreciação, mas falta integração completa com mapas contabilísticos, alterações, alienações, imparidades e fecho | P1 | A depreciação deve ser controlada por activo, conta, período e suporte |
| Inventário e custo | Existe stock e integração de recepção, mas falta confirmar custo médio/FIFO, diferenças de inventário, perdas, regularizações e ligação integral ao custo das vendas | P1 | A contabilidade de empresas comerciais não pode depender apenas de movimentos de quantidade |
| Exportação | Existem relatórios internos, mas a auditoria deve confirmar exportação estável para Excel/PDF/CSV e pacote de auditoria | P1 | O contabilista precisa de entregar mapas, conferir e arquivar evidência |
| Fecho material | O painel actual envia verificações pré-definidas; precisa de calcular os bloqueios a partir de dados reais | P0 | Não se deve encerrar só porque a interface enviou três verificações como verdadeiras |

### 4.1 Ponto crítico: fecho

O fecho deve bloquear quando existirem lançamentos desequilibrados, documentos fiscais por validar, períodos anteriores abertos, reconciliações relevantes não concluídas, contas transitórias sem explicação, diferenças de inventário, impostos por apurar ou importações em revisão. A avaliação actual tem a forma correcta de um fluxo auditado, mas precisa de substituir verificações fixas por verificações calculadas no servidor.

### 4.2 Ponto crítico: PGCA actualizado

O sistema deve ter um **catálogo normativo versionado**, não apenas uma tabela de contas. Cada pacote deverá indicar diploma/fonte, versão, data de vigência, classes, contas, contas de movimento, relações de demonstrações financeiras, contas fiscais e regras de migração. A empresa deverá poder adoptar o pacote e manter alterações próprias sem perder a origem oficial.

## 5. Lacunas da Tesouraria

| Lacuna | Estado actual | Prioridade | Resultado esperado |
|---|---|---:|---|
| Cadastro bancário | A conta tem nome, tipo, número e moeda; faltam banco, código do banco, agência, IBAN ou identificador equivalente, titular, estado de validação e conta contabilística associada | P0 | Conta bancária identificável e conciliável |
| Extracto bancário | Há tabela de reconciliação, mas não foi demonstrado importador de extractos, linhas bancárias, hash do ficheiro, formato, duplicados e correspondência | P0 | Reconciliação por linha de extracto, com evidência e reprocessamento seguro |
| Reconciliação | Existe reconciliação individual, mas falta ciclo completo por extracto: abertura, importação, correspondência automática, diferenças, ajustes autorizados, fecho e relatório | P0 | Saldo contabilístico, saldo bancário e diferença explicados |
| Pagamentos | Existem pagamentos/recebimentos, mas faltam beneficiário estruturado, referência bancária, data de execução, data-valor, taxa/custo bancário e comprovativo | P0 | Rastrear pedido, aprovação, execução e liquidação |
| Aprovação | O RBAC existe, mas a tesouraria precisa de separar preparar, aprovar, executar, cancelar e reconciliar | P0 | Segregação de funções e controlo de pagamentos |
| Pagamentos em lote | Não foi demonstrado lote de pagamentos com aprovação, ficheiro bancário, confirmação parcial e reprocessamento | P1 | Operação eficiente para fornecedores, salários e obrigações |
| Transferências internas | Não foi demonstrado fluxo atómico entre duas contas da mesma empresa, com duas pernas e reconciliação | P0 | Evitar saldos artificiais e movimentos incompletos |
| Caixa físico | Não foi demonstrado fecho diário, contagem, fundo fixo, diferenças, responsável e aprovação | P1 | Controlo de caixa de lojas e operações presenciais |
| Previsão de tesouraria | Não há previsão por vencimentos, compromissos, impostos, salários, compras e cenários | P1 | Decisão financeira antes da falta de liquidez |
| Contas a receber/pagar | Aging existe em relatórios, mas a tesouraria precisa de agenda de vencimentos, promessas de pagamento, cobranças e prioridades | P1 | Ligação entre facturação, compras e caixa |
| Custos bancários | Não existe modelo claro para comissões, juros, impostos/custos bancários e reconciliação automática | P1 | Saldo bancário e resultado contabilístico coerentes |
| Moeda estrangeira | A conta tem moeda e o lançamento tem taxa, mas falta taxa com fonte/data, reavaliação, ganho/perda e controlo de liquidação | P1 | Tratar USD/EUR/ZAR sem diferenças ocultas |
| Integração bancária | Não existe integração real com banco/API/ficheiro oficial | P2 dependente de banco | Só pode ser homologada com especificação, contrato, credenciais e ambiente do banco |
| Meios de pagamento angolanos | O modelo genérico cobre caixa, transferência e cartão, mas não representa referências, TPA, pagamentos móveis e canais específicos | P1 | O BNA identifica a diversidade de canais e agentes de pagamentos[5] |

### 5.1 Ponto crítico: reconciliação bancária

A reconciliação não deve ser apenas um botão que muda `UNRECONCILED` para `RECONCILED`. Deve guardar o extracto, a linha bancária, a regra de correspondência, o lançamento associado, a diferença, o utilizador, a data, a evidência e o motivo de qualquer ajuste. A reconciliação automática deve sugerir; a aprovação humana deve decidir; o fecho deve impedir diferenças não justificadas acima de um limite configurável.

### 5.2 Ponto crítico: pagamentos e liquidez

A Tesouraria comercial precisa de um ciclo de pedido, validação documental, aprovação, execução, confirmação do banco, contabilização, reconciliação e arquivo. Hoje existem movimentos e estados, mas ainda não está demonstrado o ciclo completo de pagamento profissional, nem uma previsão de caixa alimentada por compromissos reais.

## 6. Requisitos angolanos que devem orientar o produto

A AGT disponibiliza informação oficial sobre Imposto Industrial, IVA, Imposto sobre Aplicação de Capitais, Imposto Especial de Consumo e outros impostos. A própria página de impostos descreve regimes de IVA Geral, Simplificado e Exclusão e regras diferentes para apuramento, dedução e obrigações. O ERP deve, por isso, modelar regime, período, taxa, base, imposto, retenção, documento de origem e declaração, em vez de guardar apenas um total fiscal.[2] [3]

A AGT também mantém um Calendário Fiscal 2026, que deve ser tratado no produto como catálogo de obrigações versionado por ano e regime, com prazo, evento, declaração, pagamento, estado, responsável, evidência e alerta. Não é seguro hardcodar um calendário de um ano ou assumir que todas as empresas têm as mesmas obrigações.[6]

Quanto ao SAF-T, a AGT publicou orientação sobre ficheiros de Facturação e Aquisição de Bens e Serviços. O ERP já tem preparação SAF-T, mas deve garantir cobertura do universo contabilístico e fiscal, validação XSD quando o XSD oficial aplicável estiver disponível, regras de códigos oficiais, exportação determinística, hash/evidência e fila de reprocessamento. A submissão real continua dependente de endpoint, credenciais, especificação e homologação.[7]

O BNA apresenta no portal institucional informação de taxas de câmbio e moeda, e mantém ligações para o ecossistema de pagamentos. O produto deve tratar a taxa de câmbio como dado datado e com fonte, não como número manual sem evidência. O BNA também identifica meios de pagamentos móveis e diferentes pontos de acesso, o que reforça a necessidade de canais de tesouraria parametrizáveis.[4] [5]

## 7. Classificação de prioridade

| Prioridade | Conteúdo | Critério |
|---|---|---|
| P0 — obrigatório antes de venda comercial | Sub-registo fiscal, IVA e retenções; aprovação contabilística; datas e numeração; fecho real; cadastro bancário; extracto e reconciliação por linha; transferências internas; aprovação de pagamentos | Sem estes controlos há risco material de erro, falta de evidência ou operação financeira incompleta |
| P1 — necessário para um ERP profissional | Saldos iniciais; regularizações; reclassificações; mapas analíticos; imobilizado completo; inventário contabilístico; caixa físico; previsão; aging operacional; custos bancários; moeda estrangeira; pagamentos em lote | Diferencia um núcleo contabilístico de um posto de trabalho comercial |
| P2 — dependente de terceiros | Integração AGT real; integração bancária/API; ficheiros bancários homologados; submissão e confirmação externa | Depende de credenciais, contratos, endpoints, XSD, certificados e homologação |
| P3 — expansão | Orçamento, tesouraria avançada, consolidação, múltiplas entidades, relatórios de gestão e fluxos específicos por sector | Valor comercial adicional depois do núcleo controlado |

## 8. Veredicto por módulo

| Módulo | Estado técnico actual | Estado para mercado angolano | Decisão |
|---|---|---|---|
| Contabilidade | Núcleo funcional avançado, com dupla partida, PGCA parametrizado, mapas, suporte e fecho | Incompleto por falta de sub-registo fiscal, workflow contabilístico completo, fecho material, regularizações e abertura de saldos | Continuar P0 antes de declarar pronto para venda |
| Tesouraria | Núcleo funcional com contas, pagamentos, movimentos e reconciliação básica | Incompleto por falta de extractos por linha, ciclo de pagamentos, aprovação, transferências, caixa físico e previsão | Continuar P0 em paralelo com Contabilidade |
| AGT/SAF-T | Preparação interna, sem integração real | Não homologado | Manter desligado até documentação e credenciais oficiais |
| Bancos | Sem integração externa real | Não homologado | Implementar primeiro importação controlada de extractos; depois adaptadores por banco |

## 9. Sequência recomendada de implementação

A primeira fase deve completar o modelo fiscal e o calendário de obrigações: impostos por tipo, regime e operação; retenções; mapas; documentos de cobrança e evidências. Em paralelo deve ser criado o workflow contabilístico com rascunho, validação, aprovação, publicação, reversão, regularização e reclassificação.

A segunda fase deve consolidar o ciclo de tesouraria: cadastro bancário completo, extractos, linhas bancárias, correspondência, diferenças, transferências internas, pagamentos aprovados, comprovativos, custos bancários e reconciliação fechada. Só depois deve ser construída a previsão de liquidez e a automação por lotes.

A terceira fase deve criar o pacote PGCA versionado e os mapas oficiais de exportação, com testes de saldos, continuidade entre exercícios e reexecução determinística. A quarta fase deve tratar integrações externas, sempre como adaptadores desligados por defeito e com evidência de homologação separada.

## 10. Limites e declaração de conformidade

Esta auditoria identifica requisitos e lacunas de produto; não substitui parecer de contabilista certificado, advogado fiscal, auditor independente, banco ou AGT. A fonte institucional consultada confirma o Decreto 82/01 como base do PGCA apresentado pelo CNNCA, mas não prova que não exista diploma posterior aplicável a um sector específico. As regras e taxas fiscais devem ser parametrizadas por vigência, fonte e regime.

O BALANCERTS.ERP pode afirmar que está **preparado para evolução SAF-T e integração AGT**, mas não deve afirmar certificação, validação ou homologação AGT antes da aprovação formal. Do mesmo modo, não deve afirmar integração bancária até haver especificação e testes com cada banco.

## Referências

[1]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial "CNNCA — Legislação do Sector Empresarial: Decreto n.º 82/01"
[2]: https://www.agt.minfin.gov.ao/PortalAGT/#!/servicos/impostos/impostos-e-taxas "AGT — Impostos e Taxas"
[3]: https://www.agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//impostos "AGT — Impostos"
[4]: https://www.bna.ao/ "Banco Nacional de Angola — portal institucional, câmbio e sistema financeiro"
[5]: https://pef.bna.ao/ "BNA — Portal de Educação e Inclusão Financeira"
[6]: https://agt.minfin.gov.ao/PortalAGT/#!/servicos-fiscais//calendario-fiscal "AGT — Calendário Fiscal 2026"
[7]: https://agt.minfin.gov.ao/PortalAGT/#!/sala-de-imprensa/noticias/7304/sobre-a-submissao-dos-ficheiros-saf-t-do-tipo-facturacao-e-do-tipo-aquisicao-de-bens-e-servicos "AGT — SAF-T de Facturação e Aquisição de Bens e Serviços"
[8]: https://pontosdeacesso.bna.ao/ "BNA — Pontos de Acesso: agências, agentes e caixas automáticos"
