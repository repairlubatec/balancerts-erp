# Reforço operacional — feedback e Windows

Nesta etapa foram corrigidas lacunas concretas detectadas na auditoria de botões e alinhamento.

O painel de Imobilizado agora valida custo, residual, vida útil e meses decorridos antes de chamar o servidor. Registo, actualização e cálculo de depreciação apresentam feedback de sucesso ou bloqueio, invalidam a lista persistente quando aplicável e limpam o formulário após criação bem-sucedida.

O comando Windows `Editar` deixou de depender silenciosamente de um único formulário. Procura agora, por ordem, os postos de actualização, criação, contabilidade, tesouraria e depreciação; foca o primeiro controlo disponível e possui fallback para um destino operacional válido.

Os formulários de Imobilizado e os filtros de Séries passam a usar duas colunas em larguras Windows comuns e o layout denso apenas em ecrãs 2xl. Isto evita corte de campos e botões em 1280px sem degradar o PWA.

A validação final passou com **53 ficheiros e 189 testes**, TypeScript, build de produção, capturas desktop de Imobilizado/Facturação/Contabilidade e smoke test Electron de directório com HTTPS de preview. O build continua a emitir apenas o aviso de optimização de chunks grandes; não há erro de compilação. EXE/MSI finais continuam dependentes de runner Windows, URL HTTPS de produção e assinatura.
