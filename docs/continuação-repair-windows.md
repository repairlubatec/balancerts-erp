# Continuação — ciclo Repair Lubatec e distribuição Windows

## Ciclo documental

Foram formalizados os critérios do ciclo de rascunho, validação, emissão, contabilização e anulação da Repair Lubatec. A validação executada foi não destrutiva: confirmou contratos, transições, bloqueios, auditoria, isolamento tenant-aware e feedback através de 37 testes focados, sem inserir dados fiscais novos na empresa real.

## Configuração operacional

Os fluxos de séries, contas, períodos, clientes, produtos e feedback estão ligados às procedures persistentes existentes. A empresa activa continua a ser Repair Lubatec, com contexto AOA e regime de exclusão. Nenhuma credencial, endpoint ou comunicação AGT foi adicionada.

## Distribuição Windows

O `electron-builder.yml` contém destinos NSIS/EXE e MSI x64, e o workflow manual usa runner Windows. O smoke test Electron foi executado com sucesso no Linux usando uma URL HTTPS de preview, validando build, preparação desktop e empacotamento de directório. O erro inicial por ausência de `BALANCERTS_DESKTOP_URL` é uma protecção intencional; o pacote final exige uma URL HTTPS de produção.

## Limites

O smoke test não produz EXE/MSI no Linux. A distribuição Windows final exige execução do workflow num runner Windows, URL HTTPS estável e, para distribuição comercial, certificados de assinatura configurados.
