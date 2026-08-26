# Relatório de Conferência Visual — PGCA/IVA

**Projecto:** BALANCERTS.ERP  
**Data:** 26 de Agosto de 2026  
**Âmbito:** Decreto n.º 82/01 anexado e Lei n.º 14/23 anexada  
**Estado de segurança:** `FAIL-CLOSED`

## 1. Objectivo e método

Foi realizada uma conferência visual dirigida dos trechos legíveis dos dois PDFs primários anexados. O OCR foi usado exclusivamente para localizar páginas candidatas; a confirmação material foi feita sobre as páginas originais do PDF. Cada achado foi registado no log de pesquisa fiscal e ligado ao registo de fontes e à matriz de lacunas V3.2.

A conferência não transforma automaticamente uma página legível em autorização de activação global. A promoção de uma conta ou regra continua a exigir a cadeia de evidência prevista no ERP, incluindo fonte, página, hash, natureza, movimento e estado de aprovação aplicável.

## 2. Evidências confirmadas por lote

| Lote | Páginas revistas | Conteúdo confirmado | Estado seguro |
|---|---:|---|---|
| Activo/Tesouraria | 30–31, 36–39, 40–50, 74–75 | Critérios de reconhecimento e valorização; imobilizações; investimentos; existências; clientes; fornecedores; meios monetários; Caixa; depósitos; provisões de tesouraria; regras de movimento legíveis | Confirmado apenas para o escopo visual registado |
| Capital Próprio/Passivo | 50–52, 55–59, 69–73 | Capital e reservas; resultados transitados; passivos monetários; fornecedores; empréstimos; entidades participantes; pessoal; outros valores a pagar; provisões e contrapartidas | Confirmado apenas para o escopo visual registado |
| Resultados/IVA | 51–58, 63–67 | Classes 6–8; proveitos; custos; imposto sobre lucros; resultados; notas explicativas; valorização de existências; contratos de construção e reconhecimento de resultados | Confirmado apenas para o escopo visual registado |
| IVA republicado | Lei n.º 14/23, pp. 8–9, 24–25, 44–45 | Taxas e condições do artigo 19.º; efeitos materiais dos artigos 74.º–78.º; republicação; revogações; entrada em vigor | Confirmado apenas para as páginas revistas |

## 3. Distinção normativa essencial

O Decreto n.º 82/01 continua tratado como plano-base canónico. A conferência da sua classe 7 confirma a conta **75.3 — Impostos** e as subcontas visíveis do diploma-base, mas não autoriza atribuir-lhe as contas IVA posteriores identificadas no Decreto Presidencial n.º 180/19.

As contas **34.5 — IVA**, **34.6 — Certificado de Crédito Fiscal a Compensar**, **63.5 — IVA** e **75.3.1.2 — IVA** permanecem na camada normativa do DP 180/19. O PDF do DP 180/19 não faz parte dos anexos desta ronda e, por isso, essas contas não foram confirmadas visualmente nem promovidas.

A Lei n.º 14/23 foi confirmada nos trechos revistos como diploma de revisão e republicação do Código do IVA. A confirmação das taxas não elimina a necessidade de confrontar a cadeia histórica Lei n.º 7/19 → Lei n.º 17/19 → DP 180/19 → DE 134/19 → Lei n.º 14/23, nem os anexos e modelos declarativos correspondentes.

## 4. Resultado de qualidade

A suite completa de regressão executada após a actualização documental aprovou **153 ficheiros de teste e 610 testes**. Não foram alteradas contas confirmadas, não foram activadas regras `SOURCE_CANDIDATE` e não foi promovida a versão `PGCA-82-01` para `ACTIVE`.

> **Conclusão:** a evidência primária anexada melhorou substancialmente a cobertura documental e permitiu confirmar trechos específicos de nomenclatura, hierarquia, natureza, movimento, taxas e vigência. Ainda não constitui base suficiente para activar integralmente o plano de contas ou o motor IVA para todas as empresas.

## 5. Bloqueios remanescentes

A activação global continua bloqueada pela falta de confirmação equivalente para todas as contas movimentáveis, pela necessidade de revisão completa das regras de movimento e pela ausência, nesta ronda, do PDF primário legível do DP 180/19 e dos seus anexos contabilísticos. O sistema deve continuar a apresentar estes itens como pendentes, sem fallbacks demonstrativos e sem inferir natureza ou regra a partir da hierarquia do código.

## Referências

[1]: /home/ubuntu/upload/Decreton.º82-01de16deNovembro_AprovaoPlanoGeraldeContabilidade.pdf "Decreto n.º 82/01 anexado"
[2]: /home/ubuntu/upload/Lein1423mini.pdf "Lei n.º 14/23 anexada"
[3]: docs/fiscal-legal-source-registry-v3.2.md "Registo de fontes legais V3.2"
[4]: docs/fiscal-legal-gap-matrix-v3.2.md "Matriz de lacunas V3.2"
