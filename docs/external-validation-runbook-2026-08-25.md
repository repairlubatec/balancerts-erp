# BALANCERTS.ERP — Runbook de validação externa

**Objectivo.** Este documento define os passos necessários para concluir as dependências externas sem alterar dados produtivos, sem activar regras normativas não confirmadas e sem tratar preparação local como homologação oficial.

## Regras comuns de segurança

Toda a evidência deve identificar organização, empresa, ambiente, versão do software, data/hora UTC, responsável e hash do ficheiro. Os testes devem usar dados anonimizados ou uma cópia não produtiva. Nenhuma credencial deve ser colocada no código, nos relatórios ou no chat. Qualquer operação de escrita externa exige autorização específica e registo de auditoria.

| Frente | Pré-condição obrigatória | Evidência de conclusão | Estado actual |
|---|---|---|---|
| **AGT** | Credenciais e endpoint oficiais fornecidos pela AGT; documentação vigente e ambiente de homologação | Resposta oficial, pacote SAF-T aceite no ambiente autorizado, protocolo e hash do pacote | Em espera; a configuração local não equivale a homologação |
| **Windows** | Máquina Windows limpa e permissões de instalação | Instalação EXE/MSI, actualização, remoção, execução, logs e screenshots | Em espera; requer máquina externa |
| **Assinatura Windows** | Certificado de distribuição sob controlo do proprietário e política de timestamp | Verificação Authenticode, cadeia do certificado, timestamp e hash do instalador | Em espera; não existe certificado no sandbox |
| **Bancos** | Banco participante, documentação API, ambiente de testes e credenciais técnicas | Teste de consulta/pagamento simulado autorizado, correlação, resposta e auditoria | Em espera; não existe endpoint ou credencial oficial |
| **Docker/MySQL local** | Docker disponível no computador do utilizador | Contentor separado, volume separado, fingerprint diferente e teste de restauro | Em espera; TiDB isolado já foi usado para validação real |
| **Aceitação Repair Lubatec** | Sessão com utilizadores autorizados e dados anonimizados | Checklist assinada, casos executados, defeitos e decisão de aceitação | Em espera; não presumir aprovação |
| **PGCA/IVA** | PDF oficial legível e confirmação humana das páginas | Página, código, designação, natureza, movimento, fonte e decisão por conta/regra | Em espera para itens não legíveis ou não confirmados |

## Ordem de execução

Primeiro deve ser confirmada a identidade do ambiente e o backup da configuração. Em seguida executam-se instalação e actualização numa máquina Windows limpa, depois os testes contabilísticos e fiscais com dados anonimizados. A integração bancária só pode iniciar depois de existir um ambiente de testes do banco. A submissão AGT só pode ocorrer após validação oficial do pacote e autorização do titular. A confirmação PGCA/IVA deve permanecer separada da configuração técnica até existir evidência visual humana suficiente.

## Critérios de bloqueio

A execução deve parar quando faltar uma credencial oficial, o endpoint não estiver allowlisted, o hash da evidência não coincidir, o ambiente for identificado como produção, a cadeia normativa estiver incompleta, o instalador não tiver assinatura verificável ou surgir uma divergência contabilística. Nestes casos o estado correcto é **Em espera**, acompanhado do motivo e da evidência disponível.

## Registo mínimo por execução

Cada execução deve guardar: identificador de correlação; actor; empresa; ambiente; versão; data/hora; pré-condições; comandos ou acções executadas; resultado; ficheiros de evidência; SHA-256; anomalias; decisão; responsável pela aprovação. A aceitação formal não deve ser inferida a partir de testes automatizados.

## Estado actual do BALANCERTS.ERP

O projecto possui validação local, backup real verificado, restauro validado no TiDB isolado, controlos tenant-aware, modelos documentais por empresa e suite global aprovada. Permanecem pendentes apenas as frentes que requerem recursos externos, credenciais oficiais, confirmação humana ou aceitação formal.


## Verificação de disponibilidade — 25 de Agosto de 2026

Foi feita uma consulta apenas de leitura ao Gmail associado ao projecto para procurar respostas aos pedidos enviados à AGT sobre chaves/certificados de facturação electrónica e consulta de NIF, bem como informação de bancos, Windows, MSI/EXE e certificados. Foram localizados os pedidos enviados e documentos internos do projecto, mas não foi localizada resposta oficial da AGT, credencial, endpoint bancário, certificado de distribuição ou evidência de máquina Windows. Não foi enviado nenhum email e nenhuma credencial foi alterada.

A verificação do sandbox confirmou que o comando Docker não está instalado neste ambiente. Isto não prova a disponibilidade ou indisponibilidade de Docker no computador do utilizador; por isso, a frente Docker/MySQL local permanece em espera e não deve ser marcada como concluída. O destino TiDB Cloud isolado continua a ser a evidência de restauro validada para esta etapa.

A ausência destes recursos mantém correctamente bloqueadas as tarefas de homologação AGT, integração bancária, assinatura e validação EXE/MSI. A implementação local prossegue apenas com testes não destrutivos, sem activar integrações externas por suposição.
