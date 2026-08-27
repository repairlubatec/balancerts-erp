# Dependência dos campos em relação às fontes documentais

**Data:** 27 de Agosto de 2026  
**Âmbito:** PGCA-82-01, camadas IVA e regras contabilísticas operacionais do BALANCERTS.ERP.

## 1. Esclarecimento central

Os documentos recebidos não desaparecem nem são ignorados. Eles desempenham funções diferentes no sistema. Um diploma pode confirmar a existência de uma conta ou regra de IVA, mas não fornece automaticamente todos os dados necessários para um lançamento de uma operação empresarial concreta.

O sistema separa quatro camadas:

| Camada | O que prova | Exemplo |
|---|---|---|
| **Fonte normativa** | Que diploma, artigo, versão e vigência suportam uma decisão | Decreto n.º 82/01; Lei n.º 14/23; Decreto Presidencial n.º 180/19 |
| **Estrutura PGCA** | Código, designação, hierarquia, nível, natureza e possibilidade de movimento | Conta confirmada, conta de grupo ou conta movimentável |
| **Regra operacional** | Como uma operação concreta transforma um documento em débito/crédito | Compra, venda ou pagamento |
| **Configuração da empresa** | Qual entidade, período, regime, série e dados factuais se aplicam | Empresa, exercício, período, regime IVA e série documental |

Um PDF pode ser suficiente para a primeira ou segunda camada, mas a terceira exige uma regra operacional completa e a quarta exige dados da empresa. Por isso, **carregar mais documentos não preenche automaticamente contas de contrapartida, condições factuais, período de vigência ou aprovação humana**.

## 2. Campos do plano PGCA

| Campo no sistema | Depende de | Documento/evidência necessária | Situação actual |
|---|---|---|---|
| `version.code` | Identidade da versão | Decreto n.º 82/01 e identificação interna `PGCA-82-01` | Preenchido |
| `version.name` | Designação oficial | Título do diploma | Preenchido |
| `version.effectiveFrom` / `effectiveTo` | Vigência temporal | Diploma e alterações posteriores | Estrutura existente; activação ainda não concluída |
| `account.code` | Código literal | Quadro oficial do PGCA | 792 confirmadas |
| `account.name` | Designação literal | Quadro oficial do PGCA | 792 confirmadas |
| `account.classCode` | Classe hierárquica | Estrutura do PGCA | Confirmado estruturalmente |
| `account.parentId` / `parentCode` | Hierarquia | Relação Classe → Conta → Subconta → analítica → movimentável | Validado por guard estrutural |
| `account.level` | Profundidade hierárquica | Organização apresentada no diploma | Validado por guard estrutural |
| `account.accountType` | Grupo ou movimentável | Estrutura e regra de lançamento do PGCA | Confirmado quando legível |
| `account.acceptsEntries` | Pode receber movimentos? | Natureza/estrutura da conta | Guard activo |
| `account.acceptsChildren` | Pode ter subcontas? | Hierarquia oficial | Guard activo |
| `account.sourceId` | Evidência de origem | Fonte PGCA confirmada | As 792 contas têm confirmação; 10 fontes PGCA confirmadas |
| `chartAccount` operacional | Espelho interno da conta | Conta PGCA confirmada e configuração da empresa | Deve existir para posting da empresa |

As contas IVA criadas por diplomas posteriores não devem substituir o plano canónico. Devem ser uma camada versionada associada à fonte que as criou, preservando o PGCA-82-01 como base.

## 3. Campos das regras contabilísticas

Estes são os campos que ainda impedem a activação produtiva quando não estão preenchidos e aprovados:

| Campo da regra | Depende de | O documento fornece sozinho? | O que falta para activar |
|---|---|---|---|
| `operation` | Operação empresarial normalizada | Parcialmente; os diplomas podem descrever operações, mas não todas as combinações internas | Escolher a operação entre Compras, Vendas, Stock, Tesouraria, Salários e Imobilizado |
| `debitAccountId` | Conta PGCA lançável a débito | Não automaticamente | Seleccionar uma conta confirmada e lançável para o evento concreto |
| `creditAccountId` | Conta PGCA lançável a crédito | Não automaticamente | Seleccionar a contrapartida confirmada e lançável |
| `ivaAccountId` | Conta IVA aplicável | Apenas quando o diploma/criação de conta e o caso fiscal o suportam | Confirmar conta IVA, regime, operação e condição de dedução/liquidação |
| `taxType` | Tipo de imposto | O diploma identifica o imposto | Ligar o tipo à regra concreta; não aplicar a taxa a toda a operação por defeito |
| `taxRate` | Taxa aplicável | Pode ser indicada no diploma, mas depende da vigência e condição | Confirmar taxa, regime, período, isenção/redução e elegibilidade |
| `sourceReference` / fonte da regra | Diploma/artigo/documento | Sim, se a fonte for legível e identificada | Registar a referência exacta na regra e manter a cadeia normativa |
| `effectiveFrom` / `effectiveTo` | Vigência da regra | Sim, quando o diploma fixa início/fim ou alteração | Impedir utilização fora da vigência |
| `accountNature` | Activo, passivo, capital próprio, gasto, rendimento ou mista | PGCA e esquema de movimentação | Confirmar natureza e sentido débito/crédito para a conta concreta |
| `documentType` | Documento que origina o lançamento | Diplomas podem definir documentos fiscais, não todo o fluxo interno | Ligar factura, recibo, folha salarial, guia ou movimento ao evento |
| `approvalStatus` / `approvedBy` | Controlo humano | Não é um campo legal; é controlo de governança | Revisão, confirmação literal e aprovação auditada |
| `postingStatus` | Estado de segurança | Não vem do PDF | Deve permanecer `DRAFT_ONLY` até todos os anteriores estarem completos |

