# BALANCERTS.ERP — Parecer documental pré-implementação

## Finalidade e regra de aprovação

Este parecer foi preparado **sem alterar código, schema, dados, permissões, routers, interfaces, migrações ou integrações**. O objectivo é confrontar os requisitos abertos do BALANCERTS.ERP com fontes públicas verificáveis e separar claramente o que pode ser implementado localmente do que exige confirmação oficial, credenciais, contrato ou ambiente externo.

> **Regra vinculativa proposta:** nenhuma conta PGCA, taxa de IVA/retenção, obrigação fiscal, integração AGT, integração bancária, restauro de produção ou assinatura Windows deve ser activada com base em suposição, snippet ou dado de demonstração.

## Síntese executiva

A pesquisa confirma quatro conclusões principais. Primeiro, o **Decreto n.º 82/01** é a referência oficial do Plano Geral de Contabilidade para o sector empresarial angolano, e o CNNCA disponibiliza a entrada do diploma e o respectivo PDF no seu portal. Segundo, a **Lei n.º 14/23** alterou numerosos artigos do Código do IVA; contudo, a lista completa de regras aplicáveis deve ser confrontada com o texto oficial integral e alterações posteriores antes de activação. Terceiro, a AGT já utiliza SAF-T como base de automatização da Declaração Periódica do IVA, mas exige software de facturação previamente validado e submissão regular de SAF-T. Quarto, banca, restauro isolado e distribuição Windows têm pré-condições externas que o sandbox não consegue criar legitimamente.

| Área | Estado documental | Pode avançar sem confirmação externa? | Decisão proposta |
|---|---|---:|---|
| PGCA/Decreto n.º 82/01 | Referência oficial localizada; PDF integral ainda precisa de confirmação e catalogação | Parcialmente | Manter catálogo em PENDING; não activar contas novas |
| IVA/Lei n.º 14/23 | Alterações identificadas; vigência consolidada e alterações posteriores ainda precisam de conferência | Parcialmente | Manter fontes e regras em PENDING; preparar estrutura versionada |
| AGT/SAF-T | Requisitos operacionais confirmados pela comunicação oficial da AGT | Não para homologação | Manter exportação/validação local; homologação e submissão real ficam bloqueadas |
| Banca | BNA disponibiliza informação institucional sobre sistemas de pagamentos, não um contrato de API empresarial aberto | Não | Preparar adaptadores e importação; aguardar banco/fornecedor e credenciais |
| Restauro | TiDB exige destino vazio/novo ou offline e compatibilidade | Não sem destino | Só executar depois de existir `RESTORE_DATABASE_URL` isolada |
| Windows | Microsoft distingue Store/MSIX, assinatura externa e autoassinatura | Não sem certificado/máquina | Preparar pipeline; validar e assinar fora do sandbox |
| Aceitação | Requer utilizadores e dados controlados da Repair Lubatec | Não | Agendar sessão de aceitação após os blocos técnicos |

## 1. PGCA e Decreto n.º 82/01

O portal institucional do **Conselho Nacional de Normalização Contabilística de Angola** apresenta, na área de legislação do sector empresarial, a entrada “Decreto n.º 82/01 de 16 de Novembro”, descrita como “Aprova o Plano Geral de Contabilidade”, com ligação para o PDF do diploma [1]. A fonte pública AngoLEX também reproduz o texto do diploma e confirma o seu objecto [2].

A arquitectura actual do BALANCERTS.ERP já possui metamodelo versionado, fontes normativas, workflow de revisão e activação, contas PGCA em rascunho, auditoria de mapeamento e resolução server-side por AccountingRules. Esta arquitectura é compatível com o princípio documental, mas a importação integral da lista de contas não deve ser declarada concluída enquanto o PDF oficial não for lido integralmente, extraído, revisto e reconciliado hierarquicamente.

**Proposta para confirmação:** manter a fonte do Decreto n.º 82/01 e as contas ainda não confirmadas em estado `PENDING`; após aprovação formal, importar a estrutura integral com código, designação, pai, natureza, postabilidade e referência de página/artigo; executar reconciliação sem reescrever históricos; activar somente após validação humana.

## 2. IVA, Lei n.º 14/23 e alterações posteriores

