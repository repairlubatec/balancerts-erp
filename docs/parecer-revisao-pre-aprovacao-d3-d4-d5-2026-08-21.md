# Parecer técnico de pré-aprovação — D3, D4 e D5

**BALANCERTS.ERP — Revisão independente:** 21 de Agosto de 2026  
**Escopo:** análise documental e de código; sem alterações de código, schema, dados, permissões, routers, interfaces, migrações ou integrações.  
**Resultado:** **NÃO APROVADO para activação operacional externa**; os três blocos podem permanecer como preparação técnica, sujeitos às correcções e evidências indicadas.

## 1. Delimitação dos códigos avaliados

O dossier consolidado do projecto define **D3** como preparação de adaptadores bancários genéricos, **D4** como backup/restauro isolado e **D5** como distribuição desktop Windows/macOS e assinatura. Esta correspondência foi usada nesta avaliação porque é a codificação documental actualmente conservada em `docs/parecer-documental-para-aprovacao-2026-08-21.md`, secção 8. D3 não é uma integração bancária real; D4 não é um restauro executado; D5 não é uma assinatura ou homologação de distribuição.

## 2. Sumário executivo

| Código | Compatibilidade com a arquitectura actual | Estado verificável | Parecer pré-aprovação |
|---|---|---|---|
| D3 — Banca | Compatível como importação/reconciliação agnóstica ao banco | Preparação local existente; sem contrato bancário externo | **Aprovado apenas como preparação, com ressalvas** |
| D4 — Backup/restauro | Compatível como runbook e ferramentas auxiliares | Hash e bloqueios básicos existentes; sem destino isolado nem restauro real | **Não aprovado para execução operacional** |
| D5 — Distribuição desktop | Shell Electron tecnicamente coerente | Empacotamento preparado; assinatura, notarização e máquinas nativas não validadas | **Não aprovado para distribuição pública** |

A suite global anteriormente validada permanece com 98 ficheiros e 368 testes aprovados, e o TypeScript sem erros. Essa linha de base não substitui as evidências externas exigidas por D3, D4 e D5.

## 3. D3 — Adaptadores bancários e tesouraria

### 3.1 Elementos conformes

O backend actual já dispõe de `cashAccounts`, `bankStatementImports`, `bankStatementLines`, `cashReconciliations`, `treasuryTransactions`, pagamentos e auditoria. O router expõe `treasury.importStatement`, `treasury.statementLines`, `treasury.matchStatementLine` e `treasury.reconcile`. Os procedimentos usam schemas Zod, seleccionam explicitamente a conta bancária, aplicam limite de 5.000 linhas na importação e distinguem permissões de criação, leitura e validação. As consultas e mutações verificadas usam empresa e organização para isolamento.

Esta estrutura é compatível com um primeiro modo operacional sem integração bancária: o utilizador importa um extracto, o sistema conserva a proveniência, apresenta linhas não conciliadas e permite reconciliação auditada. O projecto não deve assumir um formato bancário único, porque a pesquisa do BNA não forneceu um contrato público de API/open banking aplicável transversalmente [1].

### 3.2 Problemas classificados

| ID | Classificação | Regra/área afectada | Constatação técnica | Risco | Correcção documental necessária |
|---|---|---|---|---|---|
| D3-01 | **ALTO** | Integração bancária real | Não existe contrato de banco/fornecedor, ambiente de testes, método de autenticação, certificado, callback, limites ou política de idempotência específicos | Uma implementação presumida poderia expor credenciais, duplicar movimentos ou enviar pagamentos para o banco errado | Manter D3 como adaptador interno e exigir, por banco, contrato, sandbox, credenciais não produtivas, certificados, limites, callbacks, erros, retries e autorização empresarial antes de qualquer ligação |
| D3-02 | **MÉDIO** | Reconciliação e origem externa | O contrato actual cobre importação/reconciliação, mas não constitui um contrato universal de normalização para MT940, CAMT, CSV ou formatos proprietários | Extractos de bancos diferentes podem produzir datas, saldos, sinais e referências incompatíveis | Definir um DTO semântico interno versionado e adaptadores por formato, com timezone, moeda, saldo inicial/final, hash do ficheiro e chave de idempotência |
| D3-03 | **MÉDIO** | Pagamentos | `createPaymentForUser` suporta pagamento interno e idempotência, mas isto não é uma ordem bancária nem comprova liquidação externa | O utilizador pode confundir pagamento registado no ERP com pagamento executado no banco | Separar explicitamente `REGISTADO_NO_ERP`, `AGUARDA_APROVACAO`, `ENVIADO_AO_BANCO`, `ACEITE`, `REJEITADO`, `LIQUIDADO` e `RECONCILIADO`; manter o último grupo desactivado até existir contrato externo |
| D3-04 | **INFORMATIVO** | Segurança operacional | A selecção explícita de `cashAccountId`, auditoria e filtragem tenant-aware estão implementadas | O risco principal remanescente é externo, não uma falha estrutural do modo manual | Conservar os testes actuais e acrescentar testes de duplicação de ficheiro, moeda, timezone e reprocessamento de um mesmo extracto |

