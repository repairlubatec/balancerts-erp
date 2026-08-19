# Continuação da auditoria — rótulos de entidades e correlações

Foi concluída uma melhoria incremental no módulo de Auditoria. As entidades e correlações técnicas que ainda podiam aparecer directamente foram convertidas para rótulos operacionais em português, incluindo **Série documental**, **Movimento de tesouraria**, **Contraparte**, **Conta de caixa**, **Documento operacional**, **Empresa**, **Reserva de numeração**, **Limpeza operacional** e **Teste operacional**.

Os identificadores originais continuam preservados para rastreabilidade e auditoria; apenas a camada de apresentação foi alterada. A verificação visual da Auditoria em 1280px confirmou que os registos recentes já não mostram `counterparty:...`, `cash-account:...` ou correlações equivalentes como texto técnico.

A validação terminou com **56 ficheiros de teste e 194 testes aprovados**, TypeScript sem erros, build de produção concluído e screenshot do módulo Auditoria aprovado. O aviso de blocos JavaScript superiores a 500 kB permanece apenas como oportunidade de optimização de desempenho, não como erro funcional.
