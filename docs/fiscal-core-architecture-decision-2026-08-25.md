# Decisão de arquitectura — Fiscal Core

**Data:** 25 de Agosto de 2026  
**Âmbito:** extensão controlada do BALANCERTS.ERP conforme o documento Motor Fiscal.

## Decisão

O BALANCERTS.ERP adoptará um **Fiscal Core lógico comum** sobre as estruturas fiscais já existentes. Não será criada uma segunda arquitectura isolada nem serão reconstruídos os módulos comercial, contabilístico, tesouraria, RH, stock ou autenticação.

A implementação existente de IVA permanece a primeira implementação concreta do núcleo. As tabelas `ivaNormativeRules`, `ivaAccountMappings`, `normativeSources`, `normativeSourceRelations`, `fiscalTaxRecords` e os serviços `server/fiscal.ts`, `server/normative.ts` e `server/tax-compliance.ts` serão reutilizados e evoluídos. A generalização deverá ser aditiva e preservar os dados e o histórico actuais.

## Camadas

| Camada | Responsabilidade | Estado |
|---|---|---|
| Contexto fiscal | Organização, empresa, contribuinte, regime, data da operação e período | Existente e tenant-aware |
| Fontes normativas | Diploma, artigo, vigência, hash, página, estado de confirmação e relações | Existente; confirmação humana ainda necessária |
| Registo de regras | Código, tipo fiscal, regime, taxa, parâmetros, vigência, evidência e estado | IVA existente; generalização controlada |
| Classificação de operação | Documento, compra, venda, serviço, devolução, regularização e outras operações validadas | Parcial; ampliar por evidência |
| Cálculo | Base, taxa, imposto, dedução, isenção, retenção e avisos | IVA parcial; não activar campos sem regra |
| Integração | Facturação, compras, contabilidade, tesouraria e relatórios | Parcial por módulo |
| Auditoria | Actor, regra, versão, fonte, cálculo, alterações e correlação | Infraestrutura existente; enriquecer resultado fiscal |
| Obrigações | Calendário, registo e estado de cumprimento | Local e parcial; AGT externa permanece futura |

## Contrato lógico do resultado fiscal

O resultado de qualquer cálculo deverá ser determinístico e conter, quando aplicável, `taxClassification`, `taxType`, `taxBase`, `rate`, `taxAmount`, `deduction`, `exemption`, `withholding`, `ruleId`, `ruleVersion`, `legalReference`, `warnings` e `validationErrors`. A ausência de fonte ou regra activa deve produzir estado de validação, nunca uma taxa presumida.

## Regras de evolução

Uma nova regra fiscal é criada como nova versão quando muda o diploma, artigo, vigência, condição, taxa, base ou tratamento contabilístico. A versão anterior não é apagada e continua disponível para auditoria, reprocessamento e exercícios anteriores. Regras com fonte não confirmada ficam `PENDING` ou `NÃO CONFIGURADA / REQUER VALIDAÇÃO` e não podem ser usadas para posting ou declaração.

A autorização é mantida no backend através das procedures existentes. O frontend apenas apresenta estados e resultados; não activa regras, não altera vigências e não contorna isolamento por organização ou empresa.

## Fora do escopo de activação nesta fase

Imposto Industrial, IRT, Retenções na Fonte, Imposto Predial, IAC, Imposto de Selo, IEC, IVM e outros impostos permanecem não configurados. A integração AGT permanece externa e futura. Esta decisão não constitui homologação jurídica nem substitui confirmação visual das fontes oficiais.

## Critério de aceitação arquitectural

A arquitectura será aceite quando o IVA utilizar um contrato fiscal comum sem duplicação, mantiver compatibilidade com as tabelas e endpoints existentes, conservar histórico e vigências, devolver referências jurídicas explícitas, impedir regras não confirmadas e passar testes de isolamento, RBAC, determinismo e reconciliação contabilística.