**Conclusão D3:** pode ser aprovado como **preparação local e importação/reconciliação manual**. Não pode ser aprovado como integração bancária real.

## 4. D4 — Backup, restauro, snapshots e segurança do destino

### 4.1 Elementos conformes

`backup-database.mjs` usa `mysqldump` com transacção consistente por defeito, streaming para gzip, cálculo SHA-256 e manifesto com ambiente/schema. `restore-database-verify.mjs` exige `RESTORE_TARGET`, rejeita `production`/`prod`, exige `RESTORE_APPROVED=true`, exige `RESTORE_DATABASE_URL`, valida o hash do backup e só depois executa o fluxo gzip → mysql. O runbook também exige cópia anterior, janela de manutenção e validação isolada [2].

### 4.2 Problemas classificados

| ID | Classificação | Regra/área afectada | Constatação técnica | Risco | Correcção documental necessária |
|---|---|---|---|---|---|
| D4-01 | **BLOQUEADOR** | Segurança do destino | `assertSafeRestoreTarget` verifica apenas o texto de `RESTORE_TARGET`; não prova que `RESTORE_DATABASE_URL` não resolve para produção, nem valida host, base, organização ou fingerprint do destino | Um operador poderia indicar `RESTORE_TARGET=teste` enquanto a URL aponta para produção | Exigir uma declaração de destino com host/base/fingerprint, allowlist de ambientes, comparação negativa contra `DATABASE_URL`, utilizador de restauro restrito e prova independente de que o destino é isolado |
| D4-02 | **ALTO** | Verificação pós-restauro | `verifyRestore` termina depois de executar o mysql e devolve `restored=true`; não executa automaticamente verificação de schema, contagens, foreign keys, tenants, relatórios, auditoria ou bloqueio de posting | Um backup pode restaurar parcialmente ou para schema incompatível e ser declarado válido | Separar estados `HASH_VALIDATED`, `RESTORED`, `SCHEMA_VALIDATED`, `DATA_VALIDATED`, `MODULES_VALIDATED`, `ROLLBACK_READY` e só declarar sucesso operacional após todos os testes |
| D4-03 | **ALTO** | Rollback | O script não implementa rollback do destino nem cria snapshot do estado do destino antes de uma restauração | Falha parcial deixa o destino de teste inconsistente e torna a repetição ambígua | Exigir destino descartável ou snapshot pré-restauro, procedimento de limpeza controlada e evidência de restauração reversível; nunca usar `DROP`/`TRUNCATE` em produção |
| D4-04 | **MÉDIO** | Proveniência e retenção | O manifesto guarda hash, schema e ambiente, mas não impõe cifragem, retenção, armazenamento externo, controlo de acesso ou assinatura do manifesto | Um backup pode ser íntegro mas exposto, expirado ou não confiável quanto à origem | Definir política de cifragem em repouso/trânsito, retenção, ACL, localização, actor, versão da aplicação, versão do schema e assinatura/chain do manifesto |
| D4-05 | **INFORMATIVO** | Estado actual | Não existe `RESTORE_DATABASE_URL` isolada fornecida e nenhum restauro real foi executado | Não há evidência operacional para aprovação | Manter D4 em preparação até existir ambiente isolado e executar o plano de aceitação sem tocar produção |

**Conclusão D4:** **não aprovado** para execução real. Os bloqueadores D4-01 e D4-02 precisam de correcção/decisão antes de qualquer restauro verificável; a ausência do destino externo impede também a prova final.

## 5. D5 — Distribuição desktop e assinatura

### 5.1 Elementos conformes

`electron/main.mjs` configura `contextIsolation=true`, `nodeIntegration=false`, `sandbox=true`, desactiva DevTools fora de desenvolvimento e exige `BALANCERTS_DESKTOP_URL` fora do modo de desenvolvimento. A especificação define EXE/NSIS, MSI, DMG e ZIP, não incorpora credenciais de produção no instalador e separa a shell Electron do backend [3].

### 5.2 Problemas classificados

