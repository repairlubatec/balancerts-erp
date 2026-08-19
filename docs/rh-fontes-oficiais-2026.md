# Base normativa inicial do módulo RH

## Fontes consultadas

1. Lei n.º 12/23, Lei Geral do Trabalho, publicada no Diário da República e disponibilizada pelo MAPTSS: https://www.maptss.gov.ao/wp-content/uploads/2024/06/Lei-Geral-do-Trabalho-2023.pdf
2. Portal do Contribuinte da AGT, Imposto Sobre Rendimentos do Trabalho: https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho

## Requisitos funcionais extraídos

A Lei Geral do Trabalho deve ser tratada como fonte normativa versionada. O modelo de colaborador/contrato deve conservar tipo de vínculo, datas de início e termo, função, remuneração, período experimental quando aplicável, horário/regime e motivo de cessação, sem apagar versões históricas.

A página oficial da AGT informa que o IRT incide sobre rendimentos de trabalho por conta própria e por conta de outrem, incluindo ordenados, vencimentos, salários, honorários, avenças, gratificações, subsídios, prémios, comissões e outras remunerações acessórias. O processamento deve separar componentes remuneratórias, incidência fiscal, exclusões, retenção e evidência da regra aplicada.

A AGT divide o IRT nos Grupos A, B e C. Para o módulo RH de trabalhadores dependentes, o caso principal é o Grupo A; titulares de órgãos sociais também são abrangidos. O sistema não deve codificar uma taxa única fixa: deve armazenar tabelas e regras com vigência, versão e fonte oficial.

A página consultada lista como não sujeitos, entre outros, contribuições para a Segurança Social, abono de família dentro do limite legal indicado e subsídios diários de alimentação e transporte dentro dos limites indicados na fonte. Estes valores devem ser parametrizáveis por vigência, com arredondamento, limites e fonte, e nunca gravados como lógica imutável.

## Limites de implementação

O módulo será preparado para cálculo local, mapa de salários, retenções e contribuições, mas não declarará certificação, homologação AGT ou validação jurídica automática. Alterações legislativas, tabelas de IRT, contribuições do INSS e obrigações declarativas deverão entrar como versões normativas aprováveis, com revisão humana antes do processamento oficial.
