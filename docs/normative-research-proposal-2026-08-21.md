# Pesquisa documental para aprovação — 21/08/2026

## Evidências consultadas

1. **CNNCA — Sector Empresarial**: o portal institucional do Conselho Nacional de Normalização Contabilística de Angola disponibiliza a entrada “Decreto n.º 82/01 de 16 de Novembro”, descrita como “Aprova o Plano Geral de Contabilidade”, com referência a um PDF do diploma. Fonte: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial

2. **AGT — Legislação IVA**: o portal oficial da Administração Geral Tributária apresenta uma área de legislação IVA com “Consulta Pública - Alterações ao Código do IVA”, boletim mensal, relatórios do IVA, comunicados, instrutivos, despachos, leis, decretos executivos e decretos presidenciais. Fonte: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao

## Limites de certeza

A página CNNCA confirma a existência da referência oficial ao Decreto n.º 82/01, mas a leitura integral do PDF oficial ainda é necessária antes de importar toda a estrutura de contas. A página AGT confirma o repositório de legislação e publicações, mas os documentos posteriores e respectivas vigências precisam de ser identificados e lidos individualmente. Nenhuma regra fiscal ou conta normativa deve ser activada apenas com base nestas páginas de índice.

## AGT — SAF-T e submissão automática do IVA

A notícia oficial da AGT de 22/04/2025 informa que, a partir de Maio de 2025, a Declaração Periódica do IVA passou a ter submissão automática baseada nos ficheiros SAF-T submetidos. A primeira fase abrangia o Anexo de Fornecedores com dados de SAF-T de vendas de fornecedores e importações; a segunda fase, a partir de Agosto de 2025, abrangia campos do IVA liquidado com base no SAF-T de vendas do declarante. A medida aplica-se aos regimes geral e simplificado, com excepção indicada para sociedades investidoras petrolíferas. Para beneficiar, a empresa deve usar software de facturação previamente validado pela AGT e submeter regularmente o SAF-T de vendas. A mesma comunicação esclarece que algumas informações continuam manuais, incluindo IVA auto-liquidado de serviços estrangeiros, IVA cativo, IVA dedutível/não dedutível e tipologia documental.

Fonte: https://agt.minfin.gov.ao/PortalAGT/#!/sala-de-imprensa/noticias/14131/iva-submissao-automatica-da-declaracao-periodica-implementada-a-partir-de-maio

Impacto: o BALANCERTS.ERP deve manter exportação SAF-T, validação estrutural, reconciliação e preparação para homologação como capacidades separadas. Não se deve declarar integração automática AGT concluída sem validação do software, credenciais e canal oficial.

## BNA e integração bancária

A página pública do Banco Nacional de Angola apresenta secções institucionais para legislação e normas, sistemas de pagamentos, supervisão e publicações. A consulta não revelou, por si só, uma API pública de open banking ou um contrato de integração empresarial para extractos/pagamentos. Conclusão documental: o produto deve manter importação de extractos, reconciliação, exportação e preparação de adaptadores, mas qualquer ligação bancária real depende de documentação/contrato/credenciais do banco ou fornecedor autorizado.

Fonte: https://www.bna.ao/

## Distribuição e assinatura Windows

A documentação oficial Microsoft Learn indica que pacotes MSIX publicados pela Microsoft Store são re-assinados pela Microsoft após certificação; instaladores MSI/EXE submetidos à Store continuam a exigir assinatura do editor. Para distribuição fora da Store, a documentação compara Azure Artifact Signing, certificados OV, EV e certificados autoassinados. Certificados autoassinados são adequados para desenvolvimento/teste ou ambientes empresariais geridos, não para distribuição pública. A documentação também esclarece que certificados EV já não proporcionam bypass instantâneo do SmartScreen desde 2024 e que a reputação se constrói ao longo do tempo.

Fonte: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options

Impacto: o BALANCERTS.ERP pode preparar empacotamento e pipeline de assinatura, mas a validação de instaladores em máquina Windows limpa, aquisição/gestão do certificado e reputação SmartScreen são actividades externas. Não existe fundamento para prometer que um certificado elimina todos os avisos.

## Backup e restauro TiDB

A documentação oficial TiDB Backup & Restore recomenda restaurar para um novo cluster ou cluster offline e evitar a produção; descreve o restauro PITR para cluster vazio e a clonagem do ambiente de produção para troubleshooting e testes. Também alerta para compatibilidade de versões, armazenamento e tarefas concorrentes.

