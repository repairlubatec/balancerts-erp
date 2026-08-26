# Relatório V2 — Continuidade e fecho controlado do Motor Fiscal

**Projecto:** BALANCERTS.ERP  
**Data:** 26 de Agosto de 2026  
**Autor:** Manus AI  
**Base de referência:** checkpoint `b9b858b7`, revisão integral do Motor Fiscal e inventário oficial documentado em `docs/fiscal-inventory-research-2026-08-25.md`.

## A. Preservado

A implementação existente do IVA foi preservada. Mantêm-se o cálculo versionado por vigência, os regimes Geral, Simplificado e Exclusão, a validação fail-closed, a integração com facturação e compras, a proveniência persistida em `documentTaxes`, o registo fiscal documental, a reconciliação, a auditoria e os testes existentes. Não foram reescritas regras activas, nem alterados documentos emitidos ou dados persistidos.

Também foram preservadas as tabelas e os contratos dos restantes módulos. A extensão dos códigos de persistência foi aditiva e não removeu nem sobrescreveu configurações anteriores.

## B. Implementado nesta execução

Foi introduzido no catálogo de cobertura um estado formal V2 separado do estado técnico de cobertura. Foi também criada uma guarda pura de activação que exige fundamento legal, vigência activa, estado VALIDADO, testes aprovados, ausência de bloqueios críticos e homologação concluída quando aplicável; a guarda não altera nem activa automaticamente qualquer imposto. O IVA fica identificado como `HOMOLOGAÇÃO PENDENTE`, porque existe implementação local mas ainda falta submissão/homologação externa e cobertura integral das obrigações AGT. II, IRT, IAC, IS, IP, SISA, IEC e IVM ficam em `NÃO CONFIGURADO`.

O catálogo passou a exibir esses estados no posto Fiscalidade. O painel distingue **Cobertura técnica** de **Estado V2**, para impedir que uma tabela, enum, interface ou código parcial seja confundido com configuração fiscal activa. O relatório fiscal e a interface continuam a mostrar a proveniência normativa quando existe e a ausência de evidência quando não existe. O resultado runtime passou a preservar opcionalmente artigo, página e hash da evidência, além de diploma/referência, versão e vigência, sem preencher campos ausentes por inferência.

Foram mantidos os códigos persistentes `IS`, `IP`, `SISA` e `IVM`, com rótulos portugueses, mas sem cálculo automático, taxa, base, isenção, dedução, prazo ou obrigação presumida.

## C. Preparado tecnicamente, mas não configuração fiscal

A estrutura comum permite associar tipo de imposto, base, taxa/regra, direcção, vigência, evidência, referência jurídica, versão, hash de cálculo e estado. O catálogo read-only e o painel Fiscalidade permitem revisão faseada. O servidor rejeita o cálculo quando não há regra activa, vigente, compatível e suficientemente identificada.

Esta preparação não configura II, IRT, IAC, IS, IP, SISA, IEC ou IVM. Também não converte `RETENCAO` numa regra material: retenções continuam a ser infraestrutura transversal que exige imposto de origem, substituto tributário, momento, certificado, entrega e reconciliação.

## D. Impostos sem configuração jurídica

| Imposto/área | Estado V2 | Situação técnica actual | Motivo de não activação |
|---|---|---|---|
| IVA | HOMOLOGAÇÃO PENDENTE | Motor versionado e integrado parcialmente | Falta homologação/submissão externa e cobertura completa de obrigações/excepções |
| Imposto Industrial (II) | NÃO CONFIGURADO | Código de persistência disponível | Faltam regras versionadas de matéria colectável, regimes, provisório, isenções, declaração e prazos |
| IRT | NÃO CONFIGURADO | Código de persistência e infraestrutura de RH existente | Faltam Grupos A/B/C, remunerações, deduções, retenções e declarações |
| IAC | NÃO CONFIGURADO | Código de persistência disponível | Faltam Secções A/B, categorias, incidência, isenções, retenção e liquidação |
| Imposto de Selo (IS) | NÃO CONFIGURADO | Código de persistência e rótulo disponíveis | Falta a tabela de actos/operações, valor/taxa, sujeito passivo e declaração aplicáveis |
| Imposto Predial (IP) | NÃO CONFIGURADO | Código de persistência e rótulo disponíveis | Falta cadastro/avaliação de imóveis, detenção, renda, transmissão e calendário próprio |
| SISA | NÃO CONFIGURADO | Código de persistência e rótulo disponíveis | Faltam transmissão gratuita, beneficiário, grau de relação, UCF, escalões e liquidação |
| IEC | NÃO CONFIGURADO | Código de persistência disponível | Falta legislação/tabela confirmada e catálogo de produtos, incidência, taxas e declaração |
| IVM | NÃO CONFIGURADO | Código de persistência e rótulo disponíveis | Faltam cadastro de veículos, liquidação, selo, regras por veículo e calendário |
| Retenções transversais | NÃO CONFIGURADO como motor autónomo | `WITHHELD` e `RETENCAO` persistem | Não é um imposto autónomo; requer motor associado ao imposto material de origem |

