# Critérios de aceitação — ciclo documental Repair Lubatec

O ciclo a validar usa a empresa activa Repair Lubatec, NIF 5001121871, moeda AOA e regime de exclusão. Esta validação não deve criar facturas reais, comunicar com a AGT ou alterar dados comerciais sem uma execução manual deliberada no ambiente apropriado.

| Etapa | Critério de aceitação | Bloqueio esperado |
|---|---|---|
| Rascunho | O formulário exige cliente, linha, quantidade, preço, regime IVA e vencimento coerentes; o documento é persistido em estado `DRAFT`. | Empresa sem configuração operacional, série inexistente ou dados inválidos bloqueiam a gravação. |
| Validação | Um rascunho seleccionado pode passar a `VALIDATED` apenas se cumprir as regras comerciais e fiscais locais. | Linhas vazias, totais inconsistentes ou regime inválido bloqueiam a transição. |
| Emissão | Um documento validado reserva numeração de série, gera hash imutável e passa a `ISSUED`. | Série não configurada, numeração duplicada ou empresa não pronta bloqueiam a emissão. |
| Contabilização | A contabilização exige lançamento publicado e ligado ao documento; só depois passa a `ACCOUNTED`. | Ausência de lançamento equilibrado bloqueia a transição. |
| Anulação | Um documento emitido/contabilizado só pode ser anulado com motivo obrigatório, auditoria e preservação do hash/histórico. | Motivo vazio, transição inválida ou falta de permissão bloqueiam a operação. |
| Auditoria | Cada transição apresenta feedback, actor, empresa, entidade, estado anterior/novo e correlação. | Falha de auditoria deve fazer a operação falhar de forma segura. |

A homologação AGT, o envio remoto, a assinatura oficial e a declaração de certificação ficam fora deste ciclo até existirem especificação, credenciais, endpoint e autorização formal.
