# Limites de verificação do BALANCERTS.ERP

Este documento separa evidência executada de requisitos ainda não demonstrados. A existência de testes unitários ou de contratos puros não é tratada como prova de execução completa sobre dados operacionais.

## Evidência actualmente executada

A Repair Lubatec (NIF 5001121871) é consultada na base real de forma tenant-aware, sem inserção de documentos, lançamentos ou movimentos demonstrativos. Estão validados os contratos de relatórios, reconciliação contabilístico-fiscal, origem documental, validação AGT e prontidão SAF-T AO 1.01_01. A prontidão SAF-T identifica lacunas e mantém `submissionEligible: false`; não existe afirmação de submissão à AGT.

Os builders de reconciliação cobrem Balancete, Diário, Balanço, IVA, registo fiscal e origem documental. A resposta agregada só é reconciliada quando a origem documental também está reconciliada. A regra de IVA positivo no regime EXCLUSÃO é rejeitada tanto na validação fiscal como nos relatórios.

A matriz de auditoria cobre dez mutações críticas por contrato de `action`, `entityType` e snapshots. Os testes de integração confirmam eventos reais existentes da Repair Lubatec e isolamento de escopos inexistentes. Isso não significa que cada mutação tenha sido executada numa sequência comercial completa com dados gravados.

## Lacunas que permanecem deliberadamente abertas

Ainda falta uma execução E2E persistida, com dados operacionais controlados, que percorra reserva, emissão, posting, validação fiscal, reconciliação, fecho e reabertura numa única empresa. Também falta uma prova de base de dados que grave movimentos e lançamentos para produzir estados reconciliado, divergente e entre empresas.

A recuperação de integrações tem contratos de idempotência, retries, concorrência, timeout, cancelamento por `AbortSignal` e transição `FAILED → RETRY → COMPLETED`. A recuperação após falha parcial com estado persistido continua pendente.

Os requisitos de conformidade do Decreto Presidencial n.º 71/25 e da AGT estão parametrizados apenas na extensão coberta pelas evidências e regras implementadas. O guard SAF-T impede exportação enquanto faltarem entidades ou validação XSD/AGT; não deve ser removido para gerar ficheiros potencialmente inválidos.

## Regra de entrega

Nenhum destes limites deve ser convertido em uma afirmação de conformidade legal, elegibilidade de submissão ou conclusão de ciclo empresarial sem a correspondente prova persistente, revisão normativa e validação externa aplicável.
