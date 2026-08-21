# Classificação das pendências abertas

## Objectivo

Este registo separa as pendências do `todo.md` entre trabalho implementável e verificável no ambiente actual e trabalho que exige recursos externos, credenciais oficiais, validação documental ou uma máquina fora do sandbox.

| Área | Estado | Natureza | Próxima acção segura |
|---|---|---|---|
| Integrações externas pendentes | Aberta | AGT, bancos e outros endpoints exigem credenciais e documentação oficiais | Manter adaptadores, filas, auditoria, retries e estados preparados; activar apenas com credenciais reais |
| Instaladores EXE/MSI | Aberta | Requer máquina Windows limpa | Executar validação fora do sandbox e recolher evidência de instalação/actualização |
| Backup e restauro | Aberta | Requer destino MySQL/TiDB isolado e URL de restauro real | Configurar ambiente isolado, restaurar sem produção e validar módulos |
| Aceitação operacional | Aberta | Requer utilizadores Repair Lubatec e dados anonimizados/controlados | Planear execução assistida e não declarar concluído sem evidência |
| Catálogo PGCA/IVA | Aberta | Requer confirmação integral de fontes normativas oficiais | Importar somente dados confirmados como rascunho; não activar contas ou regras conjecturais |
| Integração PGCA nos módulos automáticos | Parcial | Código já usa o posting central, mas parametrizações específicas dependem do catálogo activo | Continuar a cobertura de regras sem hardcode e testar bloqueios quando não houver regra válida |
| Fonte oficial para Balancerts IA/SAADI | Aberta | Requer contrato semântico e catálogo normativo fechado | Preparar leitura versionada e proveniência, sem expor fonte incompleta como oficial |
| Testes contabilísticos de aceitação | Aberta | Requer catálogo PGCA confirmado e dados controlados | Executar depois da validação normativa, mantendo testes de invariantes actualmente activos |

## Conclusão operacional

As pendências abertas não representam todas uma falha de código. As que dependem de ambiente ou autoridade externa permanecem explicitamente bloqueadas para evitar activar integrações, regras fiscais ou contas PGCA sem fundamento. A execução imediata deve continuar pelos fluxos internos verificáveis de Tesouraria e pela cobertura de testes, seguida da preparação documental do catálogo normativo.
