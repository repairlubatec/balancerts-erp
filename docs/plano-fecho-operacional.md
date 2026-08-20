# BALANCERTS.ERP — Plano de fecho operacional

**Data de referência:** 20 de Agosto de 2026  
**Empresa de referência:** Repair Lubatec  
**Objectivo:** definir exactamente o que deve ser executado para transformar a validação técnica actual numa aceitação operacional controlada.

## 1. Situação actual

A base interna do BALANCERTS.ERP está implementada e validada com **82 ficheiros de teste e 298 testes aprovados**, TypeScript sem erros, build de produção aprovado, revisão visual desktop concluída e sem erros recentes de servidor ou consola após a última correcção tenant-aware.

A validação operacional real da Repair Lubatec ainda não pode ser fechada porque a última consulta encontrou **zero colaboradores, zero contratos, zero folhas de pagamento e zero tarefas RH persistidas**. Não devem ser criados dados fictícios para apresentar uma aceitação que não aconteceu.

## 2. Critérios de aceitação operacional

A aceitação deve ser realizada com dados autorizados da Repair Lubatec, num período de teste identificado e com utilizadores separados por função. Cada resultado deve ser guardado na auditoria e acompanhado por evidência exportável.

| Critério | Resultado esperado | Evidência necessária |
|---|---|---|
| Empresa activa | Repair Lubatec aparece como empresa operacional no contexto correcto | Registo da empresa, NIF, período e auditoria |
| Acessos | Cada utilizador só vê e executa o que a sua função permite | Matriz de permissões e tentativas autorizadas/bloqueadas |
| RH | Colaboradores e contratos activos aparecem isolados por empresa | Lista e registos auditados |
| Folha | IRT, INSS, bruto, descontos e líquido são calculados conforme a parametrização | Folha aprovada e mapa de cálculo |
| Diário salarial | O diário equilibra e requer aprovação separada antes do posting | Pré-visualização, aprovação e lançamento |
| Auditoria | Cada criação, alteração, aprovação, posting e reversão fica registado | Histórico por entidade e por empresa |
| Tarefas | Alteração em massa, confirmação e desfazer repõem o estado anterior | Evidência antes/depois e correlação |
| Relatórios | Diário, Razão, Balancete e mapa salarial reflectem o resultado aprovado | Exportações e conferência do contabilista |
| Segurança | Utilizador de outra empresa não consegue consultar ou alterar dados | Teste cross-tenant negativo |

## 3. Checklist RH → Contabilidade → Auditoria

### Preparação

A equipa deve criar pelo menos dois colaboradores reais autorizados, dois contratos activos, uma regra salarial vigente, duas tarefas RH e um período mensal de teste. Deve existir pelo menos um responsável RH, um conferente e um aprovador contabilístico distintos. Os dados devem ser verdadeiros e introduzidos pelo responsável autorizado ou anonimizados quando usados apenas para demonstração.

### Execução da folha

O responsável deve calcular a folha do período, verificar vencimento bruto, contribuição do trabalhador, IRT, contribuição patronal e líquido. O sistema deve produzir um resultado determinístico, apresentar o detalhe por colaborador e exigir conferência antes da aprovação.

### Diário salarial

Depois da conferência, o contabilista deve gerar o diário salarial. O sistema deve confirmar que o total a débito coincide com o total a crédito, identificar a folha de origem, impedir auto-aprovação, manter o diário em revisão e bloquear a publicação até existir aprovação válida.

### Posting e relatórios

Com o aprovador autorizado, deve ser publicado o diário. Depois devem ser consultados Diário, Razão, Balancete e Auditoria. O resultado deve mostrar a origem da folha, o utilizador que aprovou, o utilizador que publicou, o período, as contas movimentadas e a correlação do lançamento.

### Tarefas e desfazer

Na mesma sessão, devem ser seleccionadas duas tarefas RH reais. Deve ser alterado o estado ou a prioridade em massa, confirmada a operação na janela interna e verificado o toast de sucesso. Em seguida, deve ser accionado **Desfazer**, confirmada a reposição do estado inicial e verificado o evento de auditoria. Uma tentativa de desfazer depois de uma alteração concorrente deve ser recusada com mensagem clara.

## 4. Dados que o cliente precisa fornecer

