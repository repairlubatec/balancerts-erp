# BALANCERTS.ERP — Matriz P2 de Controlo, Qualidade e Aceitação

## Objectivo

A P2 valida o comportamento operacional do BALANCERTS.ERP depois do fecho das operações principais. O âmbito é controlo, qualidade, segurança, auditoria, reconciliação e aceitação interna. Dependências externas da P1 — homologação AGT, banco, restauro externo, assinatura e máquina Windows limpa — permanecem fora da execução local.

## Princípios de aceitação

| Princípio | Critério verificável |
|---|---|
| Contexto primeiro | Cada consulta e mutação usa a organização, empresa, exercício e período autorizados no servidor. |
| Sem dados demonstrativos | Estados vazios mostram ausência de dados; não são criados lançamentos, documentos, clientes, fornecedores ou movimentos fictícios para completar métricas. |
| Segregação de funções | O papel é validado no procedimento tRPC antes da leitura sensível ou da mutação; a interface nunca é a única barreira. |
| Integridade contabilística | Lançamentos publicados têm débito igual a crédito, período aberto, conta postável, origem e idempotência. |
| Auditoria | Operações críticas registam actor, organização, empresa, entidade, correlação, estado anterior e posterior, quando aplicável. |
| Imutabilidade | Documentos emitidos, lançamentos publicados, snapshots e evidência normativa não são alterados por edição comum. |
| Fronteira SAADI | A integração BALANCERTS → SAADI é somente leitura; SAADI não publica documentos, movimentos ou lançamentos no ERP. |
| Evidência normativa | PGCA/IVA sem confirmação oficial permanece bloqueado e visível como bloqueado; recomendações de IA são apenas consultivas. |

## Matriz por ciclo

| Ciclo | Fonte persistente | Operações críticas | Controlo obrigatório | Evidência de aceitação |
|---|---|---|---|---|
| Facturação e Documentos | séries, documentos, itens, impostos e lançamentos | reservar número, validar, emitir, contabilizar, anular/estornar | empresa activa, período aberto, série persistente, sequência e origem contabilística | ciclo reserva → emissão → posting; emissão indevida rejeitada por papel/estado |
| Contabilidade | plano de contas, períodos e diário | criar, validar, publicar, estornar | conta vigente/postável, partida dobrada, idempotência, imutabilidade e auditoria | diário/razão/balancete reconciliam; estorno preserva original |
| Tesouraria | contas de caixa/banco, pagamentos e reconciliações | registar, aprovar, reconciliar | referência única, período/empresa, segregação de aprovação e auditoria | saldo e reconciliação sem escrita indevida; pagamento duplicado rejeitado |
| Fecho | checklist, bloqueios e estado do período | validar, fechar, reabrir | prontidão server-side, motivo na reabertura e auditoria | período só fecha com critérios persistentes; reabertura deixa trilho |
| Clientes e Fornecedores | contrapartes, documentos, saldos e auditoria | criar/editar, consultar ficha e saldos | NIF e empresa, RBAC, escopo tenant-aware | ficha, saldo e documentos pertencem à empresa activa; vazio real é suportado |
| Stock | artigos, armazéns, movimentos, contagens e valorização | entrada, saída, transferência, contagem, reconciliação | armazém/empresa, quantidade, custo médio, idempotência e auditoria | movimentos e custo reconciliam com razão; empresas cruzadas não aparecem |
| Imobilizado | activos, ciclo de vida e reflexos contabilísticos | adquirir, entrada em uso, depreciar, alienar/baixar | datas coerentes, estado, valor, vida útil, lançamento e auditoria | mapa de activos e reflexos persistentes; alienação não edita o histórico |
| Relatórios | diário, razão, documentos, auxiliares e SAF-T readiness | consultar, filtrar, exportar, rastrear origem | filtros tenant-aware, limites, paginação/volume controlado e reconciliação | Balancete, Diário, Razão, Resultados, Balanço e SAF-T exibem fonte e estado real |
| Definições | organização, empresa, períodos, IVA, moeda, séries e acessos | consultar e abrir posto autorizado | alterações server-side, empresa activa e auditoria | contexto apresentado corresponde aos registos persistentes |
| SAADI | adaptadores semânticos e contexto PGCA confirmado | consultar análise e contexto | leitura, minimização, escopo e ausência de mutações ERP | qualquer tentativa de escrita operacional é inexistente/rejeitada |

## Critérios técnicos P2

A validação deve cobrir procedimentos tRPC directamente, sem depender apenas da interface. Para cada operação crítica são exigidos: input validado, output tipado, erro estruturado, autorização determinística, escopo por organização/empresa, idempotência quando há mutação, auditoria quando há efeito persistente e teste de acesso negado. Consultas e exportações devem possuir limites explícitos e não devem aceitar escopos arbitrários fornecidos apenas pelo cliente.

## Dependências mantidas em espera

Não são consideradas falhas locais a ausência de credenciais AGT/bancárias, de um destino externo de restauro, de uma máquina Windows limpa, de certificado de distribuição ou de uma sessão formal com utilizadores. Esses itens continuam no TODO original como pendências externas e não devem ser marcados como concluídos durante a P2 local.

## Resultado esperado

A P2 local pode ser concluída quando a matriz estiver coberta pelo código e pelos testes, sem regressões de P0/P1, mantendo bloqueadas as operações normativas e integrações externas que exigem evidência ou ambiente fora do sandbox.
