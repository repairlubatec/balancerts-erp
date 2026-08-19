# Arquivo digital P1 — BALANCERTS.ERP

## Objectivo

Foi implementado um arquivo digital interno integrado no módulo **Documentos**, mantendo a experiência de janela desktop do BALANCERTS.ERP e sem abrir pop-ups do navegador. O arquivo reutiliza o armazenamento de ficheiros existente, acrescentando metadados operacionais, classificação, pesquisa, ACL, versionamento e arquivamento lógico.

## Funcionalidade implementada

| Área | Resultado |
|---|---|
| Metadados | Classificação Fiscal, Contabilístico, Contrato, Recursos humanos ou Outro; descrição e referência opcional. |
| Pesquisa | Pesquisa tenant-aware por nome do ficheiro, descrição e referência, com filtro por classificação. |
| Integridade | SHA-256, tamanho, tipo MIME e chave de armazenamento continuam registados. |
| Versionamento | Cada registo inicia na versão 1; novas versões são armazenadas separadamente e tornam-se a versão actual após persistência. |
| ACL | O download continua condicionado à autorização e à ACL existente; alterações de metadados, versões e arquivamento ficam limitadas ao proprietário do ficheiro. |
| Arquivamento | O ficheiro deixa de aparecer no arquivo operacional, sem apagar o objecto nem o histórico, e exige motivo obrigatório. |
| Auditoria | Registadas as acções FILE_ASSET_REGISTERED, FILE_ASSET_METADATA_UPDATED, FILE_ASSET_VERSION_CREATED e FILE_ASSET_ARCHIVED. |
| Interface | Painel integrado na janela Documentos, com pesquisa, classificação directa, histórico de versões, carregamento de versão e arquivamento com confirmação interna. |

## Base de dados

Foi aplicada a migração `drizzle/0023_green_invisible_woman.sql`. A alteração é não destrutiva: acrescenta metadados à tabela `fileAssets` e cria `fileAssetVersions` para manter o histórico imutável de versões. Os identificadores técnicos e hashes permanecem disponíveis para auditoria e validação de integridade.

## Validação

A suite terminou com **56 ficheiros de teste e 197 testes aprovados**. O TypeScript foi concluído sem erros e o build de produção foi concluído. A verificação visual de `/documentos` confirmou a integração no shell Windows, a composição de alta densidade e a apresentação em português. O aviso de blocos JavaScript superiores a 500 kB continua a ser apenas uma optimização futura; não bloqueia a execução nem a entrega desta funcionalidade.

A comunicação real com a AGT permanece desligada. O arquivo é uma capacidade interna de gestão documental e não declara certificação ou homologação fiscal.
