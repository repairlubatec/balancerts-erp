# Auditoria de índices e integridade referencial

**Projecto:** BALANCERTS.ERP  
**Proprietário:** Repair Lubatec  
**Data da verificação:** 20 de Agosto de 2026  
**Modo:** somente leitura

## Resultado

A base de dados actual foi consultada através de `information_schema` para inventariar chaves estrangeiras, índices e a cobertura das colunas referenciadas. Foram encontradas **121 relações de chave estrangeira** persistidas e 58 tabelas no esquema actual.

A verificação específica das colunas de chave estrangeira que não fossem a primeira coluna de qualquer índice não devolveu registos. Isto significa que, no estado actual, não foi identificada uma lacuna de indexação nas colunas de chave estrangeira persistidas. A conclusão é limitada à cobertura estrutural observada; não substitui uma medição de desempenho com carga real.

Não foram executadas migrações, `CREATE INDEX`, `ALTER TABLE`, eliminações ou actualizações de dados. A correcção contabilística anterior permanece validada separadamente com zero referências órfãs.

## Interpretação operacional

A integridade relacional efectiva está melhor protegida do que uma análise baseada apenas em relações Drizzle, porque existem chaves estrangeiras persistidas na base. As consultas tenant-aware e os índices existentes devem continuar a ser acompanhados por testes de autorização e por testes de carga antes de uma distribuição empresarial ampla.

A auditoria não encontrou uma alteração interna segura e necessária para executar nesta ronda. Criar índices adicionais sem planos de consulta, volume real e janela de manutenção poderia aumentar o custo de escrita sem benefício demonstrado.

## Pendências que permanecem

A validação de restauro continua dependente de uma base isolada real, porque a ligação gerida actual não tem privilégios para criar outra base ou utilizador. A autenticação SMTP Gmail continua a devolver erro 535. A homologação AGT, a ligação bancária, os instaladores Windows em máquina limpa e a integração SAADI continuam fora desta auditoria.

> Esta auditoria confirma a estrutura observada no momento da consulta; não constitui certificação AGT, garantia de desempenho ou aprovação contabilística externa.
