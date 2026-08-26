# BALANCERTS.ERP — PGCA, impostos e SAF-T AO

## Slide 1 — Título
**PGCA, impostos e SAF-T AO**

Análise dos ficheiros `SAFTAO1.01_01(1).xsd` e `SAF-T-AO-master.zip`, passos para activar o PGCA da Repair Lubatec e separação das camadas de validação.

**Estado da análise:** preparação técnica local; não constitui homologação AGT nem parecer fiscal.

## Slide 2 — A mensagem vermelha do PGCA
**O que o bloqueio significa**

- A empresa e o período actuais não têm uma versão PGCA operacional associada no estado `ACTIVA`.
- O sistema adopta comportamento fail-closed: contas, movimentos e regras pendentes não desbloqueiam lançamentos novos.
- “Isolamento activo” é uma confirmação diferente: protege o contexto empresa/período, mas não activa o plano.
- O XSD SAF-T e o ZIP não activam o PGCA; são recursos de exportação, validação e referência.

**Mensagem-chave:** o bloqueio é de governação contabilística e estado do plano, não de ausência do XSD.

## Slide 3 — Como activar o PGCA da Repair Lubatec
**Sequência controlada**

1. Fixar empresa, organização e período `09/2023`; confirmar que não se altera produção nem documentos emitidos.
2. Seleccionar a versão PGCA-82-01 correcta e conferir código, designação, hierarquia, natureza e lançabilidade.
3. Confirmar as regras de movimento: activo, passivo, capital próprio, rendimentos, gastos e contas mistas.
4. Associar cada regra à fonte primária, artigo/página quando disponível, vigência, hash e responsável pela revisão.
5. Executar checklist, testes de partidas dobradas, reconciliação e segregação de funções.
6. Registar aprovação autorizada, mudar `PENDENTE/PREPARADA` para `ACTIVA` e auditar a transição.
7. Revalidar o contexto e só então permitir novos lançamentos.

## Slide 4 — O que é o XSD SAF-T AO
**Validação estrutural do XML**

- Namespace: `urn:OECD:StandardAuditFile-Tax:AO_1.01_01`; versão `1.01_01`.
- Estrutura: `Header`, `MasterFiles`, `GeneralLedgerEntries` e `SourceDocuments`.
- Valida tipos, elementos obrigatórios, unicidade e referências entre contas, clientes, fornecedores, produtos, transacções e documentos.
- Define uma `TaxTable` com tipo, código, descrição e percentagem/valor, mas não decide a taxa vigente nem activa o PGCA.
- O XSD separado e o XSD dentro do ZIP têm o mesmo SHA-256: `e9a938e1f47ac3d84ffbb26d0d95b827fc769a065c9d20533d0262c12f8c2631`.

## Slide 5 — O que o ZIP acrescenta
**Pacote de referência, não certificado**

- README técnico, XSD, exemplo XML de `PurchaseInvoices`, exemplo XLSX e `TaxExemptions.json/XML`.
- PDFs incluídos: Decretos 312/18, 317/20, 71/25 e Decreto Executivo 683/25.
- A tabela de isenções é uma referência auxiliar datada de 07/01/2021, versão 2.0.0; deve ser confrontada com a legislação vigente antes de activar códigos.
- O próprio XSD indica estado documental `Development`; o pacote não contém credenciais, endpoint de homologação, certificado ou aprovação AGT.
- Não inclui o plano PGCA-82/01 nem substitui a confirmação humana das contas e regras contabilísticas.

## Slide 6 — Matriz segura de impostos e isenções
| Camada | Estado seguro no ERP | Regra de utilização |
|---|---|---|
| IVA | Cálculo técnico integrado; homologação pendente quando aplicável | Usar apenas regras versionadas, vigência válida e evidência associada |
| II, IRT, IAC | Identificados; não configurados como cálculo activo | Não calcular nem assumir taxa sem diploma/regra confirmada |
| IS, IP, SISA, IEC, IVM | Códigos persistentes disponíveis; não configurados | Permitir identificação/revisão, mas bloquear liquidação automática |
| Isenções SAF-T | Códigos de referência disponíveis no pacote | Validar código, motivo, artigo, vigência e operação antes de activar |

**Princípio:** persistir um código não significa activar uma obrigação fiscal.

## Slide 7 — Quatro camadas de validação
**Não confundir resultados**

1. **Estrutural:** XML conforme ao XSD SAF-T AO.
2. **Dados e reconciliação:** NIF, contas, saldos, clientes, fornecedores, produtos, documentos e lançamentos completos e coerentes.
3. **Fiscal/contabilística:** regra aplicável, vigência, taxa, isenção, PGCA, natureza, movimento e rastreabilidade normativa.
4. **Externa:** homologação, credenciais, endpoint, certificado, submissão e aceitação pela AGT.

Um XML pode passar a primeira camada e falhar nas seguintes. Um plano PGCA pode estar tecnicamente importado e continuar bloqueado por falta de validação/aprovação.

## Slide 8 — Conclusão e próximos passos
**O que está resolvido e o que falta**

- Os anexos são necessários para fortalecer a validação e a referência SAF-T; não são a causa directa do bloqueio PGCA.
- O BALANCERTS.ERP já separa preparação local, regras fiscais activas, evidência e homologação externa.
- Para desbloquear o PGCA: confirmar as contas/regras legíveis, anexar evidência primária, executar a checklist, aprovar a versão e activar no contexto Repair Lubatec/09-2023.
- Para SAF-T real: eliminar valores de reserva, preencher dados reais, validar XML contra o XSD e concluir a etapa AGT.
- **Decisão segura:** não activar taxas, isenções, PGCA ou homologação por inferência.

## Referências

[1] XSD SAF-T AO anexado pelo utilizador: `SAFTAO1.01_01(1).xsd`, versão `1.01_01`, namespace `urn:OECD:StandardAuditFile-Tax:AO_1.01_01`.

[2] Pacote técnico anexado pelo utilizador: `SAF-T-AO-master.zip`, incluindo XSD, exemplos, isenções e PDFs legislativos.

[3] [AGT — Legislação Fiscal](https://www.agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal).

[4] [AGT — Comunicado sobre SAF-T de contabilidade e Decreto Presidencial n.º 71/25](https://portaldocontribuinte.minfin.gov.ao/noticia?id=985578).

[5] [AGT — Regularização de softwares de facturação](https://portaldocontribuinte.minfin.gov.ao/noticia?id=985537).

[6] [Repositório de referência SAF-T AO](https://github.com/assoft-portugal/SAF-T-AO/).