| Dado | Finalidade |
|---|---|
| Colaboradores e contratos reais | Calcular folha e testar o fluxo RH |
| Regra salarial e período | Determinar IRT, INSS e vigência |
| Utilizadores e funções | Testar segregação de funções |
| Plano de contas validado | Mapear diário salarial |
| Duas tarefas RH | Executar alteração em massa e desfazer |
| Logótipo oficial PNG/SVG | Cabeçalho dos recibos e documentos |
| Ficheiro comercial anonimizado | Testar importação real |
| Extracto bancário anonimizado | Validar reconciliação com estrutura do cliente |

## 5. Dependências que não podem ser concluídas apenas no código

| Dependência | O que falta | O que não deve ser afirmado |
|---|---|---|
| AGT | Endpoint, credenciais, chaves, códigos, ambiente de testes e homologação | Não declarar certificação ou submissão real |
| Banco | Banco alvo, API/ficheiro, sandbox, credenciais e autorização | Não declarar pagamentos bancários automáticos |
| Windows | Escolha Store/MSIX ou distribuição directa e assinatura | Não dizer que 19 USD é certificado confirmado |
| macOS | Apple Developer, Developer ID, notarização e Mac para teste | Não declarar DMG notarizado antes do ensaio |
| Logótipo | Ficheiro oficial e confirmação da entidade | Não fabricar activo oficial |
| Dados RH | Registos reais autorizados | Não declarar teste operacional real com base em fixtures |

## 6. Distribuição final

Para Windows, a decisão deve ser tomada entre Microsoft Store/MSIX e distribuição directa EXE/MSI. A Microsoft indica assinatura da Store para MSIX distribuído pela Store, enquanto a distribuição directa requer assinatura do editor. Azure Artifact Signing Basic é publicado a 9,99 USD/mês; certificados OV tradicionais aparecem na documentação Microsoft numa faixa típica de 150–300 USD/ano. Para macOS, a Apple publica 99 USD por ano para o Apple Developer Program, incluindo Developer ID e notarização.

A assinatura identifica o editor e protege contra alteração do ficheiro, mas não é garantia absoluta contra malware e não elimina automaticamente toda a reputação SmartScreen. Cada versão deve ser assinada, receber timestamp, ser testada num sistema limpo e ter hash registado.

## 7. Ordem de conclusão recomendada

| Ordem | Acção | Pode iniciar agora? |
|---:|---|---|
| 1 | Fornecer dados RH autorizados e duas tarefas | Sim, pelo cliente |
| 2 | Executar teste RH → Contabilidade → Auditoria | Depois da ordem 1 |
| 3 | Fornecer logótipo e ficheiro anonimizado | Sim, pelo cliente |
| 4 | Escolher rota Windows e fornecedor de assinatura | Sim, decisão comercial |
| 5 | Preparar conta Apple Developer, se macOS for primeiro lançamento | Sim, decisão comercial |
| 6 | Solicitar dados formais AGT | Sim, mas depende da resposta externa |
| 7 | Escolher banco e solicitar sandbox | Sim, mas depende do banco |
| 8 | Empacotar e assinar EXE/MSI/DMG | Depois das ordens 4 e 5 |
| 9 | Homologar AGT e testar banco | Depois das credenciais |
| 10 | Aceitação final e entrega | Depois de todas as evidências |

## 8. Definição honesta de “finalizado”

O software pode ser considerado **finalizado internamente** quando os testes técnicos continuam aprovados, os fluxos reais RH e financeiros foram executados, a auditoria foi conferida, as permissões foram aceites e a versão de distribuição foi testada.

O software só pode ser considerado **integrado com a AGT** depois de homologação e confirmação formal da AGT. Só pode ser considerado **integrado com banco** depois de uma ligação autorizada e testada ao banco escolhido. Só pode ser considerado **distribuído profissionalmente** depois de os instaladores serem assinados, testados e publicados pelo canal escolhido.

## 9. Estado final no momento deste documento

O BALANCERTS.ERP está pronto para a fase de aceitação controlada. Não há, após a última ronda, um erro interno reproduzível conhecido nos módulos auditados. A próxima acção prática não é uma nova expansão indiscriminada de funcionalidades: é inserir os dados reais autorizados, executar o checklist acima e recolher as evidências. Depois disso, as únicas pendências serão as integrações e serviços que exigem entidades externas.
