# BALANCERTS.ERP — Dossier interno de pré-homologação

**Estado do documento:** preparação interna, sem declaração de certificação ou homologação.

**Âmbito:** evidência técnica do que pode ser validado localmente antes de receber credenciais, endpoint definitivo, número de validação e critérios formais da AGT.

## 1. Limite de conformidade

O BALANCERTS.ERP encontra-se preparado para validação técnica controlada, mas **não deve ser apresentado como software certificado, homologado ou validado pela AGT**. A comunicação real com os serviços AGT permanece desactivada até que a equipa disponha dos elementos oficiais e autorize a configuração do ambiente correspondente.

| Elemento | Estado interno | Dependência externa |
|---|---|---|
| Emissão de rascunhos e numeração | Implementado e testado | Regras oficiais definitivas, quando aplicáveis |
| QR Code de preparação | Implementado com aviso de não certificação | Confirmação do modelo oficial em homologação |
| PDF de preparação | Implementado com hash, linhas, totais e QR | Aprovação do modelo fiscal final |
| Importação CSV/XLSX | Implementada com pré-validação e bloqueio de PII | Ficheiros reais anonimizados fornecidos pela equipa |
| Fila de submissão AGT | Implementada em modo de preparação | Endpoint, credenciais, token e homologação |
| Assinatura JWS | Implementada para testes controlados | Chaves oficiais e política de gestão aprovada |
| SAF-T AO e validações locais | Preparados para validação estrutural | XSD e versão oficial aplicável ao ambiente |
| Comunicação AGT real | Desactivada | Autorização expressa, credenciais e homologação |

## 2. Evidências já disponíveis

As áreas internas foram cobertas por testes unitários, integração, permissões e ciclos E2E em tenants descartáveis. Os fluxos verificados incluem isolamento entre empresas, criação de empresa PENDING, representante principal, exercício, período, séries documentais, reserva de numeração, rascunhos, auditoria, importação controlada e geração de PDF de preparação.

A selecção da empresa activa é persistente e tenant-aware. Antes de uma operação, a interface mostra o nome, NIF e estado da empresa em contexto. A facturação usa as séries activas configuradas para essa empresa e bloqueia combinações incompatíveis de série e tipo documental antes da criação do rascunho.

## 3. Checklist interno de preparação

| Verificação | Critério de conclusão | Evidência esperada |
|---|---|---|
| Isolamento tenant-aware | Nenhuma consulta de uma empresa devolve dados de outra | Teste E2E descartável e auditoria de escopo |
| Numeração | Reserva transaccional sem duplicados | Teste de concorrência e evento de auditoria |
| Fiscalidade | Totais, impostos e regime coerentes | Testes fiscais e revisão de documento |
| Integridade | Hash e cadeia de alterações preservados | Hash SHA-256, auditoria e teste de integridade |
| Privacidade | Ficheiros com NIF, email ou telefone detectados antes da persistência | Relatório de pré-validação e bloqueio |
| Exportação | CSV/XLSX e PDF produzidos sem perda dos campos fiscais | Ficheiros de evidência internos |
| Permissões | Operações incompatíveis com o perfil são recusadas | Testes RBAC do router |
| Recuperação | Falhas de fila não perdem requestID nem estado | Testes de persistência e backoff |

## 4. Elementos que devem ser fornecidos antes da homologação

A equipa deverá obter pelos canais oficiais da AGT o endpoint de cada ambiente, método de autenticação, credenciais de testes, token ou certificado exigido, número de validação do software, versão de XSD/contratos, códigos de resposta, limites de lote e critérios de homologação. Estes elementos não devem ser inventados, inferidos de exemplos ou colocados directamente no código-fonte.

A configuração deverá ser feita primeiro num ambiente de testes isolado. Qualquer activação de comunicação, assinatura com material oficial ou envio de documentos reais deve ser tratada como uma etapa separada, com registo de autorização, rotação segura de segredos, logs técnicos e plano de reversão.

## 5. Regra de segurança operacional

Até à conclusão da homologação oficial, os documentos gerados pelo sistema devem manter a indicação de preparação e não certificação. O QR Code, o PDF, a fila e os adaptadores internos não constituem, por si só, prova de validação AGT.

> **Conclusão:** o software possui uma base interna ampla para iniciar uma homologação controlada, mas a conformidade oficial depende dos artefactos, acessos e decisões da AGT. O BALANCERTS.ERP não activa nem declara essa integração enquanto esses requisitos não forem fornecidos e validados.
