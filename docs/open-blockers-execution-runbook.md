# Runbook das pendências externas do BALANCERTS.ERP

## Finalidade

Este runbook transforma as pendências abertas do `todo.md` em passos verificáveis. Nenhuma etapa é considerada concluída por configuração fictícia, credencial de exemplo ou teste que não toque no ambiente indicado.

| Bloqueio | Pré-condição obrigatória | Evidência de conclusão | Estado actual |
|---|---|---|---|
| Homologação AGT | Credenciais, endpoint, documentação de autenticação e ambiente de homologação fornecidos pela AGT | Submissão controlada aceite/rejeitada com resposta oficial, auditoria, idempotência e retry comprovados | Preparado localmente; não activado |
| Integração bancária | Documentação do banco, endpoint, credenciais de teste, certificados e autorização da Repair Lubatec | Consulta/importação/reconciliação em ambiente de teste, com logs e isolamento por empresa | Preparado localmente; não activado |
| Restauro | URL MySQL/TiDB isolada, utilizador exclusivo e backup válido | Restauro sem escrita na produção, verificação de contagens, integridade referencial, login e módulos críticos | Não executado sem destino real |
| Instalador Windows | Máquina Windows limpa ou ambiente de validação equivalente | Instalação, actualização, desinstalação, assinatura e ausência de bloqueio do SmartScreen documentadas | Não executado no sandbox |
| Certificado de distribuição | Certificado/cadeia de assinatura e identidade de publicação fornecidos | Artefactos assinados verificados por `signtool`/Windows e cadeia válida | Não disponível no sandbox |
| Aceitação Repair Lubatec | Utilizadores autorizados, dados anonimizados/controlados e roteiro aprovado | Evidência dos ciclos Empresas, Exercício, Contabilidade, Comercial, Tesouraria, Compras, Stock, RH, Auditoria e Arquivo | Pendente de sessão controlada |
| Catálogo PGCA | Texto oficial integral, lista de contas e confirmação do contabilista | Fonte confirmada, contas importadas como rascunho, revisão humana, activação versionada e testes de posting | Parcial; contas confirmadas permanecem limitadas |
| Regras IVA | Texto integral da Lei n.º 14/23 e demais alterações vigentes, com artigos e vigência | Regras versionadas, fonte/artigo/proveniência, testes por regime e aprovação humana | Não activadas sem confirmação integral |
| Fonte Balancerts IA/SAADI | Catálogo normativo fechado e contrato semântico aprovado | Consultas somente leitura com versão, hash, proveniência e isolamento | Não exposta como fonte oficial |

## Sequência de execução

A ordem recomendada é: primeiro disponibilizar a documentação e credenciais de teste; depois configurar os destinos isolados; executar testes de conectividade sem mutações; executar ciclos controlados; recolher auditoria e respostas; e só então activar integrações ou marcar o item correspondente como concluído.

Enquanto as pré-condições não existirem, o BALANCERTS.ERP deve permanecer em modo preparado/local, com as integrações externas desactivadas, os erros estruturados, retries limitados e toda a actividade auditada. Esta decisão protege o isolamento por empresa e evita que o sistema apresente uma homologação ou conformidade normativa que ainda não foi demonstrada.
