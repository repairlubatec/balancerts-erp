# Parecer oficial — Lei n.º 14/23, de 28 de Dezembro

**BALANCERTS.ERP · D1 — Fiscalidade angolana · Data de análise: 21 de Agosto de 2026**

## 1. Identificação da fonte

Foi analisado o PDF recebido `docs/normative-sources/lei-14-23-iva.pdf`, com 77 páginas. Os metadados identificam o *Diário da República*, I Série, n.º 246, de 28 de Dezembro de 2023. A primeira página apresenta a Lei n.º 14/23 na página 8519 e a segunda página identifica a Assembleia Nacional e o título **Lei de Alteração ao Código do Imposto sobre o Valor Acrescentado — Primeira Alteração/2023**.

O SHA-256 do PDF preservado é `d9fa7e618a32a134853e761126e7851c331f5620a0eee87be4ce7aae380545d6`. O texto pesquisável foi produzido por OCR em português e preservado em `docs/normative-sources/lei-14-23-iva-ocr.txt`, com OCR individual em `docs/normative-sources/iva-ocr/`.

> A fonte recebida é tratada como documento primário de trabalho porque corresponde ao Diário da República e foi fornecida pelo utilizador. A aplicação conserva o PDF e o hash como evidência; não considera a análise uma declaração de homologação ou parecer jurídico externo.

## 2. Vigência e objecto confirmados

A lei determina a alteração de múltiplos artigos do Código do IVA, revoga disposições identificadas no próprio diploma, adita artigos e determina a republicação integral do Código do IVA. A disposição final lida por OCR indica que a Lei de Revisão entra em vigor na data da sua publicação, isto é, 28 de Dezembro de 2023.

A vigência persistida no catálogo para as regras importadas é `2023-12-28`, sem data final. A data final permanece nula porque não foi identificado no PDF recebido um diploma posterior que substitua estas regras no âmbito desta importação. Qualquer alteração futura deverá criar nova versão e não reescrever o histórico.

## 3. Taxas do artigo 19.º

A leitura visual das páginas 8 e 9 do PDF confirma o artigo 19.º e a seguinte matriz:

| Código interno | Regra legal | Taxa | Âmbito | Estado no ERP |
|---|---|---:|---|---|
| `IVA-14-23-ART19-RATES` | Artigo 19.º, n.º 1, alínea a) | 14% | Taxa geral para importações, transmissões de bens e prestações de serviços | Persistida e verificada |
| `IVA-14-23-ART19-RATES` | Artigo 19.º, n.º 1, alínea b) | 7% | Regime simplificado | Persistida e verificada |
| `IVA-14-23-ART19-RATES` | Artigo 19.º, n.º 1, alínea c) | 7% | Hotelaria e restauração, sujeita às obrigações cumulativas do n.º 2 | Persistida e verificada |
| `IVA-14-23-ART19-RATES` | Artigo 19.º, n.º 1, alínea d) | 5% | Bens alimentares de amplo consumo e insumos agrícolas dos Anexos I e II | Persistida e verificada |
| `IVA-14-23-ART19-RATES` | Artigo 19.º, n.º 1, alínea e) | 1% | Regime tributário especial da Província de Cabinda, excepto os bens do Anexo III | Persistida e verificada |

A taxa de 7% para hotelaria e restauração não foi tratada como uma taxa universal: o artigo 19.º, n.º 2, exige cumulativamente as obrigações relativas à inscrição de imóveis, inscrição de veículos, facturação electrónica e entrega das declarações tributárias dos exercícios anteriores.

## 4. IVA cativo e anexos

A página 9 confirma a regra do artigo 21.º relativa à cativação de 50% do imposto contido nas facturas para as entidades nele indicadas, incluindo o Banco Nacional de Angola, bancos comerciais, seguradoras, resseguradoras e operadoras de telecomunicações com título global unificado. A regra foi registada separadamente da taxa, para impedir que retenção/cativação seja confundida com a taxa de liquidação.

Foram preservados no catálogo os seis anexos republicados, como referências de classificação e não como listas artificialmente completadas:

| Anexo | Matéria catalogada |
|---|---|
| I | Bens alimentares de amplo consumo tributados à taxa reduzida |
| II | Insumos agrícolas tributados à taxa reduzida |
| III | Mercadorias não abrangidas pela taxa especial para a Província de Cabinda |
| IV | Medicamentos e equipamentos médicos isentos de IVA |
| V | Produtos petrolíferos isentos de IVA |
| VI | Operações financeiras isentas, conforme a remissão do Código republicado |

As designações e listas dos anexos permanecem ligadas ao PDF e ao hash. A aplicação não cria classificações automáticas de produtos apenas a partir do nome comercial; uma operação deverá ter classificação fiscal, evidência e revisão quando o enquadramento depender de um item de anexo.

## 5. Alterações persistidas

Foram persistidas três regras globais em `normativeRules`, todas para a organização actual, sem empresa específica:

| Código | Verificação | Conteúdo |
|---|---|---|
| `IVA-14-23-ART19-RATES` | `EXTERNALLY_VERIFIED` | Taxas do artigo 19.º e respectivas condições |
| `IVA-14-23-ART21-CATIVE` | `EXTERNALLY_VERIFIED` | Cativação de 50% do artigo 21.º |
| `IVA-14-23-ANNEXES` | `EXTERNALLY_VERIFIED` | Referências dos Anexos I a VI |

As contas PGCA `4511` e `6131` da versão 1 foram actualizadas para as designações literais verificadas no Decreto n.º 82/01: **4511 — Caixa** e **6131 — Mercado nacional**. A conta 4511 já não usa “Caixa Kwanza” no nome normativo. A confirmação foi registada com auditoria, e não foram reclassificados lançamentos históricos.

A versão PGCA geral permanece em revisão porque a importação integral de todas as contas do diploma ainda não foi concluída. Por isso, esta etapa não deve ser interpretada como activação completa do plano nacional nem como autorização para criar regras contabilísticas não confirmadas.

## 6. Limites de segurança e conformidade

As regras IVA são versionadas por data de vigência, preservam o hash do documento e mantêm a fonte documental. Não são aplicadas retrospectivamente a documentos já emitidos, não alteram lançamentos históricos e não substituem a validação de um documento individual. A submissão AGT e a homologação permanecem fora do escopo desta importação.

## Referências

[1]: https://agt.minfin.gov.ao/PortalAGT/#!/iva/legislacao “Portal oficial da AGT — Legislação IVA”

[2]: https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/ “Lei n.º 14/23 — referência pública de consulta”

[3]: https://cnnca.minfin.gov.ao/legislacao/sector-empresarial “CNNCA/MinFin — Sector Empresarial”
