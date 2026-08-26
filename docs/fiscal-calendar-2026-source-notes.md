# Notas de fonte — Calendário Fiscal 2026

## Ficheiro analisado

- Ficheiro: `minfin5320492.pdf`
- Total: 3 páginas, formato Letter, páginas digitalizadas como imagem.
- Título visível: **Calendário Fiscal 2026 — Regime Geral / Regime Especial**.
- Rodapé visível: `www.agt.minfin.gov.ao`.
- O PDF não contém camada textual útil; a leitura requer OCR/conferência visual.

## Conteúdo visual confirmado

### Página 1
Capa do Calendário Fiscal 2026, com indicação de Regime Geral / Regime Especial.

### Página 2 — Regime Geral
A tabela contém as colunas `Sector`, `Imposto`, `Designação` e os meses de Janeiro a Dezembro. A legenda indica: **último dia do prazo para o cumprimento voluntário da obrigação e/ou pagamento**.

Foram identificadas, entre outras, linhas de IVA, II, IEC, IRT, IP, IS, IAC, IVM, CEOC e IEJ. A página apresenta prazos mensais e anuais. Entre os textos legíveis:

- IVA — Regime Geral: submissão da Declaração Modelo 7, anexos de fornecedores e de regularizações e pagamento do imposto.
- IVA — Regime Geral: submissão do ficheiro SAF-T no Portal do Contribuinte.
- IVA — Regime Simplificado: submissão da declaração e pagamento do IVA.
- IVA — Regime Simplificado: submissão do ficheiro SAF-T no Portal do Contribuinte.
- II: entrega de retenções sobre prestações de serviços pagos durante o mês anterior; declarações Modelo 1 e Modelo 6; dossiê de preços de transferência para grandes contribuintes; pagamento do Imposto Industrial Provisório; adesão ao regime geral.
- IRT: mapa de remunerações/liquidação e entrega do imposto retido na fonte; Modelo 2; retenções dos Grupos B e C; Grupo B por conta própria; declarações anuais do Grupo C; pagamento do imposto retido na fonte.
- IP: retenção e pagamento; rendas; transmissão de bens imóveis; inscrição/alteração de prédios na matriz predial.
- IS: declaração anual do Imposto do Selo e liquidação/pagamento do imposto.
- IAC, IVM, CEOC e IEJ: declarações, liquidações e pagamentos conforme as linhas da tabela.

A página contém ainda a regra textual de que, para uma obrigação específica de IRT, **o imposto deve ser pago no prazo de 5 (cinco) dias contados da data da emissão da factura ou da atribuição do rendimento**. Esta regra deve ficar modelada como prazo relativo, não como data mensal fixa.

Outra regra visível para IP indica que a inscrição ou alteração de prédios na Matriz Predial deve ocorrer no mês seguinte à data de construção, ocupação ou aquisição. Deve ficar modelada como prazo relativo.

### Página 3 — Regime Especial
A tabela contém obrigações dos sectores petrolífero e mineiro, com meses de Janeiro a Dezembro, e a mesma legenda de prazo voluntário.

Foram identificadas linhas para IRP, IPP, ITP, RCN, TS, CFQA, taxa de gás, II e IVRM, incluindo declarações mensais, trimestrais, anuais, previsões e pagamentos. A página também explica:

- Contratos de Partilha de Produção: aplicável somente ao IRP.
- Contratos de Concessão: aplicável ao IRP, ITP e IPP.
- Contratos de Serviço com Risco: aplicável ao IRP, ITP e IPP.

## Limitações de segurança

1. Os números de dia nas grelhas devem ser transcritos por conferência visual/OCR controlado antes de serem tratados como dados de cálculo.
2. O calendário é uma fonte operacional de prazos para 2026; não substitui a cadeia normativa nem prova, por si só, a vigência de uma taxa ou regra material.
3. Obrigações dependentes do enquadramento da empresa devem ser condicionais por regime/sector e não podem aparecer como aplicáveis universalmente.
4. As datas relativas (5 dias, mês seguinte, aniversário, autorização administrativa) não podem ser transformadas em datas fixas sem o evento-base.
5. O módulo deve manter o estado `PENDING_SOURCE_REVIEW` para linhas cuja legibilidade ou confirmação normativa não seja suficiente.

## Decisão de implementação

Implementar o calendário como uma funcionalidade determinística dentro do ERP, com:

- obrigações versionadas por ano, regime, sector e imposto;
- datas derivadas da tabela apenas quando a linha estiver confirmada;
- alertas locais calculados a partir da data actual e do vencimento;
- checklist persistente por empresa/período;
- estados `PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE` e `BLOCKED`;
- bloqueio de conclusão quando a evidência da obrigação estiver pendente;
- nenhuma notificação externa ou tarefa recorrente criada nesta fase.
