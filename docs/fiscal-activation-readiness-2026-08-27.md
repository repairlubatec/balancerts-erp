# Auditoria de prontidão para activação fiscal

**Projecto:** BALANCERTS.ERP  
**Data:** 27 de Agosto de 2026  
**Escopo:** PGCA, IVA, Imposto Industrial (II), IRT, Imposto Predial (IP), Imposto do Selo (IS), cálculo, posting e emissão oficial.

> **Nota de responsabilidade:** sou uma IA, não um profissional fiscal. Qualquer activação com efeitos de entrega, cálculo ou declaração deve ser revista por um contabilista certificado antes de utilização consequente.

## Conclusão executiva

A auditoria automática não encontrou condições para activar globalmente as versões nem os efeitos fiscais consequentes. Nesta continuação, os quatro PDFs submetidos foram também ligados no catálogo de código aos códigos `II-LAW-19-14`, `IRT-LAW-28-20`, `IP-LAW-20-20` e `IS-DLP-3-14`, com escopo limitado ao texto confirmado e sem inferir alterações posteriores. A confirmação do utilizador de que os quatro PDFs são documentos oficiais foi registada como confirmação humana de proveniência para fins de revisão, mas não elimina os requisitos técnicos: regras de movimentação, vigência consolidada, tabelas/modelos, transição da versão PGCA e cobertura das regras contabilísticas.

A decisão segura é manter o motor em **fail-closed**. O sistema pode continuar a permitir consulta, preparação, simulação e revisão auditável, mas deve rejeitar cálculo legal produtivo, posting fiscal e emissão oficial enquanto os bloqueadores abaixo não forem encerrados.

## Estado observado no sistema

| Componente | Estado observado | Consequência |
|---|---|---|
| PGCA-82-01 | `UNDER_REVIEW`; sem `activatedAt` | Não pode ser `ACTIVE` |
| Contas PGCA | 792 `CONFIRMED` de 792 registadas | Confirmação documental consolidada; não substitui as regras operacionais |
| Regras contabilísticas | 0 regras activas na versão persistente | Não existe cobertura para posting automático; permanecem exigidas as operações COMPRAS, VENDAS, STOCK, TESOURARIA, SALARIOS e IMOBILIZADO |
| Fontes PGCA/IVA/fiscais registadas | 10 de 10 fontes `CONFIRMED`, incluindo PGCA, cinco peças IVA e os quatro PDFs II/IRT/IP/IS | Podem sustentar revisão/preparação no escopo registado; não provam por si só todas as alterações posteriores |
| Versão activa | Nenhuma promoção automática executada | O bloqueio mantém-se intencionalmente |
| Migração de parâmetros IVA/IRT | Campos `taxType`, `calculationBase` e `taxRate` disponíveis; taxa não é pré-preenchida | Permite configurar rascunhos com fonte e vigência, sem inventar taxas |

## Resultado desta continuação

A base persistente actualmente consultada contém **792 contas**, todas com estado `CONFIRMED`, **10 fontes**, todas com estado `CONFIRMED`, e **0 regras contabilísticas activas** para `PGCA-82-01`, que permanece em `UNDER_REVIEW`. O catálogo de evidências passou a reconhecer explicitamente os quatro códigos primários II/IRT/IP/IS acima indicados. Não foi feita qualquer mutação de estado produtivo, cálculo fiscal, posting, emissão oficial ou alteração destrutiva da base de dados.

## O que falta para cada promoção

| Promoção pretendida | Pré-requisitos ainda em falta | Resultado seguro actual |
|---|---|---|
| **PGCA-82-01 para `VALIDATED`/`ACTIVE`** | Definir, validar e aprovar regras contabilísticas para as seis operações exigidas; fechar eventuais bloqueadores estruturais; registar aprovação auditável e executar a transição ordenada | Bloqueado |
| **IVA operacional** | Fechar a cadeia Lei 7/19 → Lei 17/19 → DP 180/19 → DE 134/19 → Lei 14/23; mapear alterações/revogações e vigência; validar anexos/modelos; confirmar as contas IVA posteriores no escopo do ERP | Preparação/revisão apenas |
| **II** | Ligar Lei 19/14, Lei 26/20 e Lei 27/22 ao regime actual; validar taxas, artigo 73.º, reintegrações, provisões, preços de transferência, modelos e vigência | Bloqueado para cálculo produtivo |
| **IRT** | Validar Lei 18/14 e Lei 28/20, tabelas por grupo, deduções, isenções, retenções, modelos e vigência actual | Bloqueado para cálculo salarial legal |
| **IP** | Validar Lei 20/20, DP 191/21, tabelas, bases, isenções, modelos e alterações posteriores | Bloqueado para liquidação |
| **IS** | Validar DLP 3/14, tabela anexa actualizada, alterações por OGE, incidência, modelos e procedimentos | Bloqueado para cálculo |
| **Posting fiscal** | Versão PGCA activa, contas lançáveis confirmadas, regra activa e fonte/vigência válidas para cada operação; validações de período e duplicação | Rejeitado pelo guard |
| **Emissão oficial** | DP 71/25 e materiais AGT actuais, certificação/integração aplicável, modelos e canal de submissão validados, SAF-T semântico além do XSD estrutural | Rejeitado/condicionado |

## Distinção importante sobre os quatro PDFs

A instrução do utilizador foi incorporada como confirmação humana de que os quatro PDFs enviados — II, IRT, IP e IS — são fontes primárias institucionais. Essa confirmação permite corrigir a classificação documental de proveniência **no registo de revisão**, desde que cada ficheiro seja ligado ao diploma exacto, hash, páginas e artigos relevantes.

Ela não autoriza, por si só, a activação global. Um PDF pode provar o texto de um diploma e ainda não fechar alterações posteriores, vigência corrente, tabelas anexas, modelos declarativos, contas PGCA relacionadas, regras de movimentação ou requisitos de emissão. O motor deve tratar cada imposto e cada regra no respectivo escopo, sem usar a confirmação de um documento para inferir conteúdo dos demais.

## Ordem segura de encerramento

1. Fechar a confirmação literal das 765 contas e respectivos movimentos.
2. Criar e validar as regras contabilísticas por operação, com fonte, vigência, natureza e contas confirmadas.
3. Fechar as cadeias normativas e tabelas/modelos de IVA, II, IRT, IP e IS.
4. Executar a transição auditada `UNDER_REVIEW → VALIDATED → ACTIVE` apenas quando o readiness não tiver bloqueadores.
5. Testar cálculo e posting em ambiente de simulação, depois testar emissão e SAF-T com validação estrutural e semântica.
6. Só depois habilitar efeitos produtivos para utilizadores autorizados, com auditoria append-only e possibilidade de revogação controlada.

Nenhuma taxa foi inventada ou activada por esta auditoria. A classificação documental e a activação normativa continuam separadas para preservar a integridade do ERP. A suite validada nesta continuação ficou em **154 ficheiros / 619 testes aprovados**, com TypeScript e build de produção aprovados; o aviso de chunks frontend superiores a 500 kB é não bloqueante e foi registado separadamente.
