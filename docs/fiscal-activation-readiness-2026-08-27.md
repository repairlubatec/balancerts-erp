# Auditoria de prontidão para activação fiscal

**Projecto:** BALANCERTS.ERP  
**Data:** 27 de Agosto de 2026  
**Escopo:** PGCA, IVA, Imposto Industrial (II), IRT, Imposto Predial (IP), Imposto do Selo (IS), cálculo, posting e emissão oficial.

> **Nota de responsabilidade:** sou uma IA, não um profissional fiscal. Qualquer activação com efeitos de entrega, cálculo ou declaração deve ser revista por um contabilista certificado antes de utilização consequente.

## Conclusão executiva

A auditoria automática não encontrou condições para activar globalmente as versões nem os efeitos fiscais consequentes. A confirmação do utilizador de que os quatro PDFs são documentos oficiais foi registada como confirmação humana de proveniência para fins de revisão, mas não elimina os restantes requisitos técnicos: cobertura integral das contas, regras de movimentação, vigência consolidada, tabelas/modelos, transição da versão PGCA e cobertura das regras contabilísticas.

A decisão segura é manter o motor em **fail-closed**. O sistema pode continuar a permitir consulta, preparação, simulação e revisão auditável, mas deve rejeitar cálculo legal produtivo, posting fiscal e emissão oficial enquanto os bloqueadores abaixo não forem encerrados.

## Estado observado no sistema

| Componente | Estado observado | Consequência |
|---|---|---|
| PGCA-82-01 | `UNDER_REVIEW`; sem `activatedAt` | Não pode ser `ACTIVE` |
| Contas PGCA | 27 `CONFIRMED`; 765 `NEEDS_NORMATIVE_VALIDATION` | Faltam 765 confirmações literais |
| Regras contabilísticas | Nenhuma regra activa na versão auditada | Não existe cobertura para posting automático |
| Fontes PGCA/IVA registadas | Registos com `CONFIRMED` para Decreto 82/01, Lei 7/19, Lei 17/19, DP 180/19, DE 134/19 e Lei 14/23 | Podem sustentar revisão/preparação no escopo registado |
| Versão activa | Nenhuma promoção automática executada | O bloqueio mantém-se intencionalmente |
| Migração de parâmetros IVA/IRT | Campos `taxType`, `calculationBase` e `taxRate` disponíveis; taxa não é pré-preenchida | Permite configurar rascunhos com fonte e vigência |

## O que falta para cada promoção

| Promoção pretendida | Pré-requisitos ainda em falta | Resultado seguro actual |
|---|---|---|
| **PGCA-82-01 para `VALIDATED`/`ACTIVE`** | Confirmar as 765 contas: código, designação literal, pai, nível, natureza, regra débito/crédito e lançabilidade; fechar todos os bloqueadores estruturais; cobrir regras contabilísticas; registar aprovação auditável | Bloqueado |
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

Nenhuma taxa foi inventada ou activada por esta auditoria. A classificação documental e a activação normativa continuam separadas para preservar a integridade do ERP.
