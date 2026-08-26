# Relatório de pesquisa de PDFs legais necessários — BALANCERTS.ERP

**Data da pesquisa:** 26 de Agosto de 2026.  
**Método:** consulta read-only no My Browser e pesquisa em índices públicos.  
**Regra de segurança:** nenhum diploma foi considerado fonte primária confirmada apenas por aparecer num índice ou num repositório jurídico. A confirmação material exige o PDF integral, a identificação da publicação no Diário da República e hash do ficheiro.

## 1. Resultado executivo

Foram confirmados os índices oficiais do **Portal do Contribuinte/MINFIN**, da **AGT** e da **Imprensa Nacional de Angola**. O Portal do Contribuinte disponibiliza páginas operacionais por imposto e a AGT disponibiliza um índice de legislação fiscal. A Imprensa Nacional disponibiliza a pesquisa de publicações oficiais. Contudo, nesta sessão os portais oficiais não expuseram de forma fiável os hrefs dos PDFs individuais: ao abrir um item do índice do Portal do Contribuinte, o navegador foi redireccionado para a página de contactos da AGT.

Assim, há duas opções seguras: o utilizador pode descarregar os PDFs através dos índices oficiais e anexá-los aqui; ou pode enviar os PDFs já existentes. Depois disso, o ERP pode calcular hash, extrair texto, verificar a publicação e manter cada diploma como fonte normativa versionada. Não recomendo usar Scribd, Academia, Docsity ou Lex.AO como única fonte de prova; esses repositórios podem ajudar a localizar/conferir, mas não substituem o Diário da República ou a publicação institucional.

## 2. Pacote mínimo obrigatório para PGCA e IVA

