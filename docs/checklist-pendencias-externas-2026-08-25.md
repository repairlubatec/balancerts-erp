# Checklist operacional das pendências externas — BALANCERTS.ERP

**Data:** 25 de Agosto de 2026  
**Estado:** preparação local; nenhuma integração externa ou validação de ambiente foi executada.  
**Princípio:** cada item só pode sair de espera quando existir evidência verificável, associada à organização correcta e registada no histórico de auditoria.

> Este documento é um roteiro de execução futura. Não constitui homologação, assinatura, restauro, compatibilidade Windows, integração bancária, integração AGT ou aceitação da Repair Lubatec.

## Matriz de desbloqueio

| Área | Pré-requisitos obrigatórios | Evidência mínima de desbloqueio | Acção segura posterior | Bloqueio actual |
|---|---|---|---|---|
| Restauro MySQL/TiDB | URL real de base isolada; utilizador não-root; allowlist; fingerprint; atestado `ISOLATED`; aprovação explícita | Registo dos parâmetros sem expor segredos, fingerprint independente, atestado e teste de acesso restrito | Executar preflight, restauro não destrutivo, validação de schema/dados/isolamento e rollback | Em espera — destino externo não fornecido |
| Windows EXE/MSI | Máquina Windows limpa; artefactos identificados; procedimento de instalação e actualização | Evidência datada de instalar, abrir, actualizar, desinstalar e reinstalar | Repetir em máquina limpa e arquivar resultados por versão | Em espera — máquina externa necessária |
| Assinatura Windows | Certificado `.p12`/`.pfx`; cadeia de confiança; password fornecida por canal seguro; identidade do editor | Resultado de assinatura e verificação da cadeia no Windows, sem guardar o segredo no repositório | Executar wrapper de assinatura fora do fluxo de desenvolvimento e verificar o artefacto | Em espera — certificado e ambiente não fornecidos |
| AGT | Endpoint oficial; credenciais; códigos de software; documentação e homologação | Resultado oficial de homologação e resposta do ambiente de testes | Activar apenas o conector homologado, com idempotência e auditoria | Em espera — endpoint e credenciais oficiais não fornecidos |
| Banca | Documentação do banco; sandbox; credenciais limitadas; permissões; formato de extractos | Execução no sandbox com reconciliação, idempotência e auditoria comprovadas | Activar apenas o fluxo autorizado no ambiente de testes | Em espera — banco e sandbox não fornecidos |
| Aceitação Repair Lubatec | Sessão autorizada; utilizadores; dados anonimizados/controlados; cenários assinados | Relatório de aceitação com resultado por ciclo e responsáveis identificados | Corrigir apenas falhas reproduzíveis e registar decisão de aceitação | Em espera — sessão do cliente não iniciada |

## Regras de segurança

Nenhum valor fictício deve ser colocado em `RESTORE_DATABASE_URL`, certificados, endpoints, credenciais, códigos AGT ou parâmetros bancários. A preparação local não deve abrir ligações externas, contactar produção ou alterar dados normativos activos. O sistema deve rejeitar destinos de restauro sem isolamento demonstrável, utilizadores privilegiados, hosts fora da allowlist, fingerprint inválido, aprovação ausente ou atestado diferente de `ISOLATED`.

A confirmação de uma conta PGCA, regra contabilística ou diploma IVA continua dependente de fonte primária legível e conferência humana. A existência de uma preparação técnica, de um teste local ou de um ficheiro anexado não substitui essa confirmação.

## Critérios de conclusão

Uma pendência só pode ser marcada como concluída quando a evidência correspondente estiver disponível, for verificável e estiver associada ao ambiente, versão e organização correctos. O resultado deve ser registado no histórico de auditoria com data UTC, actor, escopo, hash ou identificador da evidência e decisão. Na ausência de qualquer pré-requisito, o estado correcto permanece **Em espera**.

## Estado desta preparação

A preparação local está concluída apenas ao nível documental e de sinalização. Não foram executados restauros reais, testes Windows, assinatura de código, homologação AGT, integração bancária ou aceitação externa.
