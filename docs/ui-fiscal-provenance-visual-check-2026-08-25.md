# Revisão visual — Registo fiscal documental

**Data:** 25 de Agosto de 2026  
**Rota:** `/fiscalidade`  
**Viewport:** 1280 × 720  
**Contexto:** empresa Repair Lubatec, sessão operacional Angola

A página mantém a composição de software desktop: barra lateral persistente, barra de título, separadores de módulos, barra de contexto da empresa e painéis operacionais em cartões compactos. A revisão em viewport normal não mostrou erro visual ou erro de TypeScript activo.

Na captura de página completa, o novo painel **Registo fiscal documental** aparece depois do Controlo fiscal e antes do Sub-registo fiscal. O painel mostra um documento real persistido, base de 104 900 AOA, IVA de 0 AOA, regime Exclusão e estado Reconciliado. Como o documento não possui proveniência normativa persistida, a interface mostra explicitamente **Sem proveniência normativa persistida**, sem inventar regra, versão ou referência.

A tabela utiliza overflow horizontal interno para as colunas documentais e não cria scroll horizontal global. Os cartões de resumo mostram o número de documentos, quantos têm proveniência e o IVA registado. O estado da empresa e a pendência AGT continuam visíveis, sem confundir preparação técnica com homologação oficial.

**Decisão:** revisão visual aprovada para o escopo implementado. A ausência de proveniência no documento de teste é apresentada como ausência real e deve permanecer assim até uma regra normativa válida ser associada pelo fluxo fiscal.