A fonte pública consultada para a Lei n.º 14/23 identifica o diploma como a primeira alteração ao Código do IVA e enumera alterações a numerosos artigos, abrangendo definições, incidência, transmissões de bens e serviços, localização, facto gerador, exigibilidade, isenções, importações, exportações, obrigações e outros aspectos [3]. A mesma fonte apresenta, entre outros exemplos, alterações relativas a amostras/ofertas, operações isentas e renúncia à isenção.

O portal da AGT mantém uma área de legislação IVA com consulta pública, boletim mensal, relatórios do IVA, comunicados, instrutivos, despachos, leis, decretos executivos e decretos presidenciais [4]. Isto confirma que a fonte normativa não deve ser tratada como um único diploma isolado: é necessário catalogar a norma, a data, a vigência, o âmbito, a taxa/regra, a fonte oficial e o estado de validação.

**Proposta para confirmação:** criar ou completar o catálogo versionado de IVA e retenções sem activar taxas conjecturais; separar natureza do dado, autoridade da fonte e vigência; exigir revisão humana para cada regra; conservar versões anteriores; ligar regras a documentos e pagamentos somente após validação normativa.

## 3. AGT, SAF-T e facturação

Numa comunicação oficial de 22 de Abril de 2025, a AGT informou que, a partir de Maio de 2025, seria disponibilizada submissão automática da Declaração Periódica do IVA com base nos ficheiros SAF-T submetidos. A comunicação descreve uma primeira fase para o Anexo de Fornecedores e uma segunda fase, a partir de Agosto de 2025, para campos do IVA liquidado com base no SAF-T de vendas do próprio declarante [5]. A medida abrange os regimes geral e simplificado, com a excepção indicada na própria comunicação para sociedades investidoras petrolíferas.

A AGT declara também que, para beneficiar da funcionalidade, a empresa deve utilizar software de facturação previamente validado pela AGT e manter a submissão regular do SAF-T de vendas. A comunicação identifica campos que continuam a exigir tratamento manual, incluindo IVA auto-liquidado de serviços estrangeiros, IVA cativo, IVA dedutível/não dedutível e tipologia documental [5].

**Impacto:** o BALANCERTS.ERP pode e deve manter exportação SAF-T, validação estrutural, reconciliação e preparação de pacotes. Porém, isto não equivale a homologação nem a submissão automática real. A activação requer documentação técnica oficial, endpoint, credenciais, certificado/identidade do contribuinte e confirmação do processo de validação do software.

## 4. Banca e pagamentos

O portal do Banco Nacional de Angola apresenta informação institucional, legislação e normas, sistemas de pagamentos, supervisão e publicações [6]. Na consulta realizada não foi localizado um contrato de API empresarial aberta para todos os bancos, nem documentação que autorize assumir um formato único de extracto, pagamento ou autenticação.

**Impacto:** o produto deve permanecer agnóstico ao banco e suportar importação de extractos, reconciliação auditável, referências externas, pagamentos pendentes e adaptadores por instituição. Uma integração real só deve ser desenvolvida depois de receber do banco ou fornecedor autorizado a documentação técnica, ambiente de testes, credenciais, certificados, limites, callbacks, política de idempotência e autorização da empresa.

## 5. Backup, restauro e isolamento

A documentação oficial TiDB Backup & Restore recomenda restaurar para um novo cluster ou cluster offline e evitar o restauro em produção. A documentação também indica que PITR requer um cluster vazio, que existem restrições de compatibilidade e que a clonagem do ambiente de produção é útil para troubleshooting, afinação e testes [7].

**Critério obrigatório:** `RESTORE_DATABASE_URL` só pode ser configurada quando existir um destino real, isolado, com versão compatível, utilizador restrito, backup identificável e evidência de que não aponta para produção. O teste deve validar schema, contagens, relações, isolamento por tenant, relatórios, auditoria, posting bloqueado/permitido e rollback do próprio ambiente de teste.

## 6. Distribuição e assinatura Windows

A documentação oficial Microsoft Learn explica que pacotes MSIX publicados através da Microsoft Store são re-assinados pela Microsoft após certificação. Para MSI/EXE, o editor continua responsável pela assinatura. Fora da Store, a documentação compara Azure Artifact Signing, certificados OV, EV e autoassinados [8]. Certificados autoassinados são apropriados para desenvolvimento/teste ou ambientes empresariais controlados, não para distribuição pública. A documentação também esclarece que certificados EV deixaram de proporcionar bypass instantâneo do SmartScreen desde 2024; a reputação deve construir-se ao longo do tempo [8].

