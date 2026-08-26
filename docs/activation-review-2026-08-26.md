# Revisão de activação normativa — 26 de Agosto de 2026

## Objecto

Foi solicitada a promoção dos quatro PDFs fiscais recebidos para proveniência institucional e a activação das taxas, regras de cálculo, posting fiscal, emissão oficial e versões PGCA/IVA/II/IRT/IP/IS.

## Decisão

A confirmação expressa do utilizador foi registada como **declaração humana de proveniência institucional** dos PDFs de Imposto Industrial, IRT, Imposto Predial e Imposto do Selo. Esta declaração não foi convertida automaticamente em estado operacional `ACTIVE`, porque a activação do motor exige também elegibilidade estrutural, cobertura de regras, vigência fechada e aprovação auditável das entidades normativas relacionadas.

A activação foi **rejeitada em 26-08-2026** pelo modelo fail-closed. Nenhum dado fiscal produtivo foi alterado.

## Bloqueadores verificáveis

| Verificação | Resultado observado | Consequência |
|---|---:|---|
| Versão PGCA-82-01 | `UNDER_REVIEW` | Não pode avançar directamente para `ACTIVE`. |
| Contas PGCA da versão 1 | 792 | O guard exige validação integral. |
| Contas PGCA confirmadas | 27 | Permanecem 765 em `NEEDS_NORMATIVE_VALIDATION`. |
| Regras contabilísticas da versão 1 | 0 | Não existe cobertura suficiente para posting automático. |
| Fontes PGCA | 6 confirmadas | Não substitui a confirmação das 765 contas. |
| Camadas normativas PGCA | 5 confirmadas | Não substitui regras de movimentação e cobertura operacional. |

## Validação técnica

Os guards de `server/pgc-workflow.ts` foram verificados: a validação exige a versão em `UNDER_REVIEW`, todas as contas e fontes confirmadas e cobertura de regras; a activação exige a versão em `VALIDATED` e readiness sem bloqueadores. Os testes específicos do workflow PGCA terminaram com **3 ficheiros e 19 testes aprovados**. Os testes de cálculo fiscal, posting e emissão terminaram com **4 ficheiros e 24 testes aprovados**.

## Estado final

As taxas, regras de cálculo, posting fiscal, emissão oficial e versões PGCA/IVA/II/IRT/IP/IS permanecem inalterados e não activos. Não foram executadas submissões à AGT nem operações fiscais irreversíveis. A próxima acção elegível é a confirmação humana literal das 765 contas pendentes e a configuração/aprovação das regras contabilísticas correspondentes.

> Esta nota é um registo técnico de governação do software. Não substitui a validação de um contabilista certificado nem uma confirmação jurídica externa.
