# BALANCERTS.ERP — Roteiro de Aceitação P2

## Critérios de entrada

A aceitação interna inicia-se com uma organização e uma empresa autorizadas, um período persistente e aberto e dados existentes apenas quando provenientes da base real. O PGCA/IVA pendente continua bloqueado. As pendências externas de AGT, restauro, assinatura, banca e aceitação formal da Repair Lubatec não fazem parte deste roteiro.

## Critérios por ciclo

| Ciclo | Execução | Resultado esperado | Evidência |
|---|---|---|---|
| Facturação | Consultar série, reservar número, criar/validar/emitar documento e consultar origem | O número é sequencial, o documento respeita estado e a contabilização exige origem válida | Testes de ciclo e auditoria documental |
| Contabilidade | Consultar diário, razão e balancete; validar posting e estorno controlado | Débito e crédito equilibrados; período, conta, origem e idempotência validados | Testes contabilísticos e reconciliação |
| Tesouraria | Consultar contas/movimentos, submeter pagamento e reconciliar | Operação fica no contexto da empresa e aprovação/posting respeitam o papel | Testes de permissões e reconciliação |
| Fecho | Consultar prontidão, validar checklist e tentar fechar/reabrir | Fecho bloqueia quando faltam critérios; reabertura exige motivo e deixa auditoria | Testes de fecho e trilho de auditoria |
| Clientes/Fornecedores | Consultar ficha, documentos e saldos; pesquisar | Apenas registos da empresa activa; vazio é apresentado como vazio real | Testes tenant-aware e revisão visual |
| Stock | Consultar saldos, registar movimento/contagem e reconciliar | Quantidade, armazém, custo médio e razão permanecem coerentes | Testes de stock e reconciliação |
| Imobilizado | Consultar mapa, adquirir, colocar em uso, depreciar e alienar | Datas e estados são válidos; reflexo contabilístico e auditoria são preservados | Testes de ciclo de vida |
| Relatórios | Abrir Balancete, Diário, Razão, Resultados, Balanço, SAF-T e auxiliares | Relatórios consultam dados persistentes, mostram reconciliação e não declaram homologação AGT | Testes de reports e captura visual |
| Definições | Consultar organização, empresa, período, IVA, moeda, séries, acessos e normativa | Contexto exibido corresponde à configuração persistente; alterações seguem posto autorizado | Revisão visual e testes server-side |
| SAADI | Consultar contexto ERP, resumo contabilístico e PGCA confirmado | SAADI recebe apenas leitura sem publicar documentos, movimentos ou lançamentos ERP | Testes do adaptador, segurança e contrato |

## Critérios transversais

A aceitação deve rejeitar acesso horizontal a outra organização ou empresa, rejeitar acesso vertical incompatível com o papel, validar inputs estritos e apresentar erros compreensíveis. Mutação crítica exige idempotência, atomicidade, correlação e auditoria. Exportações só são permitidas no contexto autorizado e devem respeitar o limite de linhas do contrato.

## Critérios de saída

A P2 local é aceite quando a suite global passa, o TypeScript e o build passam, os postos críticos foram revistos visualmente e nenhum teste demonstra escrita operacional do SAADI no ERP. Uma dependência externa só pode ser marcada como concluída após evidência real fora do sandbox; a ausência dessa evidência mantém o item em espera.