| Prioridade | Documento | Função no ERP | Fonte/URL de localização | Estado |
|---:|---|---|---|---|
| 1 | Decreto n.º 82/01, de 16 de Novembro — Plano Geral de Contabilidade | Plano de contas canónico, estrutura, classes, contas, natureza e regras de movimentação | [CNNCA — Sector Empresarial](https://cnnca.minfin.gov.ao/legislacao/sector-empresarial); [Imprensa Nacional — Publicações Oficiais](https://www.imprensanacional.gov.ao/index.php?id=105&serie=1) | Índice oficial confirmado; PDF integral a anexar/obter |
| 2 | Lei n.º 7/19, de 24 de Abril — Código do IVA | Diploma-base do IVA, incidência, regimes, dedução, obrigações e entrada em vigor | [Portal do Contribuinte — Legislação](https://portaldocontribuinte.minfin.gov.ao/legislacao); [Lex.AO — página de localização](https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-7-19-de-24-de-abril/) | Conteúdo e publicação conferidos em página secundária; PDF primário pendente |
| 3 | Lei n.º 17/19, de 13 de Agosto — alteração ao Código do IVA | Alterações de 2019 à Lei n.º 7/19 e regras transitórias | [Lex.AO — página de localização](https://lex.ao/docs/assembleia-nacional/2019/lei-n-o-17-19-de-13-de-agosto/); [Imprensa Nacional](https://www.imprensanacional.gov.ao/index.php?id=105&serie=1) | Publicação e conteúdo conferidos em página secundária; PDF primário pendente |
| 4 | Decreto Presidencial n.º 180/19, de 24 de Maio — Regulamento do Código do IVA | Contas 34.5 e subcontas, 34.6, 63.5, 75.3.1.2, regras de movimentação e reembolsos | [Lex.AO — página de localização](https://lex.ao/docs/presidente-da-republica/2019/decreto-presidencial-n-o-180-19-de-24-de-maio/); [AGT — legislação fiscal](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal) | Texto contabilístico conferido; PDF primário pendente |
| 5 | Decreto Executivo n.º 134/19, de 10 de Junho — modelos declarativos do IVA | Modelos de início/alteração/cessação, declaração periódica, anexos, regime transitório, restituição e mapas | [Lex.AO — página de localização](https://lex.ao/docs/ministerio-das-financas/2019/decreto-executivo-n-o-134-19-de-10-de-junho/); [AGT — legislação fiscal](https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal) | Texto, relação normativa e publicação conferidos; PDF primário pendente |
| 6 | Lei n.º 14/23, de 28 de Dezembro — alteração e republicação do Código do IVA | Versão posterior republicada do Código do IVA, alterações de artigos, novos artigos e vigência actual a confirmar | [Lex.AO — página de localização](https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/); [Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/legislacao) | Conteúdo e publicação conferidos em página secundária; PDF primário pendente |

## 3. Pacote fiscal complementar para o Motor Fiscal

O Motor Fiscal já contém estados fail-closed para impostos sem regra confirmada. Para completar a cobertura legal, devem ser reunidos os PDFs integrais e alterações actualmente vigentes dos seguintes conjuntos: **Código do Imposto Industrial e Lei n.º 26/20**, incluindo regime geral, simplificado, taxas e liquidação provisória; **Código do IRT e tabelas/alterações vigentes**, para grupos A, B e C, retenções e não sujeições; **Código do Imposto de Selo e tabela**, incluindo alterações; **IAC**, **IEC**, **Imposto Predial**, **SISA/Imposto sobre Sucessões e Doações** e **IVM**, cada um com o código legal, alterações, regulamentos, tabelas e modelos declarativos aplicáveis.

A lista oficial do Portal do Contribuinte inclui páginas de IAC, IEC, IVA, SISA, IP, IS, II e IRT. Estas páginas são úteis para orientação operacional e localização, mas não devem ser usadas sozinhas para activar taxas ou regras materiais.

| Área | Página oficial de orientação |
|---|---|
| Índice de impostos | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas |
| Imposto Industrial | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial |
| IRT | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho |
| IVA | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado |
| IAC | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-aplicacao-de-capitais |
| IEC | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-especial-consumos |
| Imposto de Selo | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-de-selo |
| Imposto Predial | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-predial-urbano |
| SISA/Sucessões e Doações | https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-sucessoes-e-doacoes |

## 4. Facturação, SAF-T e conformidade técnica

Para a facturação e exportação SAF-T, o pacote deve incluir o **Decreto Presidencial n.º 71/25, de 20 de Março — Regime Jurídico das Facturas e Documentos Equivalentes**, o **Decreto Executivo n.º 74/19 — Regras de Validação de Sistemas**, a **Rectificação n.º 10/19**, os manuais técnicos e layouts SAF-T AO publicados pela AGT, e a versão oficial do XSD SAF-T AO que será usada no processo de exportação. A página oficial da AGT consultada lista o Decreto Presidencial n.º 71/25, o Decreto Executivo n.º 74/19 e a Rectificação n.º 10/19, mas não expôs nesta sessão os links directos dos PDFs.

| Documento técnico/legal | URL oficial de localização | Estado |
|---|---|---|
| Regime Jurídico das Facturas — DP 71/25 | https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2436 | Listado oficialmente; PDF a obter |
| Regras de validação — DE 74/19 e Rectificação 10/19 | https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal#collapse2436 | Listado oficialmente; PDF a obter |
| Legislação fiscal AGT | https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal | Índice oficial confirmado |
| SAF-T/XSD e manuais | https://agt.minfin.gov.ao/PortalAGT/#!/legislacao/fiscal | A localizar na categoria técnica/manuais; não assumir versão sem hash |
| Calendário fiscal 2026 | https://portaldocontribuinte.minfin.gov.ao/pdfs/CALENDARIO_FISCAL_2026.pdf | PDF oficial localizado; orientação temporal, não fonte de taxa |

## 5. O que o utilizador deve fazer

A opção mais segura é descarregar, a partir dos índices oficiais, os seis documentos do pacote PGCA/IVA da tabela 2 e os documentos de facturação/SAF-T da tabela 4, e anexá-los aqui. Devem ser anexados os PDFs integrais, não capturas parciais nem apenas páginas Lex.AO. Se algum PDF não puder ser descarregado, o utilizador pode enviar o link do Diário da República ou anexar o ficheiro que já possui.

Depois de receber os PDFs, o processo será: registar nome oficial, entidade, data e publicação; calcular SHA-256; extrair texto e páginas; comparar diplomas que alteram ou republicam outros; classificar cada artigo por fonte, vigência e matéria; ligar contas IVA ao Decreto Presidencial n.º 180/19; e só então propor alterações ao corpus do ERP. A ausência de um PDF não impedirá o funcionamento geral do software, mas manterá a regra correspondente em estado `PENDING_PRIMARY_EVIDENCE` e bloqueará activações materiais por segurança.

## 6. Conclusão

**Não é correcto substituir o PGCA-82-01 por um PDF informal chamado “PGCA actualizado com IVA”.** O pacote jurídico deve manter o Decreto n.º 82/01 como plano canónico e relacionar diplomas posteriores por camada, vigência e proveniência. Nesta pesquisa foram confirmados links institucionais de localização e referências de publicação, mas os PDFs primários dos diplomas centrais ainda devem ser anexados ou obtidos directamente da Imprensa Nacional/Diário da República para fechar a prova documental.
