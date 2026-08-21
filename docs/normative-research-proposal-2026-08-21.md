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