**Impacto:** pode ser preparado o empacotamento, manifesto, pipeline e checklist de assinatura. A validação numa máquina Windows limpa, a aquisição do certificado, a custódia da chave privada, a assinatura real e a medição do comportamento SmartScreen exigem ambiente e credenciais externos.

## 7. Confronto com a arquitectura actual

| Requisito | Arquitectura actual | Compatibilidade | Risco se implementado sem aprovação |
|---|---|---|---|
| Contas PGCA versionadas | Metamodelo, fontes, workflow e AccountingRules | Compatível | Activar conta errada ou alterar histórico |
| IVA versionado | Motor fiscal e fontes normativas persistentes | Compatível como estrutura | Activar taxa/regra vencida ou incompleta |
| SAF-T | Exportação/validação local e relatórios fiscais | Compatível como preparação | Confundir ficheiro válido com homologação AGT |
| Integração bancária | Cash accounts, extractos, reconciliação e auditoria | Compatível como adaptador | Expor credenciais ou assumir formato bancário errado |
| Restauro | Runbook e variáveis preparadas | Compatível como preparação | Escrever na produção ou restaurar esquema incompatível |
| Windows | PWA/software desktop e preparação de distribuição | Parcialmente compatível | Prometer assinatura/SmartScreen sem certificado |
| Aceitação empresarial | Testes automatizados e dados controlados | Compatível como preparação | Declarar aceitação sem utilizadores reais |

## 8. Decisões que aguardam a sua confirmação

Recomendo confirmar os seguintes pontos antes de qualquer alteração de código:

| Código | Proposta |
|---|---|
| D1 | Autorizar apenas a preparação estrutural do catálogo PGCA/IVA em estado PENDING, sem activação automática |
| D2 | Autorizar a implementação dos adaptadores internos de SAF-T e pacotes AGT, sem submissão real |
| D3 | Autorizar a preparação de adaptadores bancários genéricos, mantendo importação/reconciliação como modo operacional principal |
| D4 | Autorizar o runbook de restauro e testes apenas quando for fornecida uma `RESTORE_DATABASE_URL` isolada |
| D5 | Escolher distribuição Windows prioritária: Microsoft Store/MSIX ou MSI/EXE assinado externamente |
| D6 | Confirmar que a aceitação Repair Lubatec será executada posteriormente com dados anonimizados/controlados |

## Parecer

**Resultado desta fase: APRESENTADO PARA CONFIRMAÇÃO — NÃO IMPLEMENTAR AINDA.**

A pesquisa encontrou evidência suficiente para avançar com preparação estrutural, estados pendentes, validações, exportação, runbooks e adaptadores sem activar integrações ou regras normativas. Não encontrou base suficiente para declarar concluídas a homologação AGT, a integração bancária, o restauro real, a assinatura Windows, a aceitação empresarial ou a importação/activação integral do PGCA/IVA.

Para a próxima fase, aguardo a sua confirmação dos códigos D1–D6. Sem essa confirmação, não serão feitas alterações de implementação relacionadas com estes pontos.

## Referências

[1]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial "CNNCA — Sector Empresarial, Decreto n.º 82/01"
[2]: https://angolex.com/paginas/decreto-presidencial/plano-geral-de-contabilidade-angolano-82a-01a.html "AngoLEX — Decreto n.º 82/01"
[3]: https://angolex.com/paginas/codigos/alteracao-do-codigo-do-imposto-sobre-o-valor-acrescentado-14a-23a.html "AngoLEX — Lei n.º 14/23"
[4]: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao "AGT — Legislação IVA"
[5]: https://agt.minfin.gov.ao/PortalAGT/#!/sala-de-imprensa/noticias/14131/iva-submissao-automatica-da-declaracao-periodica-implementada-a-partir-de-maio "AGT — Submissão automática da Declaração Periódica do IVA"
[6]: https://www.bna.ao/ "Banco Nacional de Angola"
[7]: https://docs.pingcap.com/tidb/stable/backup-and-restore-overview/ "TiDB — Backup & Restore Overview"
[8]: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options "Microsoft Learn — Code signing options for Windows app developers"