Fonte: https://docs.pingcap.com/tidb/stable/backup-and-restore-overview/

Impacto: a `RESTORE_DATABASE_URL` só deve apontar para um destino isolado, vazio ou sem conflitos, com evidência de backup, versão compatível e validação posterior dos módulos. A implementação local pode preparar procedimentos e verificações, mas não pode criar ou usar um destino externo que não foi fornecido.

## Verificação directa das abas oficiais — 21/08/2026

A página oficial do CNNCA/MinFin em https://cnnca.minfin.gov.ao/legislacao/sector-empresarial identifica expressamente “Decreto n.º 82/01 de 16 de Novembro”, com a descrição “Aprova o Plano Geral de Contabilidade” e um ficheiro PDF correspondente.

A página oficial da AGT em https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao contém a secção “Leis” e disponibiliza, entre outros, a Lei n.º 7/19 que aprova o Código do IVA e a Lei n.º 17/19 que altera artigos da Lei n.º 7/19 e do CIVA. Nesta consulta directa, a Lei n.º 14/23 não apareceu na lista visível; portanto, não deve ser catalogada automaticamente apenas com base nesta página. A confirmação da Lei n.º 14/23 exige localizar o documento integral noutra página oficial/jurídica ou receber o PDF exacto.

Conclusão operacional: as fontes oficiais confirmam o enquadramento do PGCA e a existência do CIVA, mas a activação de contas/taxas continua bloqueada até leitura do PDF integral exacto e confronto artigo a artigo.

A renderização directa do CNNCA confirmou visualmente o cartão “Decreto n.º 82/01 de 16 de Novembro”, a descrição “Aprova o Plano Geral de Contabilidade” e o elemento PDF “Decreto n.º 82/01 de 16 de Novembro.pdf”. A ligação directa ainda precisa de ser extraída do HTML para descarregar e ler o documento integral.

O cartão do CNNCA revelou a ligação directa do PDF oficial: https://cms.minfin.gov.ao/api/assets/portal-cnnca/70f43ca4-c46f-4e9a-b090-2216f69357f3/. A abertura desta ligação no navegador excedeu o tempo limite (HTTP 504); a leitura integral ainda não foi feita e nenhuma conta foi activada.

## Evidência visual do PDF recebido

O PDF recebido tem 97 páginas e corresponde ao Diário da República, I Série — n.º 52, de 16 de Novembro de 2001. As primeiras páginas mostram o Decreto n.º 82/01 do Conselho de Ministros, que aprova o Plano Geral de Contabilidade, incluindo a aplicação obrigatória às sociedades comerciais e empresas públicas abrangidas. O ficheiro está marcado como encriptado, sem extracção de texto autorizada; por isso, a leitura das contas deverá ser feita por OCR/visão página a página, preservando o PDF original sem o modificar.

A verificação visual das páginas 49–50 confirma que a lista oficial apresenta a classe 4 com “45 CAIXA”, “451 Fundo fixo”, “4511 Caixa” e “4512 Caixa”; a página seguinte apresenta “61 VENDAS”, “613 Mercadorias”, “6131 Mercado nacional” e “6132 Mercado estrangeiro”. Assim, o PDF recebido não mostra literalmente “4511 Caixa Kwanza”; mostra “4511 Caixa”. A designação “Caixa Kwanza” não deve ser gravada como texto oficial desta fonte sem uma evidência adicional ou decisão documental explícita. O código 6131 como “Mercado nacional” está confirmado visualmente.

A leitura visual adicional das páginas 48 a 52 confirma a sequência estrutural do plano oficial nesta zona do diploma. A página 48 encerra a classe 3 e introduz formalmente a classe 4 — Meios Monetários, com as rubricas 41 Títulos negociáveis, 42 Depósitos a prazo, 43 Depósitos à ordem, 44 Outros depósitos, 45 Caixa, 48 Conta transitória e 49 Provisões para aplicações de tesouraria. A página 49 detalha a conta 45, mostrando 451 Fundo fixo, 4511 Caixa e 4512 Caixa, além de 452 Valores para depositar e 453 Valores destinados a pagamentos específicos, com 4531 Salários.

