# Especificação inicial das fronteiras SAADI/BALANCERTS.ERP

**Estado:** primeiro incremento funcional isolado implementado e validado; motor completo de cenários e integrações externas ainda pendentes  
**Produto anfitrião:** BALANCERTS.ERP  
**Titular:** Repair Lubatec  
**Autor:** Manus AI  
**Data:** 20 de Agosto de 2026

## 1. Objectivo e regra principal

Este documento define a fronteira segura do SAADI integrado no BALANCERTS.ERP. O primeiro incremento já possui tabelas, contratos, permissões próprias, helpers tenant-aware, router protegido e interface desktop; o documento continua a impedir que a implementação misture análise e projecção com os registos contabilísticos, fiscais, comerciais, de tesouraria, RH ou auditoria do ERP. O propósito é impedir que uma futura implementação misture análise e projecção com os registos contabilísticos, fiscais, comerciais, de tesouraria, RH ou auditoria que constituem a realidade operacional do ERP.

> **BALANCERTS.ERP executa, regista e controla a realidade empresarial. SAADI analisa, modela, projecta e apoia decisões.**

O BALANCERTS deve continuar a funcionar integralmente se o SAADI estiver desligado. O SAADI deve poder conservar os seus estudos e versões mesmo quando uma nova leitura do BALANCERTS não estiver disponível. A integração deve ser opcional, explicitamente autorizada, tenant-aware, auditável, idempotente e somente leitura por defeito.

## 2. Domínios e fronteiras

| Domínio | Sistema responsável | Regra de integração |
|---|---|---|
| Empresas, organizações, exercícios e períodos | BALANCERTS.ERP | O SAADI lê referências autorizadas; não cria nem activa empresas do ERP. |
| Plano de contas, lançamentos e saldos | BALANCERTS.ERP | O SAADI recebe snapshots e agregados; não edita contas, linhas, períodos ou lançamentos. |
| Facturação, documentos e numeração | BALANCERTS.ERP | O SAADI lê documentos realizados e indicadores; não reserva números, emite, anula ou contabiliza. |
| Compras, clientes, fornecedores e stock | BALANCERTS.ERP | O SAADI usa dados autorizados de desempenho; não cria recepções, movimentos ou documentos. |
| Tesouraria e bancos | BALANCERTS.ERP | O SAADI lê fluxos e posições; não inicia pagamentos, reconciliações ou importações bancárias. |
| RH e salários | BALANCERTS.ERP | O SAADI prefere métricas agregadas; dados pessoais exigem autorização específica e minimização. |
| Fiscalidade e AGT | BALANCERTS.ERP | O SAADI não altera regras, séries, QR, SAF-T, submissões ou configurações AGT. |
| Estudos e decisões projectadas | SAADI | O SAADI é responsável por premissas, cenários, versões, sensibilidades, riscos e decisões. |
| Auditoria e proveniência | Ambos | Cada leitura e cada alteração SAADI devem indicar actor, tenant, origem, versão e correlação. |

## 3. Modelo conceptual proposto para o SAADI

A primeira versão foi implementada como bounded context próprio. As entidades abaixo distinguem o que já existe no primeiro incremento do que permanece planeado.

