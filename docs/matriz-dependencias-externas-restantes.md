# Matriz operacional das dependências externas restantes

**Sistema:** BALANCERTS.ERP  
**Estado:** preparação local; sem activação prematura.

| Área | Estado actual | Bloqueio real | Entrada necessária | Protecção já existente |
|---|---|---|---|---|
| Restauro | Preparado localmente | Não existe destino isolado confirmado | `RESTORE_DATABASE_URL` real, isolada e com permissões limitadas | Não é usado o destino de produção; o restauro só deve ocorrer após validação do destino |
| Windows | Não validado fora do sandbox | Falta uma máquina Windows limpa | Teste EXE/MSI, actualização, desinstalação e evidência de instalação | Não se declara compatibilidade final sem teste físico |
| Assinatura Windows | Não concluída | Falta certificado de assinatura de código da entidade distribuidora | Certificado e cadeia de confiança adequados ao fabricante/distribuidor | Nenhum certificado é inventado ou incorporado no repositório |
| AGT | Preparação local | Homologação e credenciais oficiais ainda não integradas | Número/resultado de cadastro, endpoint, códigos e documentação de homologação | `externalSubmissionAllowed=false` até homologação real |
| Banca | Preparação arquitectural | Faltam documentação, ambiente e credenciais bancárias | API/ficheiros oficiais, ambiente de testes e permissões do banco | Não são feitas chamadas externas nem credenciais fictícias |
| Aceitação | Suite técnica aprovada | Falta validação operacional pela Repair Lubatec | Utilizadores autorizados, dados anonimizados e cenários assinados | Testes locais não são apresentados como aceitação do cliente |

## Ordem segura

A sequência recomendada é primeiro disponibilizar o destino isolado de restauro e validar a cópia sem tocar na produção. Depois deve ser feita a validação numa máquina Windows limpa, incluindo assinatura, instalação e actualização. Em paralelo, a entidade deve concluir a homologação AGT e fornecer apenas os dados oficiais necessários. A integração bancária deve começar num ambiente de testes do banco, nunca directamente em produção. Por fim, a Repair Lubatec deve executar os testes de aceitação com dados controlados.

## Regra de não activação

Nenhuma pendência externa deve ser marcada como concluída com base apenas em configuração local, mock, URL de exemplo ou teste unitário. O ERP deve permanecer operacional em modo local e seguro enquanto cada dependência aguarda a sua evidência externa correspondente.

> O cadastro da chave pública AGT foi tratado em paralelo e não é repetido nesta matriz.
