# Notas para uma reprodução de linguagem PMR melhorada

## Fonte pública consultada

A página Interface do PMR apresenta uma promessa de software rápido e responsivo, organizado por tarefas, com suporte a tabelas, notificações, selecção por empresa, estatísticas, arquivo digital e integração entre entidades, planos de contas, valores e movimentos [1]. A página Produtos organiza a oferta em Gestão Financeira, Gestão Comercial, Recursos Humanos e API [2].

## Equivalência proposta para o BALANCERTS.ERP

A estrutura a reproduzir não deve ser a página institucional; deve ser a lógica de produto: seleccionar a empresa, escolher uma área, trabalhar numa tarefa concreta, consultar grelhas e voltar ao contexto. No ERP, a taxonomia superior será **Empresas e contexto**, **Gestão Financeira**, **Gestão Comercial**, **Fiscalidade**, **Pessoas e entidades**, **Operações**, **Relatórios** e **Administração**. Cada área terá submódulos visíveis, evitando a lista plana actual.

O ganho de organização será separar três níveis: navegação estrutural à esquerda, comandos da tarefa numa toolbar superior e dados/detalhe no centro. A selecção da empresa activa deve permanecer sempre visível. A tabela e o painel de detalhe devem ser a unidade principal de trabalho; os indicadores são auxiliares e não o foco.

## Referências

[1]: https://pmr.pt/interface/ "Interface | PMR Software"
[2]: https://pmr.pt/produtos/ "Produtos | PMR Software"
