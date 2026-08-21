# BALANCERTS.ERP — Plano de validação externa

Este documento separa as validações que não podem ser executadas no sandbox das funcionalidades já validadas no código.

## 1. Restauro não destrutivo

É necessário fornecer ou provisionar uma base MySQL/TiDB isolada, sem acesso de escrita à produção, e configurar `RESTORE_DATABASE_URL` exclusivamente no ambiente de teste. O procedimento deve criar o destino, restaurar o backup, executar verificações de contagem, integridade referencial e leitura dos módulos, e guardar evidência de auditoria. Não se deve usar uma URL inventada nem credenciais de produção.

## 2. Windows e instaladores

Numa máquina Windows limpa, instalar o EXE/MSI, iniciar o shell, actualizar a aplicação e remover a versão anterior apenas depois de confirmar a instalação. Recolher versões, mensagens do sistema, logs e comportamento de actualização. A assinatura de código e o certificado de distribuição devem ser verificados fora do sandbox pelo proprietário do certificado.

## 3. AGT e banca

A homologação AGT requer endpoint oficial, credenciais de teste, certificado/chave e documentação vigente. A integração bancária requer banco suportado, ambiente de teste, credenciais e formato/protocolo autorizado. Até esses elementos existirem, o código deve permanecer em preparação, sem enviar documentos ou movimentações reais.

## 4. Aceitação Repair Lubatec

Executar com dados reais anonimizados ou controlados os ciclos Empresas, Exercício, Contabilidade, Comercial, Tesouraria, Compras, Stock, RH, Auditoria, Arquivo, SAADI e Balancerts IA. Registar resultado, utilizador, empresa, período, evidência e eventuais divergências.

## Estado

O código-fonte, testes, interface, integração semântica somente de leitura e modo gratuito/offline já foram validados no checkpoint `b7c6cb62`. Este documento não contém credenciais nem autoriza operações externas.
