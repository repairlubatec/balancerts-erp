# Revisão funcional de botões e reconciliação

## Resultado

Foi feita uma revisão dos botões, menus, acções, handlers, rotas e contratos tRPC do BALANCERTS.ERP. A principal lacuna encontrada estava na Tesouraria: os movimentos podiam aparecer como **Por reconciliar**, mas não existia na interface uma acção persistente para confirmar individualmente esse estado.

## Correcção da Tesouraria

Foi adicionada a mutação protegida `treasury.reconcileTransaction`, com validação da empresa activa, verificação do proprietário da organização, controlo de permissões de Tesouraria, operação idempotente e auditoria. O novo painel **Movimentos por reconciliar** apresenta cada movimento pendente com conta, data, entrada/saída, valor, referência e botão **Reconciliar**.

A operação exige uma referência ou motivo explícito. Depois da confirmação, o movimento passa para **Reconciliado**, a grelha é actualizada e o trilho de auditoria regista a transição. Uma repetição não duplica a alteração e devolve a indicação de que o movimento já estava reconciliado.

## Outros pontos revistos

Foram inspeccionados os botões de criação, edição, filtros, pesquisa, exportação, navegação, fecho, transições documentais, barra de tarefas, shell de janelas e comandos de Auditoria. Não foram encontrados handlers vazios ou acções “Em breve”. Os links `href="#"` da paginação da página de componentes foram substituídos por destinos de página reais, mantendo a actualização React.

Os códigos internos continuam a existir nos contratos e na base de dados, mas a interface mostra os rótulos em português, incluindo **Por reconciliar**, **Reconciliado**, **Excepção**, **Aberto**, **Pronto**, **Pendente** e **Bloqueado**.

## Validação

O cenário integrado de Tesouraria valida a criação do movimento, a reconciliação individual, a repetição idempotente, a reconciliação de saldo da conta e a auditoria. A validação global terminou com **56 ficheiros e 194 testes aprovados**, TypeScript sem erros, build de produção concluído e verificação visual da Tesouraria em 1280px com três botões **Reconciliar** funcionais.

A autenticação no endereço HTTPS de preview continua a exigir sessão própria; por isso, o clique final com uma conta de utilizador foi validado no cenário integrado autenticado e a presença visual foi confirmada no preview. A comunicação AGT permanece desligada.