A enumeração institucional utilizada nesta matriz é a publicada pelo Portal do Contribuinte e inclui II, IP, IRT, IAC, IS, SISA, IVA, IEC e IVM [1]. A listagem da AGT é dinâmica e foi tratada como índice institucional, não como fundamento suficiente para taxas ou fórmulas [2].

## E. Evidência necessária

Para cada imposto não configurado é necessário o diploma oficial aplicável, a versão consolidada ou alteração vigente, o artigo/alínea ou tabela relevante, a data de início e fim de vigência, a regra material extraída, a incidência, base, taxa ou valor, isenções, deduções, limites, prazos, obrigação declarativa, regra de retenção quando aplicável e tratamento contabilístico. A evidência deve ser legível e associada a uma versão auditável.

As páginas institucionais consultadas ajudam a delimitar o âmbito, mas não substituem a leitura dos diplomas primários. A página do IEC não forneceu conteúdo utilizável na consulta registada, e as páginas de detalhe de IVA/IVM também não foram suficientes para acrescentar regras novas [3] [4].

## F. Testes

A validação desta execução concluiu com **152 ficheiros de teste e 603 testes aprovados**; a última execução global ocorreu depois da guarda de activação e a prova específica de proveniência foi ampliada para artigo, página e hash. A suite inclui testes do Motor Fiscal, catálogo integral, integração da Home/Fiscalidade, registo fiscal, rótulos portugueses e não regressão dos módulos existentes. O TypeScript terminou sem erros e o build de produção foi concluído.

Os testes confirmam que o IVA continua a calcular apenas com regra activa e compatível, que regras pendentes não são usadas, que todos os nove impostos institucionais estão catalogados e que o estado V2 não activa cálculos materiais para impostos sem configuração.

## G. Bloqueios

Os bloqueios críticos são a ausência de evidência primária suficiente para parametrizar os impostos não IVA, a necessidade de confirmação humana de páginas legíveis quando os documentos estão incompletos ou degradados, e a dependência de homologação/credenciais AGT para a transição externa do IVA. IEC e IVM exigem ainda fontes de detalhe confirmadas. Nenhum destes bloqueios foi contornado por inferência.

## H. Estado final

| Imposto/área | Estado final V2 |
|---|---|
| IVA | HOMOLOGAÇÃO PENDENTE |
| II | NÃO CONFIGURADO |
| IRT | NÃO CONFIGURADO |
| IAC | NÃO CONFIGURADO |
| IS | NÃO CONFIGURADO |
| IP | NÃO CONFIGURADO |
| SISA | NÃO CONFIGURADO |
| IEC | NÃO CONFIGURADO |
| IVM | NÃO CONFIGURADO |
| Retenções transversais | NÃO CONFIGURADO como motor autónomo |

Nenhum imposto novo foi colocado em `ATIVO`. A sequência obrigatória permanece: evidência legal → configuração → testes → validação → homologação, quando aplicável → activação controlada.

## I. Versão e reversibilidade

A versão anterior de referência é o checkpoint `b9b858b7`. A versão de trabalho V2 inclui os estados formais de cobertura e a guarda de activação controlada, preservando a configuração anterior. A alteração desta execução é uma extensão V2 do catálogo e da apresentação dos estados, sem substituição da lógica IVA. A versão é reversível através do histórico de checkpoints; a reversão elimina apenas a extensão de estado/apresentação desta execução e mantém a configuração anterior do IVA e os dados persistidos conforme o checkpoint escolhido.

Não houve `DROP`, eliminação de dados, sobrescrita irreversível de regra ou alteração retroactiva de documento emitido. A migration dos códigos de persistência foi aditiva e os testes confirmaram a integridade dos contratos.

## Referências

[1]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas — Portal do Contribuinte, Impostos e taxas.  
[2]: https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal — Portal da AGT, Legislação Fiscal.  
[3]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-especial-de-consumo — Portal do Contribuinte, Imposto Especial de Consumo.  
[4]: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/impostos-sobre-veiculos-motorizados — Portal do Contribuinte, Impostos sobre Veículos Motorizados.