A página 50 inicia a classe 6 — Proveitos e Ganhos por Natureza, confirmando 61 Vendas, 62 Prestações de serviço, 63 Outros proveitos operacionais, 64 Variação nos inventários de produtos acabados e de produção em curso, 65 Trabalhos para a própria empresa, 66 Proveitos e ganhos financeiros gerais, 67 Proveitos e ganhos financeiros em filiais e associadas, 68 Outros proveitos não operacionais e 69 Proveitos e ganhos extraordinários. Na mesma página, a conta 61 detalha 611 Produtos acabados e intermédios, 612 Sub-produtos, desperdícios, resíduos e refugos, 613 Mercadorias e 614 Embalagens de consumo, com 6131 Mercado nacional e 6132 Mercado estrangeiro claramente visíveis.

A página 51 prolonga a classe 6 com 615 Subsídios a preços, 617 Devoluções, 618 Descontos e abatimentos, 619 Transferência para resultados operacionais, 62 Prestações de serviço, 63 Outros proveitos operacionais, 64 Variação nos inventários e 65 Trabalhos para a própria empresa. A página 52 confirma o desenvolvimento da conta 66 e a passagem para 67 e 68. Estes achados bastam para validar documentalmente, com esta fonte, os códigos 4511 e 6131 e a organização oficial das classes 4 e 6, sem ainda inferir nomenclaturas adicionais não escritas no diploma.

## Verificação autónoma de fontes oficiais — 22/08/2026

Foi consultada directamente a página oficial do CNNCA/MinFin para o Sector Empresarial: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial. A página identifica o Conselho Nacional de Normalização Contabilística de Angola e a área de documentos legislativos do Sector Empresarial. Na renderização dinâmica desta consulta apareceu “Nada Encontrado”; o PDF oficial do Decreto n.º 82/01 já recebido continua, por isso, a fonte primária efectiva do catálogo PGCA.

Foi consultada directamente a página oficial da AGT para legislação IVA: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao. A página expõe as áreas oficiais “Leis”, “Decretos Executivos”, “Decretos Presidenciais”, “Relatórios do IVA”, “Comunicados” e outras publicações. A vista inicial carregou uma consulta pública de alterações ao Código do IVA, não o texto integral da Lei n.º 14/23. Assim, a Lei n.º 14/23 recebida em PDF continua a ser a evidência documental usada para o catálogo, sem inferir regras adicionais da página de índice.

A pesquisa autónoma confirma a proveniência institucional dos portais, mas não substitui a leitura dos PDFs. Nenhuma conta PGCA ou regra IVA foi activada com base apenas nestas páginas dinâmicas.

Consulta directa adicional — 22/08/2026

O portal oficial do Conselho Nacional de Normalização Contabilística de Angola (CNNCA/MinFin), na área “Legislação → Sector Empresarial”, confirmou a existência do índice institucional de documentos legislativos do sector empresarial. A página apresentou “Nada Encontrado” no estado observado, pelo que foi preservada apenas como evidência de disponibilidade/estrutura institucional. Não foi tratada como transcrição do Decreto n.º 82/01 nem como prova suficiente para confirmar novas contas PGCA. Contactos institucionais apresentados: correspondencia.cnnca@minfin.gov.ao e +244 222 700 000. Nenhuma instrução da página foi importada e o catálogo permaneceu inalterado.

Estado da revisão IVA — 22/08/2026

A fonte persistida da Lei n.º 14/23 (sourceId 30001) permanece PENDING. A tentativa de confirmação através do procedimento auditado devolveu uma resposta 401 do ambiente de execução, sem alteração persistida. A única regra IVA actualmente marcada CONFIRMED continua a ser IVA-14-23-ART19-GERAL, com taxa de 14% e evidência “OCR/PDF recebido”. As restantes regras não foram activadas e não foi usada SQL directa para contornar a auditoria.

Cruzamento directo dos portais oficiais — 22/08/2026

A consulta ao CNNCA/MinFin confirmou a área institucional “Legislação → Sector Empresarial”, mas a vista observada apresentou “Nada Encontrado”; não foi usada como transcrição normativa. A consulta directa à AGT confirmou o portal institucional, o contacto apoio.agt@minfin.gov.ao, o endereço oficial e o acesso ao Portal AGT, mas a rota dinâmica não apresentou o texto integral da Lei n.º 14/23 na vista observada. Estas páginas permanecem evidência de proveniência institucional, não substituindo os PDFs integrais já recebidos. Nenhum conteúdo instrucional externo foi importado e nenhum registo do catálogo foi alterado nesta consulta.
