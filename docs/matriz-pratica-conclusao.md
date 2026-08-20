# BALANCERTS.ERP — Matriz prática para conclusão

**Data de referência:** 20 de Agosto de 2026

## 1. Leitura correcta do estado

O BALANCERTS.ERP já possui uma base interna muito extensa. O trabalho restante não é “criar o ERP de raiz”; é fechar a aceitação operacional, ligar dependências externas autorizadas e preparar a distribuição final. A matriz abaixo distingue **feito**, **pronto para validação**, **dependente do cliente**, **dependente de fornecedor** e **dependente de autoridade externa**.

## 2. Matriz por módulo

| Módulo | Implementado | Falta validar ou fornecer | Dependência externa | Prioridade |
|---|---|---|---|---|
| Minhas Empresas | Empresas, activação, contexto, indicadores e navegação | Confirmar fluxos com mais empresas autorizadas | Nenhuma obrigatória | Alta |
| Empresas | Criação, edição, representantes, exercício, período e auditoria | Aceitação manual com dados da empresa cliente | Dados fornecidos pelo cliente | Alta |
| Contabilidade | PGC/PGCA, partidas dobradas, lançamentos, revisão, posting, estorno e relatórios | Aceitar modelos de contas e executar posting salarial aprovado | Contabilista responsável | Muito alta |
| Tesouraria | Caixa, bancos, pagamentos, transferências, extractos e reconciliação | Testar com conta bancária e extracto real anonimizado | Banco e credenciais | Alta |
| Comercial | Clientes, fornecedores, artigos, documentos, impostos, séries e numeração | Teste com ficheiro comercial real anonimizado | AGT para comunicação real | Muito alta |
| Operações | Armazéns, stock, compras, recepções, transferências e inventário | Confirmar regras de lotes/seriais aplicáveis ao cliente | Dados operacionais | Alta |
| Fiscalidade | IVA, calendário, registo, prontidão, reconciliação e regras Angola | Revisão final pelo responsável fiscal | AGT para homologação | Muito alta |
| Auditoria | Trilho append-only, filtros, reconstrução e exportação | Definir política de retenção e perfis de consulta | Política interna da empresa | Alta |
| RH | Colaboradores, contratos, IRT/INSS, folhas, recibos e tarefas | Criar dados RH e executar ensaio completo | Dados do cliente | Muito alta |
| Centro de Tarefas | Filtros, prazos, pesquisa, selecção, massa, desfazer, alertas e exportações | Teste com pelo menos duas tarefas reais | Dados RH do cliente | Alta |
| Balancerts IA | Local/offline, sugestões e revisão humana | Instalação/configuração de Ollama, se desejado | Hardware local; provider pago opcional | Média |
| Definições | Memberships, permissões, séries, regras e integrações preparadas | Configurar utilizadores finais e matriz de funções | Administrador da empresa | Alta |
| Arquivo/PDF | Versionamento, ACL, visualizador interno e downloads | Testar documentos reais anonimizados | Armazenamento e política interna | Média |
| Distribuição | Shell e targets EXE/MSI/DMG preparados | Empacotar, assinar, instalar e actualizar nos sistemas alvo | Windows, macOS e fornecedor de assinatura | Muito alta |

## 3. Fluxos que precisam de dados reais

A empresa Repair Lubatec encontra-se activa, mas a verificação operacional encontrou zero colaboradores, zero contratos, zero folhas e zero tarefas RH persistidas. Isso impede afirmar que o teste real RH → Contabilidade → Auditoria foi concluído. A forma correcta de concluir é introduzir dados verdadeiros autorizados, nunca criar dados fictícios para maquilhar o resultado.

O conjunto mínimo para aceitação consiste em dois utilizadores com funções separadas, dois colaboradores, dois contratos, duas tarefas RH, uma folha mensal, contas salariais e um período aberto. O ensaio deve cobrir cálculo, conferência, aprovação, geração do diário, bloqueio de auto-aprovação, publicação autorizada, auditoria e reversão controlada.

## 4. Integrações externas e estado de activação

| Integração | Implementação interna | Activação real | Custo/licença |
|---|---|---|---|
| AGT Facturação Electrónica | Contratos, JWS de teste, QR, hash, séries, requestID, fila, polling, retry, XSD e consola | Endpoint, credenciais, chaves, códigos, homologação e aprovação AGT | Não existe preço oficial confirmado na documentação consultada |
| SAF-T AO | Builder XML, namespace, versão XSD, validação local e bloqueios conservadores | Aceitação oficial e submissão autorizada | Sem licença identificada; custos de operação podem existir |
| Banco | Preparação de pagamentos, extractos e reconciliação interna | Banco alvo, API/ficheiro, credenciais, certificados e sandbox | Depende do banco e contrato |
| Windows Store/MSIX | Aplicação pode ser empacotada para MSIX | Conta, submissão, revisão e política da Store | A Microsoft indica assinatura da Store para MSIX como gratuita; regras comerciais da Store aplicam-se |
| Windows directo EXE/MSI | Pipeline e targets preparados | Certificado OV/Azure, timestamp, teste SmartScreen | Azure Artifact Signing Basic: 9,99 USD/mês publicado; OV normalmente 150–300 USD/ano segundo Microsoft |
| macOS DMG/PKG | Target e runtime preparados | Apple Developer, Developer ID, notarização e teste Mac | Apple Developer: 99 USD/ano publicado |
| IA local | Contrato e diagnóstico Ollama preparados | Instalar Ollama e modelo no computador do cliente | Licença do software local sem custo; hardware e manutenção têm custo |
| Armazenamento | Fluxo S3 e metadados preparado | Configurar volume, retenção e backups | Custo variável por armazenamento, pedidos e transferência |

