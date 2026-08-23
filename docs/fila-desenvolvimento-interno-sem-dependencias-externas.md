# BALANCERTS.ERP — Fila de desenvolvimento interno sem dependências externas

## Objectivo

Este documento define a fila activa de evolução do BALANCERTS.ERP enquanto AGT, restauro, assinatura, banca e aceitação externa permanecem fora da execução. A ausência dessas credenciais não bloqueia o desenvolvimento interno verificável.

## O que permanece activo

O motor contabilístico utiliza o catálogo PGCA activo quando este está disponível, exige correspondência normativa confirmada e preserva lançamentos históricos. A cobertura de Compras, Vendas, Stock, Tesouraria, Salários, Imobilizado e Relatórios é verificada pelo readiness operacional. O IVA mantém a política `CONFIRMED_ONLY`: somente regras activas podem calcular imposto.

O SAADI e o Balancerts IA recebem contexto PGCA apenas por leitura. O contexto inclui organização, empresa, versão, fonte, hash e contas confirmadas. Nenhuma destas consultas activa contas, publica lançamentos ou escreve no BALANCERTS.ERP.

## O que fica fora da fila activa

O destino MySQL/TiDB isolado, a URL de restauro, a máquina Windows limpa, o certificado de assinatura, as credenciais AGT, a documentação bancária e os testes de aceitação com a Repair Lubatec continuam pendentes. Não devem ser simulados, substituídos por valores fictícios ou executados contra a produção.

## Regra de continuidade

Enquanto os recursos externos não forem disponibilizados, a implementação deve limitar-se a código, testes, documentação e validações locais que não alterem a produção nem convertam dados pendentes em dados confirmados. Os bloqueios de segurança, auditoria e validação humana permanecem obrigatórios mesmo quando as integrações externas estão ocultas da vista operacional.

## Estado da última validação

A última suite global registou **121 ficheiros e 468 testes aprovados**, com TypeScript sem erros. O checkpoint de referência é `98510008`.

