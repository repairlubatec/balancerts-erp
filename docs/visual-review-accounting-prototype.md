

## Revisão adicional — protótipo do motor contabilístico

A captura de `/contabilidade?entry=new` confirmou que o percurso desktop abre o contexto operacional de Contabilidade com empresa Repair Lubatec, exercício 2023 e período Setembro aberto. O estado `new` é reconhecido e apresentado com feedback visual no shell. O workbench permanece no modal de operação, preservando a separação entre o contexto financeiro e o motor de lançamento.

O protótipo acrescenta ao workbench a leitura da natureza contabilística, do comportamento do saldo, do tipo de conta e da apresentação em Balanço/Resultados. Contas pendentes mostram aviso de não utilização em posting automático; não são criadas regras nem confirmadas contas por efeito da interface.
