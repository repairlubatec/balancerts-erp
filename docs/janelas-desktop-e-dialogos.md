# Janelas desktop e diálogos operacionais

## Problema identificado

A reconciliação utilizava `window.prompt`, que abria um diálogo pertencente ao navegador e apresentava a aplicação como uma página web. A mesma abordagem existia nos motivos de reabertura de período e anulação de documentos.

## Solução aplicada

Foi criado o componente `DesktopReasonDialog`, baseado na moldura interna Windows do BALANCERTS.ERP. A janela tem título, subtítulo do módulo, foco automático, campo controlado, validação de motivo obrigatório, botões **Cancelar** e **Confirmar**, estado de processamento e fecho seguro. O componente é usado na reconciliação de Tesouraria, na reabertura de períodos e na anulação de documentos.

A reconciliação mantém a operação persistente, protegida por permissões, idempotente e auditada. O identificador técnico `ui-payment-...` deixou de ser mostrado na interface; aparece como **Movimento de tesouraria**. Os identificadores internos continuam disponíveis nos contratos e no trilho de auditoria.

## Verificação

A pesquisa final não encontrou `window.prompt`, `window.alert` ou `window.confirm` no frontend. A Tesouraria foi verificada visualmente em 1280px e apresenta referências em português. A suite terminou com **56 ficheiros e 194 testes aprovados**, TypeScript sem erros e build de produção concluído. O aviso de tamanho do bloco JavaScript permanece apenas como optimização futura, sem erro funcional.
