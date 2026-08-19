# Visualizador PDF interno P1

## Resultado

O fluxo de PDF do módulo **Documentos** deixou de apresentar uma ligação para abrir o ficheiro numa nova página do navegador. Depois de gerar o documento PDF, o utilizador pode abrir o **Visualizador interno**, integrado no shell Windows do BALANCERTS.ERP.

| Capacidade | Implementação |
|---|---|
| Janela | Moldura desktop reutilizável, com título, minimizar, maximizar/restaurar e fechar. |
| Pré-visualização | `iframe` interno alimentado pelo URL assinado obtido após validação do módulo de Documentos. |
| Zoom | Controlos de redução e aumento entre 60% e 180%. |
| Download | Descarregamento explícito a partir da janela interna, mantendo o URL assinado e o nome do ficheiro. |
| Segurança | O fluxo continua a usar `files.downloadUrl`, que valida RBAC, empresa e ACL antes de obter o URL assinado. |
| Idioma | Rótulos apresentados em português e sem `target="_blank"` ou `window.open` neste fluxo. |

A matriz de operações críticas foi igualmente actualizada para incluir `files.updateMetadata`, `files.newVersion` e `files.archive`, mantendo essas operações bloqueadas enquanto a empresa não estiver pronta e exigindo o proprietário do ficheiro para alterações sensíveis.

## Validação

A suite completa terminou com **56 ficheiros de teste e 197 testes aprovados**, incluindo os testes do router de ficheiros, integrações de Documentos e política de mutações críticas. O TypeScript e o build de produção foram concluídos sem erros. A verificação visual de `/documentos` confirmou a composição dentro da janela desktop, sem ligação externa visível. O aviso de blocos JavaScript superiores a 500 kB permanece uma optimização futura e não bloqueia o funcionamento.

A comunicação com a AGT permanece desligada e o visualizador não declara certificação ou homologação fiscal.
