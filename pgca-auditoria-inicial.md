# Auditoria inicial do PGCA no BALANCERTS.ERP

## Estado identificado

A tabela actual `chartAccounts` contém apenas `companyId`, `code`, `name`, `parentCode`, `postable`, `validFrom` e `validTo`. Isto permite uma estrutura mínima por empresa, mas não representa um PGC oficial versionado e normativo. Faltam, entre outros, organização/tenant explícito, versão do plano, classe, nível hierárquico calculado ou validado, natureza, tipo de saldo, tipo de conta, estado normativo, vigência legal, fonte jurídica, observações, indicadores de IVA/fiscal/balanço/resultados e separação entre conta oficial e conta analítica da empresa.

Os lançamentos guardam `accountId` em `journalLines`, enquanto `chartAccounts` não possui referência física declarada a uma versão normativa nem uma chave explícita de integridade com a empresa. O código permite regras e lançamentos por `accountId`, e há procedimentos de actualização de contas que trabalham no cadastro actual. A migração deve preservar estes IDs e movimentos históricos; não é seguro substituir ou apagar a tabela.

O ERP já possui estruturas úteis que podem ser reutilizadas: `normativeRules` para regras normativas, `fiscalTaxRecords` e entidades de IVA para integração fiscal, centros de custo, lançamentos, saldos iniciais, regularizações e regras de folha. Contudo, o documento do PGCA exige um modelo específico e auditável para o plano, incluindo migração, validação e regras contabilísticas configuráveis.

## Limitações actuais que bloqueiam a activação imediata

A base actual não comprova que a lista de contas actualmente carregada seja a lista oficial angolana. Não deve ser utilizada como fonte para criar contas novas. A implementação pode criar a arquitectura, auditoria e estados de validação, mas o catálogo oficial só deve ser activado depois de confirmar a fonte normativa e resolver conflitos.

Também não existe ainda evidência de um mapa completo entre todas as contas antigas e a nova versão. Portanto, a primeira fase segura é de auditoria e preparação; a activação de novas contas e qualquer reclassificação de saldos devem ficar bloqueadas até haver catálogo confirmado, backup, mapa aprovado e testes.

## Base normativa localizada

O Decreto n.º 82/01 aprova o Plano Geral de Contabilidade, estabelece o âmbito obrigatório para sociedades comerciais e empresas públicas, prevê exclusões para sectores com planos específicos e atribui competência para alteração da nomenclatura, códigos, conteúdo, criação ou eliminação de contas por decreto executivo. Fontes consultadas:

1. [AngoLEX — Decreto n.º 82/01, Plano Geral de Contabilidade](https://angolex.com/paginas/decreto-presidencial/plano-geral-de-contabilidade-angolano-82a-01a.html)
2. [Lex Angola — Decreto n.º 82/01 de 16 de Novembro](https://lex.ao/docs/conselho-de-ministros/2001/decreto-n-o-82-01-de-16-de-novembro/)
3. [AngoLEX — Decreto Presidencial n.º 180/19, Regulamento do Código do IVA](https://angolex.com/paginas/decreto-presidencial/regulamento-do-codigo-do-imposto-sobre-o-valor-acrescentado.html)

O Regulamento do IVA consultado contém uma secção específica sobre criação, subcontas e desdobramento de contas de IVA no PGC. A existência de referências a contas 34.5 e outras contas fiscais no documento do utilizador não deve ser tratada como autorização para semear contas automaticamente: cada código e subconta deve ser confirmado na fonte legal aplicável e registado com diploma, artigo, data de vigência e contas afectadas.

## Decisão técnica para a implementação

A implementação deve seguir esta ordem: criar metamodelo versionado e fonte normativa; importar apenas catálogo confirmado; auditar o plano legado; gerar classificação e mapa de migração; criar regras contabilísticas configuráveis; adaptar integrações; executar validações; fazer backup; migrar de forma não destrutiva; testar com Repair Lubatec; e só então activar a versão.

Até à conclusão desses gates, o novo catálogo deve permanecer em estado de preparação/revisão e não deve substituir automaticamente o plano usado em lançamentos. Nenhum saldo histórico deve ser alterado por simples mudança de código.
