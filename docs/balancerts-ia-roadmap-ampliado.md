# Balancerts IA — Roadmap ampliado executado

## Evolução desta continuação

O centro de revisão humana foi ampliado com filtros por estado, fornecedor IA, confiança mínima e período no formato `AAAA-MM`. A consulta continua tenant-aware e o filtro de estado pode mostrar pendentes, aprovadas, rejeitadas ou expiradas sem alterar os registos.

Foi acrescentada a tarefa **preenchimento assistido de rascunho**. O utilizador autorizado pode seleccionar um documento e pedir uma proposta separada da classificação. A operação só aceita documentos em estado `DRAFT`, usa a mesma idempotência e guarda a proposta como sugestão. A aprovação continua a significar apenas evidência revista; não há aplicação automática sobre campos, impostos, linhas, séries ou lançamentos.

Foi acrescentado o botão **Testar IA local**. O servidor verifica exclusivamente a disponibilidade do endpoint local e regista provider, modelo, duração e resultado. Não envia conteúdo de documentos nem dados fiscais. Se a IA local estiver desactivada, a operação é bloqueada de forma explícita.

## Controlos preservados

| Área | Comportamento implementado |
|---|---|
| RBAC | Consulta para leitura; classificação, preenchimento e revisão apenas para perfis com validação |
| Isolamento | Empresa e organização são verificadas no servidor |
| Idempotência | Uma chave determinística impede sugestões duplicadas |
| Efeitos fiscais | Nenhuma sugestão modifica documentos, impostos, contabilidade, tesouraria, stock ou AGT |
| Auditoria | Pedido, resultado e decisão de revisão ficam registados |
| Privacidade | O teste local não envia conteúdo; as sugestões usam metadados limitados |
| Interface | Janela interna desktop, filtros operacionais e rótulos portugueses |

## Validação

A suite final aprovou **59 ficheiros de teste e 216 testes**, incluindo sete testes do router Balancerts IA, quatro dos providers, quatro de apresentação e os testes de Home. TypeScript, build de produção e revisão visual do módulo `/ia` foram concluídos sem erros de compilação.

O roadmap mantém como limites a não activação automática de providers cloud, a não submissão AGT e a necessidade de confirmação humana para qualquer futura aplicação de sugestões.
