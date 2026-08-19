# Análise inicial do módulo Controlo

## Âmbito

O módulo Controlo reúne as áreas de **Fiscalidade**, **Relatórios**, **Fecho**, **Centro de Tarefas** e **Auditoria**. A análise foi feita sobre o shell desktop actual, os painéis React existentes, os procedimentos tRPC e os helpers persistentes do servidor.

| Área | Situação observada | Lacuna operacional a fechar |
|---|---|---|
| Fiscalidade | Existem registo fiscal, calendário de obrigações, regras normativas, prontidão AGT, validação estrutural e evidências de pré-homologação | Consolidar a fila de obrigações, estados, filtros por período/regime e mensagens de bloqueio no posto fiscal |
| Relatórios | Existem Balancete, Diário, Razão, Resultados, Balanço, antiguidade e reconciliação | Unificar filtros de exercício/período/empresa e tornar a cadeia de rastreabilidade mais evidente no posto |
| Fecho | Existem avaliação, fecho, reabertura, bloqueios e auditoria | Mostrar checklist persistente e pendências accionáveis, evitando apenas uma avaliação transitória |
| Centro de Tarefas | Existe navegação e componentes de tarefa | Ligar tarefas a entidades persistentes, prioridade, responsável, estado e origem operacional |
| Auditoria | Existe consulta tenant-aware com filtros e exportação na área de séries | Criar centro de auditoria dedicado com detalhe antes/depois, correlação, filtros completos e estados vazios claros |
| Idioma e desktop | Shell, menus e feedback principais estão em português e dentro da janela interna | Rever rótulos técnicos visíveis em inglês, estados enum e acções de Controlo numa passagem final |
| Segurança | RBAC, isolamento e trilho append-only existem nos endpoints críticos | Confirmar cobertura específica de cada acção Controlo e evitar consultas com `companyId` inválido |

## Decisões para a implementação

O trabalho será incremental e tenant-aware. Não serão criados dados de demonstração nem submissões AGT reais. Qualquer preparação AGT permanecerá explicitamente bloqueada até existirem credenciais, endpoint e homologação oficial. Os relatórios devem continuar a reconciliar com os lançamentos e documentos persistidos, enquanto o fecho deve bloquear operações incompatíveis com períodos fechados.

## Resultado da fase de inventário

A estrutura actual tem uma base funcional forte, mas o módulo Controlo ainda precisa de uma experiência unificada de posto: Fiscalidade deve concentrar obrigações e prontidão; Relatórios devem oferecer percurso de análise; Fecho deve expor bloqueios e tarefas; Centro de Tarefas e Auditoria devem deixar de ser apenas destinos de navegação e tornar-se áreas operacionais persistentes.
