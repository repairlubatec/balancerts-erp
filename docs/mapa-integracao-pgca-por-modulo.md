# Mapa de integração PGCA por módulo

**Sistema:** BALANCERTS.ERP  
**Âmbito:** estado interno verificável em 23 de Agosto de 2026.

| Módulo | Protecção interna existente | Estado de activação |
|---|---|---|
| Compras | Posting pode resolver AccountingRules por operação canónica ou alias; contas normativas confirmadas e contas operacionais mapeadas são exigidas | Bloqueado se faltar regra activa ou conta confirmada |
| Vendas | Mesmo mecanismo de resolução e validação; documentos com IVA exigem regra IVA activa quando aplicável | Bloqueado sem cobertura normativa aplicável |
| Stock | Operações persistidas e reconciliação com o razão; cobertura PGCA inclui STOCK | Bloqueado sem regra activa e mapeamento operacional |
| Tesouraria | Pagamentos e recebimentos usam a categoria canónica TESOURARIA para cobertura; posting mantém idempotência e auditoria | Bloqueado sem regra activa e período válido |
| Salários | O motor de salários já valida regras e estados; SALARIO/FOLHA são normalizados para SALARIOS na cobertura PGCA | Bloqueado sem regra activa confirmada |
| Imobilizado | Depreciação auditável ligada ao posting; DEPRECIACAO é normalizada para IMOBILIZADO | Bloqueado sem regra activa confirmada |
| IVA | Cadeia normativa temporal e política CONFIRMED_ONLY; apenas regras ACTIVE calculam imposto | Bloqueado quando regra ou mapeamento 34.5 não está activo |
| Relatórios | Relatórios persistentes reconciliam com razão, documentos, origem e auditoria | Não inventa dados; depende de movimentos efectivamente publicados |

## Regras transversais

O readiness de uma versão PGCA exige validação da versão, confirmação de todas as contas e fontes, existência de regras activas e cobertura das seis operações obrigatórias. O posting procura a forma introduzida pelo fluxo e a forma canónica normalizada, sem criar regras, contas ou movimentos automaticamente.

A activação externa continua separada da prontidão local. Homologação AGT, integração bancária, assinatura Windows, restauro verificável e aceitação Repair Lubatec exigem evidência fora do sandbox e permanecem pendentes. Nenhuma destas pendências é simulada ou marcada como concluída por testes locais.

## Conclusão

A integração interna do novo PGCA está protegida por validações server-side, isolamento por organização/empresa, auditoria e bloqueios de cobertura. O que falta para uma conclusão operacional externa não pode ser resolvido apenas por código: requer destinos, credenciais, certificados, ambientes de teste ou validação humana controlada.