| ID | Classificação | Regra/área afectada | Constatação técnica | Risco | Correcção documental necessária |
|---|---|---|---|---|---|
| D5-01 | **ALTO** | Distribuição assinada | A assinatura Windows/macOS, notarização, instalação/actualização e SmartScreen não foram testadas em máquinas nativas; o sandbox só gerou smoke test Linux | Não há evidência de que EXE/MSI/DMG instalem, actualizem ou sejam confiáveis para clientes | Escolher canal (Store/MSIX ou MSI/EXE externo), configurar runner nativo, certificado, custódia de chave, timestamp, notarização macOS e matriz de instalação/actualização/desinstalação |
| D5-02 | **ALTO** | Segurança de origem | `main.mjs` aceita qualquer `BALANCERTS_DESKTOP_URL` e abre links externos `http://` ou `https://` pelo handler de janelas | Uma configuração errada ou origem comprometida pode carregar uma aplicação não autorizada ou abrir conteúdo inseguro | Aplicar allowlist de origens de produção, exigir HTTPS fora de desenvolvimento, rejeitar HTTP mesmo em contexto de distribuição e limitar links externos a HTTPS/allowlist explícita |
| D5-03 | **MÉDIO** | Actualização e reversão | A especificação define artefactos, mas não fecha estratégia de auto-update, verificação de assinatura do update, rollback e compatibilidade de versão com o backend | Uma actualização incompatível pode deixar o cliente sem serviço ou com schema/API incompatível | Definir matriz de compatibilidade app/backend, canal de actualização, assinatura dos artefactos, verificação de integridade, rollback e janela de suporte |
| D5-04 | **MÉDIO** | MSI empresarial | O documento menciona UpgradeCode e MSI, mas não apresenta evidência de instalação por GPO/SCCM/Intune, upgrades, reparação ou desinstalação limpa | Implantação empresarial pode falhar ou deixar versões concorrentes | Criar testes nativos para instalação limpa, upgrade, downgrade bloqueado, reparação, desinstalação e múltiplos utilizadores |
| D5-05 | **INFORMATIVO** | Promessa comercial | A própria documentação alerta que certificado não elimina todos os avisos SmartScreen | Evita uma promessa juridicamente/tecnicamente excessiva | Manter a mensagem comercial limitada a assinatura, origem verificável e redução de avisos; nunca prometer ausência absoluta de alertas |

**Conclusão D5:** arquitectura Electron **aprovável como preparação técnica**, mas distribuição pública assinada não aprovada até resolver D5-01 e D5-02 e obter evidência nativa.

## 6. Compatibilidade e não-regressão

D3 é compatível com a separação actual entre tesouraria manual e integração externa futura. D4 é compatível como ferramenta auxiliar, mas o actual `restored=true` é demasiado forte sem validação posterior. D5 é compatível com o shell desktop, mas a origem remota precisa de allowlist e HTTPS estrito. Nenhuma das três áreas deve alterar o motor contabilístico, reclassificar históricos, activar PGCA incompleto ou declarar homologação AGT.

A linha de base funcional deve continuar a ser executada após qualquer correcção: suite Vitest global, TypeScript, testes de isolamento tenant-aware, testes de tesouraria/reconciliação e smoke test Electron. A validação de D4/D5 exige adicionalmente ambientes nativos/externalizados que não podem ser simulados honestamente no sandbox.

## 7. Parecer formal pré-aprovação

> **NÃO APROVADO para activação operacional externa.**

A recomendação é aprovar apenas a **preparação local** de D3 e D5, com as ressalvas indicadas, e manter D4 bloqueado até existir destino isolado e verificação pós-restauro. Não existe base técnica para declarar integração bancária real, restauro verificável, distribuição Windows/macOS assinada ou eliminação garantida de avisos de segurança.

A revisão não alterou o projecto. Antes de eventual implementação, recomenda-se uma nova autorização específica para cada correcção: D3 contrato bancário/DTO, D4 segurança e validação do destino, e D5 allowlist HTTPS/assinatura e testes nativos.

## Referências

[1]: https://www.bna.ao/ "Banco Nacional de Angola — portal institucional"
[2]: https://docs.pingcap.com/tidb/stable/backup-and-restore-overview/ "TiDB — Backup & Restore Overview"
[3]: https://www.electronjs.org/docs/latest/tutorial/code-signing "Electron — Code Signing"
[4]: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options "Microsoft Learn — Code signing options for Windows app developers"

## Ficheiros internos confrontados

- `docs/parecer-documental-para-aprovacao-2026-08-21.md`
- `docs/normative-research-proposal-2026-08-21.md`
- `docs/backup-restauro-operacional.md`
- `scripts/backup-database.mjs`
- `scripts/restore-database-verify.mjs`
- `docs/distribuicao-desktop-exe-msi-dmg.md`
- `electron/main.mjs`
- `server/db.ts`
- `server/routers.ts`
- `server/expanded-modules.test.ts`
