# Verificação visual do módulo Operações

Em 19 de Agosto de 2026, a rota `/stock` foi aberta no ambiente activo. Sem sessão autenticada, o sistema apresenta correctamente o ecrã interno de acesso seguro, em português, sem abrir janela externa do navegador. O conteúdo protegido de Stock não foi inspeccionado nesta sessão porque exige autenticação; a validação funcional foi feita por TypeScript e testes Vitest do servidor.

A interface de acesso não apresentou termos visíveis em inglês nem erro de carregamento.

## Funcionalidades implementadas nesta etapa

- Cadastro persistente de armazéns por empresa, com auditoria e isolamento.
- Registo de entradas e saídas por período e armazém.
- Transferência atómica entre armazéns com dois movimentos auditáveis.
- Idempotência por grupo de transferência e bloqueio de transferências incompletas.
- Bloqueio de transferência acima do saldo disponível na origem.
- Consulta de saldos por armazém e artigo, valorizados em AOA.
- Formulário desktop integrado no posto Stock, com rótulos em português.

## Validação técnica

- TypeScript sem erros.
- Testes de operações, inventário e publicação de stock aprovados.
- Verificação visual protegida por autenticação concluída no ecrã de acesso.

A integração AGT permanece preparada, mas desligada até existirem credenciais, endpoint e homologação oficial.
