# Pendências externas abertas — BALANCERTS.ERP

**Data de revisão:** 23 de Agosto de 2026.  
**Estado:** preparação local concluída; execução externa ainda não autorizada ou não disponível.

O repositório não apresenta uma falha local que permita fechar estas tarefas com segurança. As 27 entradas pendentes no `todo.md` são repetições de cinco dependências operacionais: restauro isolado, validação desktop, assinatura de código, integrações oficiais e aceitação pela Repair Lubatec.

| Dependência | Estado local | Evidência que falta para concluir | Acção segura quando disponível |
|---|---|---|---|
| Restauro MySQL/TiDB | Guardas, backup, hash, allowlist, fingerprint, atestado, validação pós-restauro e rollback preparados | URL real de base isolada, utilizador restrito, allowlist, fingerprints, atestado independente e aprovação | Executar exclusivamente contra o destino isolado e validar schema, dados, isolamento, módulos e rollback |
| Windows EXE/MSI | Configuração Electron Builder e workflow CI preparados; smoke test Linux não assinado executado | Máquina Windows limpa e evidência de instalação, actualização, desinstalação e execução | Validar os artefactos numa máquina externa limpa sem declarar compatibilidade antes dos resultados |
| Assinatura Windows | Wrapper `build-windows-signed.mjs` e `forceCodeSigning` preparados | Certificado `.p12`/`.pfx`, cadeia de confiança e password fornecidos de forma segura | Assinar fora do repositório e validar a cadeia no Windows; nunca inventar certificado |
| AGT | Modelos, validações e bloqueio de submissão externa preparados | Endpoint, credenciais, códigos e resultado oficial de homologação | Activar apenas após homologação oficial e teste controlado |
| Banca | Contratos de extractos e reconciliação preparados sem chamadas externas | Documentação do banco, ambiente de testes, credenciais e permissões | Iniciar no sandbox do banco e preservar idempotência e auditoria |
| Aceitação Repair Lubatec | Suite técnica e cenários controlados preparados | Sessão autorizada, utilizadores e dados reais anonimizados/controlados | Executar ciclos assinados pela entidade e recolher evidência de aceitação |

## Protecções mantidas

O preflight `pnpm external:preflight` funciona em modo seguro: não abre ligações, não executa comandos MySQL, não acede à AGT ou a bancos e não imprime URLs, passwords, certificados ou fingerprints. O verificador de restauro continua a rejeitar destino ausente, produção, utilizador root, fingerprint coincidente, host fora da allowlist, ausência de aprovação e ausência de atestado `ISOLATED`.

A preparação local não é apresentada como homologação, assinatura, restauro real, compatibilidade Windows, integração bancária ou aceitação do cliente. As entradas pendentes do `todo.md` permanecem abertas até existir a respectiva evidência externa verificável.

## Validação local desta revisão

A suite global foi executada com **133 ficheiros e 530 testes aprovados**. O TypeScript e o build de produção foram aprovados. O empacotamento local Linux não assinado foi executado apenas como smoke test; os artefactos temporários permanecem ignorados pelo repositório.
