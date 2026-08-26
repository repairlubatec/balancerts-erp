# Relatório formal de escopo PGCA e estado de implementação

**Sistema:** BALANCERTS.ERP  
**Empresa de teste:** Repair Lubatec  
**Data:** 26 de Agosto de 2026  
**Objectivo:** distinguir, sem ambiguidade, limitações do software, estado do conteúdo normativo e configurações específicas da empresa de teste.

> **Conclusão executiva:** as pendências identificadas não significam que a Repair Lubatec esteja contabilisticamente “errada”. A Repair Lubatec é um tenant de teste usado para verificar o comportamento do ERP. A pendência principal é de **cobertura normativa confirmada no produto**: o pacote técnico contém 776 registos, mas apenas 27 contas têm confirmação visual equivalente persistida. Como o BALANCERTS.ERP foi desenhado para funcionar para todas as empresas, esta lacuna deve ser resolvida no catálogo normativo global antes de permitir que qualquer empresa active a cobertura completa sem evidência.

## 1. Arquitectura normativa adoptada

O plano de contas canónico do sistema é o **PGC/PGCA aprovado pelo Decreto n.º 82/01**, e não um ficheiro informal denominado “PGCA actualizado com IVA”. Os diplomas posteriores são representados como camadas normativas relacionadas, com fonte, tipo, vigência, estado e ligação à versão-base. Esta decisão evita misturar o plano geral de 2001 com alterações fiscais e modelos declarativos posteriores.

| Camada | Documento | Função no ERP | Âmbito |
|---|---|---|---|
| Plano-base | Decreto n.º 82/01 | Estrutura canónica do PGC/PGCA | Global do produto |
| Código IVA | Lei n.º 7/19 | Código base do IVA | Fiscal, aplicável conforme regime e vigência |
| Alteração IVA | Lei n.º 17/19 | Alteração ao Código do IVA | Fiscal, versionada |
| Contas IVA | Decreto Presidencial n.º 180/19 | Contas e regras contabilísticas específicas do IVA dentro do PGC | Contabilístico-fiscal, relacionado com o PGCA-base |
| Modelos declarativos | Decreto Executivo n.º 134/19 | Declarações, anexos, mapas e formulários | Declarativo/operacional |
| Consolidação posterior | Lei n.º 14/23 | Alteração e republicação do Código do IVA | Fiscal posterior; não substitui o PGC-base |

A interface e o backend passaram a reflectir esta separação. A tabela `pgcNormativeLayers` liga cada camada à versão-base e à fonte do diploma, conservando `effectiveFrom`, `effectiveTo`, tipo, estado e hash de evidência. A consulta é protegida por organização e versão; uma empresa não pode ler nem alterar dados de outra empresa.

## 2. O que é implementação global do software

A seguinte cobertura pertence ao produto e fica disponível para todas as empresas cadastradas, independentemente da existência da Repair Lubatec:

| Capacidade global | Estado | Interpretação correcta |
|---|---|---|
| PGCA canónico como versão separada | Implementado | O Decreto n.º 82/01 não é apagado nem substituído por um plano “com IVA”. |
| Camadas normativas por diploma | Implementado | IVA, contas IVA e modelos declarativos têm fonte e vigência próprias. |
| Proveniência e auditoria | Implementado | A aplicação conserva diploma, fonte, estado e contexto de revisão. |
| Fail-closed | Implementado | Sem conta, natureza, regra ou fonte confirmada, a operação é bloqueada. |
| Validação hierárquica | Implementado | Classe, conta, subconta, analítica e movimentável são níveis distintos; o sistema não trata prefixos como duplicação. |
| Revisão visual e confirmação humana | Implementado | O software suporta revisão, mas não pode substituir a leitura humana de uma fonte ilegível. |
| Assistente PGCA | Implementado | Mostra versão canónica, camadas posteriores, contas, fontes, regras e bloqueios. |
| Exportação da pendência | Implementado | O catálogo pendente pode ser analisado e exportado para revisão. |

Portanto, o software já possui a **arquitectura necessária para servir todas as empresas**. O que ainda não está concluído é o preenchimento integral do catálogo com confirmações normativas legíveis e regras de movimentação verificadas.

## 3. O que é uma lacuna global de conteúdo normativo

A comparação auditada encontrou 776 registos no pacote técnico, 27 contas confirmadas visualmente no ERP e 765 códigos sem confirmação equivalente persistida. A diferença numérica não deve ser interpretada como 765 erros da Repair Lubatec nem como 765 códigos repetidos. É uma lacuna de **cobertura de confirmação normativa do catálogo do produto**.

| Indicador | Resultado | Escopo |
|---|---:|---|
| Registos no pacote técnico | 776 | Catálogo técnico global candidato |
| Contas confirmadas visualmente | 27 | Estado actual do catálogo de teste/revisão |
| Códigos sem confirmação equivalente | 765 | Cobertura normativa global ainda pendente |
| Níveis existentes nos pendentes | 1 a 5 | Hierarquia, não duplicação automática |
| Grupos mais volumosos | 34, 35, 66, 68, 75, 76 e 78 | Apenas concentração de códigos, não conclusão sobre natureza |

