# BALANCERTS.ERP — Matriz de conclusão do produto

## Objectivo

O objectivo desta matriz é fechar o produto existente, não expandir continuamente o seu âmbito. Uma área só é considerada concluída quando a configuração necessária está disponível, o fluxo principal persiste dados reais no tenant correcto, existe feedback de carregamento/sucesso/erro, as permissões são aplicadas e há teste de regressão.

| Área | Fluxo principal a concluir | Configuração necessária | Critério de pronto |
|---|---|---|---|
| Empresas | Criar, configurar e activar | Representante, exercício e período | Empresa persistida, activação controlada e auditoria |
| Facturação | Criar rascunho e reservar número | Série activa, tipo documental, contraparte e regime IVA | Rascunho persistido, totais coerentes e feedback |
| Clientes/fornecedores | Criar e editar contraparte | Empresa activa e campos fiscais | Registo tenant-aware, validação e edição persistente |
| Produtos/serviços | Criar e editar catálogo | Empresa activa, unidade e imposto | Registo persistente e utilizável em documentos |
| Documentos | Importar, rever, exportar e gerar PDF | Ficheiro anonimizado, revisão comercial | Bloqueio de PII, revisão e ficheiro de preparação |
| Contabilidade | Lançar, consultar e reconciliar | Plano de contas e período aberto | Débitos/créditos equilibrados, auditoria e rastreabilidade |
| Fiscalidade | Consultar regras e preparar AGT | Normas locais e configuração interna | Evidência local sem declarar homologação |
| Stock | Registar movimentos e reconciliar | Produto, período e contas | Movimento persistido e reconciliação verificável |
| Tesouraria | Registar pagamentos/recebimentos | Conta de caixa/banco e período | Transacção persistida e reconciliação idempotente |
| Imobilizado | Criar activo e depreciar | Vida útil, conta e período | Depreciação auditada e reflexo contabilístico |
| Relatórios | Consultar mapas e reconciliações | Empresa e período | Valores derivados de dados persistidos, sem demos enganosas |
| Fecho | Validar e fechar/reabrir período | Checklist, pendências e permissões | Bloqueios explícitos e auditoria de reabertura |
| Auditoria | Consultar eventos e exportar | Perfil auditor/admin e empresa | Eventos filtráveis, tenant-aware e exportáveis |

## Regras de encerramento

Uma função existente não deve receber novas opções até que o seu caminho principal esteja operacional. Dados demonstrativos só podem ser usados como empty-state ou conteúdo de apoio claramente identificado; não podem substituir consultas persistentes nos módulos operacionais.

A integração AGT, credenciais, endpoint, assinatura oficial e homologação permanecem fora da conclusão interna. O software pode estar preparado tecnicamente, mas não pode declarar certificação ou enviar dados reais sem os elementos oficiais e autorização da equipa.

## Critério final

O produto será considerado fechado quando cada área acima passar a matriz de utilização, a suite completa, TypeScript, build de produção, verificação visual desktop/PWA e teste de isolamento em tenant descartável, sem alteração da Repair Lubatec.
