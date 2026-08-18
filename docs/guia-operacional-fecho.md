# BALANCERTS.ERP — Guia operacional de fecho

## Ordem de configuração

Comece por seleccionar a empresa activa no cabeçalho. Todas as operações seguintes ficam limitadas a essa empresa. Para uma empresa nova, complete representante principal, exercício fiscal e período antes de activar. Depois configure pelo menos uma série documental activa para cada tipo de documento utilizado.

## Ordem de utilização diária

Em Facturação, confirme a empresa activa, seleccione a série, indique a contraparte e as linhas comerciais e crie o rascunho. Valide os totais antes de qualquer transição de estado. Em Contabilidade, consulte apenas lançamentos publicados e siga a cadeia de origem até ao documento. Em Tesouraria, Stock e Imobilizado, confirme o período aberto e a conta/produto/activo antes de guardar.

## Controlo e fecho

Use Auditoria para consultar eventos da empresa activa e exportar o resultado filtrado. Use Relatórios para reconciliação entre razão, documentos e auxiliares. Antes do fecho, resolva todas as pendências bloqueantes; uma reabertura requer motivo e fica auditada.

## Estados e erros

Um estado vazio significa que não existem registos persistidos para a empresa activa; não representa dados de exemplo. Um erro de permissão deve ser resolvido pelo perfil adequado, nunca contornado no cliente. Um erro de configuração deve ser corrigido na empresa activa antes de repetir a operação.

## Limitações AGT

O software está preparado para validações locais, QR, hash, payloads, filas internas e dossier técnico. A comunicação real, credenciais, endpoint definitivo, número de validação, homologação e declaração de certificação dependem exclusivamente da AGT e da equipa responsável. Até esses elementos existirem, não são enviados documentos reais nem deve ser apresentada certificação.

## Protecção de dados

Testes devem usar tenant descartável e ficheiros anonimizados. NIF, emails, telefones e moradas reais não devem ser colocados em ficheiros de teste. A Repair Lubatec é um tenant real e não deve ser usado para ensaios destrutivos ou dados artificiais.
