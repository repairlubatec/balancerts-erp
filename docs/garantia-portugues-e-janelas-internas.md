# Garantia de português integral e janelas internas

## Janelas

A varredura do frontend não encontrou `window.prompt`, `window.alert` ou `window.confirm`. Os fluxos de reconciliação, reabertura de períodos e anulação de documentos usam janelas internas do shell BALANCERTS.ERP, com moldura desktop, foco automático, validação, confirmação, cancelamento e estado de processamento.

## Idioma

Foram revistos o shell, Tesouraria, Facturação, Fecho, Fiscalidade, Centro de Tarefas, caixa assistida e página de componentes. Foram traduzidos estados, mensagens, placeholders, descrições, botões, menus, alertas, separadores, navegação estrutural, campos, mensagens de sessão e referências operacionais. A referência `ui-payment-...` é apresentada como **Movimento de tesouraria**.

Os nomes técnicos de procedimentos, valores de enumeração, chaves de idempotência, correlações e códigos de auditoria permanecem internos, porque fazem parte dos contratos do sistema e da rastreabilidade. Não são apresentados como rótulos operacionais.

## Verificação

A procura de diálogos web terminou sem ocorrências. A procura de termos ingleses conhecidos visíveis terminou sem ocorrências funcionais; as ocorrências restantes são apenas comentários ou identificadores técnicos internos. Foram executados **56 ficheiros e 194 testes**, TypeScript sem erros, build de produção e screenshots do shell e Tesouraria em 1280px. O aviso de bloco JavaScript grande é uma optimização futura, não uma falha funcional.
