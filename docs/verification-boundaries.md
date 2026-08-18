# Limites de verificação do BALANCERTS.ERP

Este documento separa a evidência executada de requisitos que dependem de informação ou aprovação externa. Testes locais não são tratados como prova de homologação ou certificação legal.

## Evidência executada

A Repair Lubatec (NIF 5001121871) é consultada de forma tenant-aware e não recebe dados demonstrativos. O tenant descartável cobre ciclos persistentes de documentos, fornecedores, clientes, itens, impostos, pagamentos, posting, stock, tesouraria, reconciliação, fecho, reabertura, recuperação de integrações e auditoria por entidade.

O sistema possui configuração versionada do adaptador AGT, com referências de XSD, endpoint, códigos oficiais e referência segura de autenticação. A fila local de submissão usa operações persistentes, estado `PENDING`, chave idempotente e rejeição de escopo incompatível. A submissão real não é simulada.

O builder SAF-T AO 1.01_01 produz XML determinístico quando a prontidão interna for elegível. O endpoint mantém o bloqueio enquanto faltarem entidades obrigatórias ou validação externa. A matriz do Decreto Presidencial n.º 71/25 cobre internamente emissão, rectificação, anulação, recibos, conservação e certificação como requisitos separados, com estados externos pendentes.

## Dependências externas ainda abertas

A validação XSD real depende da entrega do XSD oficial aplicável. A homologação técnica depende do endpoint de testes, método de autenticação, credenciais e códigos oficiais fornecidos pela AGT. A declaração de software certificado ou validado só pode ser feita pela própria AGT após aprovação formal.

A configuração `agtIntegrationConfigs` não guarda credenciais em texto; guarda referências. O estado `AGT_APPROVED` existe apenas como estado de domínio reservado e não é aceite pela mutação interna de configuração.

## Limites de superfície

As consultas, mutações, exportações, ficheiros, integrações persistentes e filas actualmente implementadas exigem escopo de organização e empresa. Não existe uma camada independente de cache ou fila externa no projecto além da fila persistida de operações; portanto, não se afirma cobertura de isolamento de um subsistema que ainda não foi introduzido.

A regra de entrega é conservadora: nenhuma lacuna externa pode ser convertida numa afirmação de conformidade AGT, elegibilidade de submissão, homologação ou certificação sem artefactos oficiais, validação técnica reproduzível e aprovação formal aplicável.
