# Balancerts IA — Fase 1

## Objectivo

Foi implementada a primeira camada modular do Balancerts IA dentro do BALANCERTS.ERP, sem alterar a emissão fiscal, a contabilização, a tesouraria, o stock ou a comunicação real com a AGT. A camada apresenta estado verificável, configuração controlada e providers substituíveis.

## Arquitectura

O contrato `IAProvider` suporta tarefas de classificação, preenchimento assistido, sugestões, análise documental, assistência operacional e detecção de duplicados. A implementação inclui `LocalAIProvider`, `AzureAIProvider`, `OpenAIProvider` e `AIRouter`.

O roteamento é offline-first: prefere IA local quando activada e disponível; para tarefas documentais mais complexas pode preferir Azure ou OpenAI quando explicitamente activados e configurados. Quando não há provider disponível, a camada devolve estado sem ligação e não bloqueia o ERP.

Nenhuma chave é enviada ao cliente. A Fase 1 guarda apenas referências de segredo e configuração não sensível; as chaves efectivas permanecem no ambiente do servidor e ainda não foram solicitadas nem ligadas.

## Persistência e isolamento

Foram criadas as tabelas `balancertsIaConfigs` e `balancertsIaLogs`, com isolamento por organização e empresa. Os logs guardam operação, provider, modelo, confiança opcional, resumo limitado, duração e erro, sem guardar conteúdo fiscal integral nem segredos.

As consultas e alterações verificam a relação entre utilizador, organização e empresa. A alteração da configuração regista também evento de auditoria. O estado desactivado impede consultas a providers e a execução de tarefas.

## Interface desktop

Foi criada a janela **Balancerts IA** dentro do shell Windows existente, com estado de ligação, cartões de IA local, Azure, OpenAI e segurança, configuração de endereço, porta e modelos, actualização manual e histórico mínimo de operações. Os rótulos visíveis foram revistos para português; nomes próprios de fornecedores e modelos permanecem como identificadores de produto.

## Validação

A migração `0027_slimy_maddog.sql` foi revista e aplicada sem operações destrutivas. Foram adicionados testes de providers, roteamento, ausência de chamadas a providers desactivados, RBAC e contratos tRPC. A validação final aprovou 59 ficheiros de teste e 210 testes, TypeScript sem erros, build de produção e revisão visual do módulo `/ia`.

## Limites deliberados da Fase 1

A Fase 1 não activa credenciais cloud, não envia dados fiscais para terceiros, não altera documentos automaticamente, não contabiliza sugestões e não executa acções críticas sem confirmação humana. A integração AGT continua desligada até existirem credenciais, endpoint, XSD e homologação oficial.