O campo mais importante é a **contrapartida**. Um diploma pode confirmar que uma conta existe e qual é a sua natureza, mas não autoriza o sistema a escolher sozinho a conta de contrapartida de uma compra, venda, pagamento ou salário sem o evento, documento e contexto fiscal concretos.

## 4. Dependências por operação

| Operação | Campos que precisam de confirmação | Dependência documental | Dependência empresarial |
|---|---|---|---|
| **Compras** | fornecedor, documento, inventário/serviço, gasto ou activo, IVA suportado/dedutível, débito, crédito, pagamento | PGCA; camada IVA aplicável; documento fiscal | fornecedor, regime IVA, período, natureza do bem/serviço |
| **Vendas** | cliente, documento, rendimento, IVA liquidado, débito, crédito, recebimento | PGCA; código IVA e modelos aplicáveis | cliente, regime IVA, série, período, operação tributável/isenta |
| **Stock** | entrada/saída, armazém, quantidade, custo, conta de existências, variação, contrapartida | PGCA; regra de valorização e documentos internos | artigos, armazéns, método e inventário real |
| **Tesouraria** | conta de caixa/banco, pagamento/recebimento, origem, contrapartida, reconciliação | PGCA; documento de suporte | conta bancária, extracto, beneficiário, data e moeda |
| **Salários** | trabalhador, remuneração, retenções, encargos, líquido, contas de gasto/passivo | PGCA; legislação laboral/fiscal aplicável | contratos, trabalhadores, folha, período e retenções |
| **Imobilizado** | activo, aquisição, custo, vida útil, depreciação, alienação, contas de activo/gasto/acumulação | PGCA; regras documentadas de depreciação | ficha do activo, data, vida útil, valor residual e documento |

A matriz operacional partilhada fornece apenas modelos `DRAFT_ONLY`. Ela não contém contas concretas, taxas finais ou contrapartidas inferidas.

## 5. O que cada diploma recebido alimenta

| Fonte | Campos/decisões que pode suportar | Não preenche automaticamente |
|---|---|---|
| **Decreto n.º 82/01** | Código, designação, hierarquia, classes, natureza e estrutura base do PGC/PGCA | Regra completa de cada operação empresarial, dados da empresa e aprovação humana |
| **Lei n.º 7/19** | Camada histórica e regras IVA do período correspondente, quando aplicáveis | Aplicabilidade actual sem cadeia temporal e sem alteração posterior |
| **Lei n.º 17/19** | Alterações ao regime original do IVA | Conta/contrapartida concreta de cada operação |
| **Decreto Presidencial n.º 180/19** | Regulamento do IVA e contas IVA posteriores, incluindo a camada contabilística referenciada | Activação global do PGCA base ou taxa automática fora da vigência/condição |
| **Decreto Executivo n.º 134/19** | Modelos declarativos e campos/estrutura declarativa IVA | Posting contabilístico completo e credenciais AGT |
| **Lei n.º 14/23** | Código do IVA consolidado/alterado actualmente tratado como peça central da camada IVA | Escolha automática de contas, confirmação da empresa e homologação AGT |
| **II, IRT, IP e IS** | Tipos de imposto, regras e parâmetros quando fonte integral e vigência estão confirmadas | Regra contabilística universal sem operação e contexto, e tabela integral do IS quando esta não está confirmada |
| **OGE 2026** | Medidas anuais condicionadas, como taxas/reduções/isenções específicas | Substituição dos códigos tributários ou activação geral sem elegibilidade factual |

## 6. Porque `normativeSources` pode estar vazio

A base apresentou zero linhas em `normativeSources`, enquanto o catálogo principal existe em `server/normative.ts` e as dez fontes PGCA estão confirmadas em `pgcSources`. Isto significa que existem duas camadas diferentes de fonte no desenho actual:

1. o catálogo normativo versionado em código, usado pelos guards e pelo painel fiscal; e
2. as fontes ligadas directamente à versão PGCA e às contas, usadas para confirmação estrutural.

Isto não significa que os PDFs tenham sido perdidos. Significa que a rastreabilidade persistente geral ainda precisa de uma decisão: cada regra activada deve apontar para uma fonte persistida em `normativeSources`, ou o catálogo em código deve ser declarado formalmente imutável e as regras devem guardar o identificador da sua entrada normativa.

## 7. Conclusão prática

Os documentos já preenchem a **evidência de existência e confirmação da estrutura**. O que ainda falta é transformar essa evidência em regras operacionais completas, ligadas a eventos e contas concretas, com vigência, condição fiscal, aprovação humana e teste ponta a ponta.

Portanto, a próxima actividade correcta não é enviar simplesmente mais uma cópia do PGCA. É preencher, para cada uma das seis operações, os campos `operation`, `debitAccountId`, `creditAccountId`, `ivaAccountId` quando aplicável, `taxType`, `taxRate` quando juridicamente confirmado, fonte, vigência, documento de origem e aprovação. Só então o guard poderá permitir `VALIDATED` e, depois, `ACTIVE`.