A classificação correcta é: **deficiência de completude normativa do catálogo actualmente validado**, não defeito cadastral da Repair Lubatec. Uma nova empresa cadastrada deve ver o mesmo catálogo canónico e as mesmas camadas normativas confirmadas; não deve herdar uma conta não validada só porque outra empresa foi criada como teste.

## 4. O que pertence especificamente à Repair Lubatec

A Repair Lubatec é apenas um ambiente de teste. Os seguintes elementos são tenant/company-specific:

| Elemento | Estado | Significado |
|---|---|---|
| Organização e empresa | Configurado | Identidade da empresa de teste no ambiente actual. |
| Versão seleccionada | PGCA-82-01 em revisão | A empresa usa a versão canónica, mas a activação permanece bloqueada. |
| 27 contas confirmadas | Persistidas no contexto de teste | Não significam que o catálogo global só deva conter essas 27 contas. |
| Período, regime IVA e documentos | Dados da empresa | Não determinam a validade geral do PGCA. |
| Decisões de revisão | Tenant-aware | Uma decisão de revisão é auditada com actor, organização, versão e correlação. |

Assim, criar outra empresa não exige repetir a investigação jurídica desde o princípio quando o catálogo global estiver validado. Exige apenas associar a empresa à versão normativa global activa e configurar os dados próprios: regime fiscal, exercício, período, séries, contas analíticas internas e permissões. Enquanto a versão global não estiver validada, todas as empresas devem receber o mesmo bloqueio seguro para operações que dependam de contas não confirmadas.

## 5. Evidência necessária para fechar a lacuna global

A evidência não deve ser solicitada novamente por cada empresa. Deve ser recolhida uma vez para o catálogo normativo global, armazenada com hash e reutilizada por todas as empresas.

| Evidência global | Deve demonstrar | Resultado esperado |
|---|---|---|
| Quadro oficial do Decreto n.º 82/01 | Código, designação e pai imediato | Conta identificada literalmente na hierarquia |
| Regra de natureza | Devedora, credora ou mista | Natureza confirmada sem inferência pela classe |
| Regra de movimentação | Quando debita e quando credita | Regra operacional auditável |
| Lançabilidade | Se a conta é agregadora, analítica ou movimentável | Bloqueio de lançamentos em contas-pai |
| Evidência IVA do Decreto Presidencial n.º 180/19 | Código, designação e função das contas 34.5, 34.5.1, 34.5.2, 34.6, 63.5 e 75.3.1.2 | Camada IVA relacionada ao PGCA-82-01 |
| Metadados | Diploma, página, ficheiro original, hash e revisor | Proveniência e auditoria reproduzíveis |

O OCR e os índices de página podem ajudar a localizar uma linha, mas não são suficientes para mudar o estado para `CONFIRMED`. A confirmação exige imagem/PDF legível e contexto suficiente para distinguir conta-pai, subconta, analítica e conta movimentável.

## 6. O que não deve ser feito

Não se deve activar o plano completo apenas porque o pacote contém 776 nomes. Não se deve atribuir a natureza de uma conta só por ela pertencer a activo, passivo, capital próprio, proveitos ou custos. Não se deve transformar a regra geral “activo aumenta a débito e passivo/capital próprio aumenta a crédito” numa regra específica para todas as subcontas. Também não se deve criar uma segunda versão denominada “PGCA com IVA”, porque isso quebra a cadeia histórica e pode provocar divergência entre empresas.

## 7. Decisão formal do estado actual

A decisão técnica recomendada é a seguinte:

> **PGCA-82-01 / Decreto n.º 82/01 permanece como versão canónica global.** As Leis n.º 7/19 e 17/19, o Decreto Presidencial n.º 180/19, o Decreto Executivo n.º 134/19 e a Lei n.º 14/23 permanecem como fontes/camadas posteriores versionadas. Nenhuma empresa, incluindo a Repair Lubatec, deve activar a cobertura completa do PGCA enquanto as naturezas, regras de movimentação, lançabilidade e evidências primárias das contas pendentes não estiverem confirmadas.

Este estado não impede o desenvolvimento do software. Significa que o ERP está preparado para todas as empresas, mas protege todas elas contra lançamentos baseados em conteúdo normativo ainda não comprovado. Quando o catálogo global for confirmado, a mesma versão e as mesmas regras poderão ser disponibilizadas de forma consistente a todas as empresas cadastradas.

## 8. Referências

[1]: https://lex.ao/docs/presidente-da-republica/2001/decreto-n-o-82-01-de-16-de-novembro/ "Decreto n.º 82/01 — Plano Geral de Contabilidade"

[2]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-7-19-de-24-de-abril/ "Lei n.º 7/19 — Código do IVA"

[3]: https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-17-19-de-13-de-agosto/ "Lei n.º 17/19 — alteração ao Código do IVA"

[4]: https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/ "Decreto Presidencial n.º 180/19 — Regulamento do Código do IVA"

[5]: https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/ "Decreto Executivo n.º 134/19 — modelos declarativos do IVA"

[6]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ "Lei n.º 14/23 — alteração e republicação do Código do IVA"

## Anexo técnico

A lista integral dos 765 códigos pendentes, com designação, pai, nível e páginas OCR candidatas, está em `docs/pgca-pending-concrete-detail-2026-08-26.md` e `docs/pgca-pending-concrete-detail-2026-08-26.csv`. O ficheiro de comparação bruto é `docs/pgca-code-diff-2026-08-26.json`.