| Entidade | Finalidade | Relações essenciais |
|---|---|---|
| `SaadiProject` | Agrupar uma iniciativa de análise ou investimento | Organização proprietária, utilizador responsável, estudos e estado. |
| `SaadiStudy` | Representar um estudo dentro de um projecto | Projecto, empresa analisada, objectivo, período de referência e estado. **Implementado no primeiro incremento.** |
| `SaadiVersion` | Congelar uma versão reproduzível do estudo | Estudo, número de versão, autor, data, estado e hash de conteúdo. **Implementado com criação, leitura, hash e transição controlada.** |
| `SaadiExternalCompany` | Representar uma entidade analisada que pode não ser empresa operacional do ERP | Projecto, identificação externa, fonte e estado de correspondência. |
| `SaadiAssumption` | Registar uma premissa explícita | Versão, categoria, valor, unidade, origem, confiança e vigência. |
| `SaadiProjection` | Guardar uma projecção calculada | Versão, métrica, período, valor, moeda, método e proveniência. |
| `SaadiScenario` | Agrupar premissas alternativas | Estudo, versão-base, alterações, nome e estado. |
| `SaadiSensitivity` | Registar variações e impacto | Cenário, variável, intervalo, resultado e método. |
| `SaadiRisk` | Registar risco, impacto e mitigação | Estudo, categoria, probabilidade, impacto, responsável e estado. |
| `SaadiDecision` | Registar uma decisão baseada no estudo | Versão aprovada, decisor, data, fundamento e estado. |
| `SaadiDataSnapshot` | Congelar dados lidos do BALANCERTS | Empresa, período, timestamp, origem, filtros, hash e estado. **Implementado com chave idempotente e leitura tenant-aware.** |
| `SaadiDataLineage` | Explicar a origem de cada métrica | Snapshot, entidade de origem, identificador, transformação e versão. **Tabela criada e leitura protegida; preenchimento detalhado depende do motor de extracção.** |
| `SaadiIntegrationRun` | Controlar uma leitura ou sincronização | Chave idempotente, estado, tentativas, erro, início, fim e correlação. |

O identificador de uma empresa externa não deve ser tratado como `companyId` do BALANCERTS. Quando existir correspondência autorizada, deve ser guardada numa relação explícita, com origem, actor que confirmou a ligação e data de confirmação. Uma correspondência nunca deve ser inferida apenas pelo nome ou pelo NIF.

## 4. Contrato de leitura BALANCERTS → SAADI

A integração inicial deve expor leituras agregadas e snapshots imutáveis, não acesso livre às tabelas. Cada pedido deve conter organização, empresa, período, moeda, versão do contrato, finalidade e correlação. A resposta deve incluir origem, data de extracção, período coberto, estado de completude, hash e avisos.

| Família de leitura | Conteúdo permitido por defeito | Conteúdo proibido por defeito |
|---|---|---|
| Financeira | Receita, custos, resultado, saldos, antiguidade e tendências agregadas | Alteração de lançamentos, contas ou períodos. |
| Comercial | Volumes, totais, margens autorizadas e evolução documental | Emissão, anulação, numeração e alteração de preços realizados. |
| Tesouraria | Fluxos, saldos agregados e posições a receber/pagar | Pagamentos, transferências, reconciliação e importação bancária. |
| Stock | Quantidades, valorização e rotação agregadas | Movimentos, ajustes, contagens e transferências. |
| RH | Custos agregados, efectivos agregados e capacidade | Nomes, NIF, contas bancárias e salários individuais sem autorização explícita. |
| Fiscal | Totais por regime, período e estado de preparação | Alteração de regras, submissões ou configuração AGT. |

O SAADI deve distinguir em todos os contratos `REALIZADO`, `IMPORTADO`, `MANUAL`, `ESTIMADO` e `PROJECTADO`. Um valor projectado nunca pode substituir ou actualizar um valor realizado do BALANCERTS.

## 5. Versionamento e proveniência

Cada estudo deve ser reproduzível. Uma versão aprovada não deve ser editada; qualquer alteração deve criar uma nova versão. A versão deve guardar hash do conteúdo, autor, data, premissas activas, fontes, snapshots utilizados, método de cálculo e estado de aprovação.

A proveniência mínima de uma métrica é: sistema de origem, tabela ou contrato lógico de origem, empresa, período, identificador quando permitido, filtros, transformação aplicada, timestamp de leitura, versão do contrato e hash. Se a origem não puder ser confirmada, o resultado deve ser marcado como incompleto ou não utilizável para decisão.

## 6. Estados e idempotência