## 5. Certificado de software: decisão correcta

Há três conceitos diferentes que devem ser separados. **Assinatura de código** identifica o editor e permite verificar a integridade do instalador. **SmartScreen** é a reputação e análise de segurança do Windows; pode continuar a mostrar avisos em ficheiros novos mesmo assinados. **Certificação AGT** é uma validação fiscal externa e não tem relação com o certificado de assinatura do instalador.

A Microsoft publica Azure Artifact Signing Basic a 9,99 USD/mês, com quota publicada de 5.000 assinaturas mensais, e Premium a 99,99 USD/mês [1]. A documentação Microsoft indica que OV tradicional ronda 150–300 USD/ano e que EV já não deve ser comprado apenas para bypass do SmartScreen, porque a reputação passou a ser construída também para EV [2]. Uma página oficial de fornecedor consultada publica OV a 129 USD/ano e apresenta opções de token físico com custo adicional [3].

A Apple publica 99 USD por ano para o Apple Developer Program, que inclui Developer ID e notarização para aplicações Mac [4]. Para distribuição Windows pela Microsoft Store em MSIX, a Store pode assinar o pacote; isso não equivale a assinar directamente um MSI/EXE entregue fora da Store [2].

Não foi encontrada fonte oficial que confirme que 19 USD seja o preço de um certificado público de assinatura de código adequado para este produto. Antes de pagar, deve-se exigir fornecedor, tipo OV/EV ou serviço cloud, validade, entidade beneficiária, compatibilidade Authenticode, armazenamento da chave, timestamp, renovação e factura.

## 6. Sequência recomendada até à versão final

### Etapa A — aceitar internamente sem custos externos

Executar todos os testes manuais com dados autorizados da Repair Lubatec, concluir o ciclo RH, validar posting salarial com aprovação, testar contas e séries reais, confirmar utilizadores e permissões, e receber o logótipo oficial. Esta etapa não exige AGT nem banco, mas exige dados correctos e disponibilidade do contabilista.

### Etapa B — preparar distribuição

Escolher se o primeiro lançamento Windows será Microsoft Store/MSIX ou download directo EXE/MSI. Se for distribuição directa, escolher Azure Artifact Signing Basic ou OV tradicional, criar identidade legal do editor, assinar no pipeline, aplicar timestamp, verificar o instalador em Windows limpo e registar hash de cada versão.

Para macOS, aderir ao Apple Developer Program, criar certificados Developer ID, assinar, notarizar, criar DMG/PKG e testar em Mac limpo. Esta etapa exige um computador macOS para a validação final.

### Etapa C — activar bancos

Escolher banco ou bancos alvo, pedir documentação de sandbox, configurar credenciais de teste, testar consulta, pagamento, retorno, timeout, idempotência e reconciliação. A produção só deve ser activada depois de autorização formal do cliente e segregação entre ambiente de testes e ambiente real.

### Etapa D — homologar AGT

Solicitar à AGT ou parceiro autorizado o endpoint, credenciais, chaves, códigos, ambiente, critérios de teste e procedimento de homologação. Activar comunicação apenas em ambiente de teste, comparar respostas, validar filas e retries, reunir evidências e aguardar confirmação formal. Até essa confirmação, a interface deve continuar a apresentar preparação e não certificação.

### Etapa E — aceitação e entrega

Executar a matriz de aceitação, corrigir apenas defeitos confirmados, congelar a versão, gerar EXE/MSI/DMG, assinar, testar instalação e actualização, preparar manual, notas de versão, cópias de segurança, procedimento de suporte e termo de limitações AGT.

## 7. Resultado final esperado

O software poderá ser considerado **pronto para entrega controlada** quando os testes reais RH e financeiros forem concluídos, a versão de distribuição estiver instalada e assinada nos sistemas alvo, os utilizadores e permissões estiverem configurados e a documentação de operação estiver entregue.

Poderá ser considerado **integrado com a AGT** somente depois de endpoint, credenciais, homologação e confirmação formal da AGT. Poderá ser considerado **integrado com banco** somente depois de testes autorizados com o banco escolhido. Poderá ser considerado **distribuído profissionalmente** depois de os instaladores serem assinados, testados e publicados através do canal escolhido.

## Referências

[1]: https://azure.microsoft.com/en-us/pricing/details/artifact-signing/ "Microsoft Azure — Artifact Signing pricing"
[2]: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options "Microsoft Learn — Code signing options for Windows app developers"
[3]: https://www.ssl.com/products/software-integrity/code-signing/ov/ "SSL.com — OV Code Signing"
[4]: https://developer.apple.com/support/compare-memberships/ "Apple Developer — Choosing a Membership"
[5]: https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/index.html "Portal do Parceiro AGT — Facturação Electrónica"
