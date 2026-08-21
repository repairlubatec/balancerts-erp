# Achados de revisão D3–D5 — 21/08/2026

## Contexto documental

O dossier `docs/parecer-documental-para-aprovacao-2026-08-21.md` define D3 como preparação de adaptadores bancários genéricos, D4 como runbook de backup/restauro isolado e D5 como escolha/validação da distribuição Windows. Esta revisão é pré-aprovação e não autoriza alterações de código, schema, dados, permissões, routers ou integrações.

## D3 — Banca e tesouraria

A fonte documental do BNA consultada foi `https://www.bna.ao/`; não foi encontrado contrato público único de API/open banking aplicável a todos os bancos. A regra técnica deve, portanto, manter o ERP agnóstico ao banco e exigir adaptadores por instituição.

O backend actual já possui `cashAccounts`, `bankStatementImports`, `bankStatementLines`, `cashReconciliations`, pagamentos e auditoria tenant-aware. O router expõe `treasury.importStatement`, `treasury.statementLines`, `treasury.matchStatementLine` e `treasury.reconcile`, com validação Zod, selecção explícita de `cashAccountId`, limite de 5.000 linhas e papéis separados para criar, ler e validar.

Conclusão preliminar D3: compatível como modo de importação/reconciliação. Não existe ainda integração bancária real, contrato de autenticação, callback, certificado, limites por banco ou ambiente de testes externo; não se pode declarar integração automática.

## D4 — Backup e restauro

O runbook `docs/backup-restauro-operacional.md` exige hash SHA-256, retenção, restauro mensal isolado, validação de módulos e aprovação explícita para produção. A fonte TiDB preservada no dossier é `https://docs.pingcap.com/tidb/stable/backup-and-restore-overview/`.

O script `scripts/restore-database-verify.mjs` bloqueia alvo vazio/produção, exige `RESTORE_APPROVED=true`, exige `RESTORE_DATABASE_URL`, valida manifesto SHA-256 e executa `gzip`/`mysql` por streaming. Contudo, a guarda actual valida apenas o texto de `RESTORE_TARGET`, não prova que a URL não resolve para produção, não verifica versão/schema antes do restauro, não executa por si a validação pós-restauro dos módulos e não implementa rollback do destino. O restauro real não foi executado por ausência de destino isolado.

Conclusão preliminar D4: boa preparação defensiva, mas não aprovado como restauro operacional completo; falta destino isolado, prova de não-produção, validação pós-restauro e evidência de rollback.

## D5 — Distribuição Windows/macOS

A especificação `docs/distribuicao-desktop-exe-msi-dmg.md` define Electron com `contextIsolation=true`, `sandbox=true`, `nodeIntegration=false`, URL de produção via `BALANCERTS_DESKTOP_URL` e fallback localhost apenas em desenvolvimento. O ficheiro `electron/main.mjs` confirma estas salvaguardas e bloqueia a distribuição sem URL.

A documentação Microsoft preservada usa `https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options`; Electron usa `https://electronjs.org/docs/latest/tutorial/code-signing`. O projecto tem configuração para NSIS/EXE, MSI, DMG e ZIP, mas assinatura, notarização, teste em Windows/macOS limpos e reputação SmartScreen exigem certificados, runners e máquinas externas. Um certificado não garante ausência de todos os avisos.

Conclusão preliminar D5: arquitectura desktop compatível e defensiva; distribuição assinada não está validada. A decisão Store/MSIX versus MSI/EXE deve permanecer aberta até escolha de canal e credenciais/certificados.

## Pontos a confrontar na avaliação formal

| Código | Estado preliminar | Principal bloqueio |
|---|---|---|
| D3 | Preparado, não integrado externamente | Ausência de contrato/credenciais/ambiente bancário |
| D4 | Preparado, não testado realmente | Ausência de `RESTORE_DATABASE_URL` isolada e validação pós-restauro |
| D5 | Shell e empacotamento preparados | Ausência de assinatura, runners e máquinas nativas |