Os estudos, versões e execuções de integração devem usar estados explícitos. Uma execução proposta é `PENDENTE`; uma leitura em curso é `EM_PROCESSAMENTO`; uma leitura concluída é `CONCLUÍDA`; uma falha recuperável é `RETRY`; uma falha definitiva é `FALHADA`; e uma divergência que exige intervenção é `RECONCILIAÇÃO_NECESSÁRIA`.

Cada execução deve possuir uma chave idempotente determinística baseada no projecto, estudo, empresa, período, versão do contrato e filtros. Repetir a mesma leitura não deve duplicar snapshots nem alterar uma versão aprovada. Erros devem guardar apenas informação operacional segura, sem credenciais ou conteúdo documental indevido.

## 7. Segurança, permissões e isolamento

A autorização SAADI deve verificar autenticação, organização, projecto, estudo e empresa em cada operação. Um utilizador não pode aceder a um estudo apenas porque conhece o seu identificador. O acesso a dados individuais de RH e a dados financeiros detalhados deve exigir permissões próprias, justificativo e auditoria.

| Permissão proposta | Âmbito |
|---|---|
| `saadi.project.read` | Ver projectos autorizados. |
| `saadi.project.manage` | Criar e gerir projectos. |
| `saadi.study.read` | Ver estudos e versões não confidenciais. |
| `saadi.study.manage` | Criar estudos e preparar versões. |
| `saadi.snapshot.read` | Ler snapshots autorizados. |
| `saadi.snapshot.refresh` | Pedir uma nova leitura do BALANCERTS. |
| `saadi.version.approve` | Aprovar uma versão para decisão. |
| `saadi.decision.record` | Registar decisão e fundamento. |
| `saadi.hr.detail.read` | Ler detalhe individual de RH, sempre excepcional e auditado. |

Nenhuma permissão SAADI deve conceder automaticamente `accounting.post`, `documents.issue`, `payments.execute`, `stock.adjust`, `period.reopen` ou permissões AGT. A integração deve reutilizar a verificação tenant-aware do BALANCERTS e não criar um caminho alternativo de acesso à base de dados.

## 8. Sequência segura de implementação futura

A implementação deve começar por um módulo isolado de leitura e estudo, com contratos, testes e migrações reversíveis. A primeira entrega não deve escrever no BALANCERTS e deve funcionar com snapshots controlados. Só depois de validar permissões, auditoria, versionamento e isolamento se deve adicionar projecções, cenários, sensibilidades, riscos e decisões.

O trabalho futuro deve seguir esta ordem: contrato lógico e tipos partilhados; tabelas SAADI; helpers tenant-aware; router protegido; snapshots de leitura; auditoria e idempotência; interface de projectos e estudos; versionamento e aprovação; motor de cenários; relatórios; e, por último, eventuais integrações externas autorizadas.

## 9. Critérios de aceitação

O SAADI só deve ser considerado pronto para a primeira validação quando o BALANCERTS continuar a iniciar e operar sem SAADI, todas as consultas verificarem organização e empresa, nenhuma mutação SAADI alterar documentos ou lançamentos do ERP, as versões aprovadas forem imutáveis, os snapshots tiverem hash e proveniência, as execuções forem idempotentes, os acessos forem auditados e os testes provarem isolamento entre pelo menos duas organizações.

Também é obrigatório demonstrar que um erro ou indisponibilidade da leitura não impede a utilização normal do BALANCERTS. A integração AGT, SMTP, bancos, assinatura de código e homologação não deve ser implicitamente considerada concluída por existir um módulo SAADI.

## 10. Decisões adiadas

O motor completo de cenários, sensibilidades, riscos, decisões e integrações externas permanece para uma etapa posterior. A política de retenção de snapshots, a utilização de dados individuais de RH e a homologação AGT continuam condicionadas por decisão funcional, credenciais e validação externa. A criação de estudos, snapshots e versões do primeiro incremento não autoriza qualquer mutação do ERP.
