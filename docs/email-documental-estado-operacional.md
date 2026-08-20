# Estado operacional do envio documental por email

O BALANCERTS.ERP já possui um fluxo interno para enviar ficheiros do arquivo documental como anexos. O procedimento valida a empresa activa, a autorização do utilizador, o acesso tenant-aware ao ficheiro, o remetente contextual e os destinatários. O remetente segue a hierarquia empresa, contabilista e conta autorizada.

A camada interna foi reforçada para que um envio bem-sucedido registe `DOCUMENT_EMAIL_SENT` e uma tentativa falhada registe `DOCUMENT_EMAIL_FAILED`. O evento de falha guarda apenas destinatários, assunto, origem do remetente e um código operacional; não guarda a mensagem completa, bytes do documento, palavra-passe SMTP ou erro técnico bruto do fornecedor.

As falhas são agora classificadas em quatro estados: configuração SMTP pendente, destinatário inválido, autenticação SMTP falhada e falha genérica de envio. A interface recebe mensagens em português e não expõe o texto técnico `535` ao utilizador.

A validação unitária do encaminhamento e do serviço passou com 9 testes. Isto confirma a lógica interna, mas não confirma o envio real através do Gmail. O teste de credenciais Gmail continua dependente de uma palavra-passe de aplicação ou de OAuth/SMTP Relay válidos para a conta configurada em `SMTP_USER`.

| Capacidade | Estado |
|---|---|
| Campo de email da empresa | Implementado e persistido |
| Campo de email de colaboradores | Implementado e persistido |
| Email de clientes/fornecedores | Disponível no modelo de contrapartes |
| Remetente contextual | Implementado e testado |
| Anexo documental | Implementado através de URL assinada e bytes do ficheiro |
| Auditoria de sucesso | Implementada |
| Auditoria de falha | Implementada |
| Autenticação Gmail real | Pendente; erro 535 confirmado |
| Envio real controlado | Pendente de credencial válida |
