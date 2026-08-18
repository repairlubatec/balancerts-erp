# Distribuição desktop do BALANCERTS.ERP

## Estratégia

O BALANCERTS.ERP passa a ter um wrapper Electron separado da aplicação web. O renderer continua a usar a mesma shell React/tRPC, enquanto o processo principal cria uma janela de aplicação nativa com isolamento (`contextIsolation`, `sandbox` e `nodeIntegration: false`). A URL funcional é injectada no momento do pacote através de `BALANCERTS_DESKTOP_URL` e tem de ser HTTPS; assim, nenhum instalador de produção aponta silenciosamente para localhost.

Esta estratégia entrega uma aplicação desktop visualmente consistente, mas requer uma URL de produção estável e acessível. O backend, a base de dados, OAuth e armazenamento continuam no ambiente servidor; não são incorporadas credenciais de produção no EXE, MSI ou DMG.

## Targets

| Plataforma | Artefacto | Configuração | Ambiente de build |
|---|---|---|---|
| Windows | EXE instalador | `nsis` | `windows-latest` ou Windows local |
| Windows | MSI empresarial | `msi` | Runner Windows/nativo com validação MSI |
| macOS Intel/Apple Silicon | DMG | `dmg` | `macos-latest` ou macOS local |
| macOS Intel/Apple Silicon | ZIP auxiliar | `zip` | Runner macOS/nativo |

O NSIS é o instalador Windows geral; MSI é apropriado para implantação empresarial por GPO/SCCM/Intune e exige atenção ao UpgradeCode. DMG é o formato padrão de distribuição por arrastar para Applications. Estas escolhas seguem a documentação oficial do electron-builder [1].

## Comandos

Para desenvolvimento local, `pnpm desktop:dev` abre a aplicação contra `http://127.0.0.1:3000`. Para preparar uma distribuição é necessário fornecer uma URL HTTPS e executar `pnpm desktop:win` ou `pnpm desktop:mac`. `pnpm desktop:dir` gera um directório Linux para smoke tests no sandbox; não substitui os testes nativos Windows/macOS.

A pipeline manual `.github/workflows/desktop-release.yml` gera Windows e macOS em runners nativos e publica os artefactos como workflow artifacts. A pipeline não está activada automaticamente e não publica em lojas nem comunica com a AGT.

## Assinatura e limitações

Os pacotes actualmente estão configurados para permitir build sem assinatura durante desenvolvimento. Para distribuição aos utilizadores, Windows e macOS devem ser assinados. A documentação Electron explica que aplicações sem assinatura podem desencadear avisos e exigem passos manuais adicionais; macOS requer assinatura Developer ID e notarização, enquanto Windows exige um certificado/serviço de assinatura adequado [2]. O processo de assinatura não pode ser concluído neste sandbox sem certificados, credenciais e runners nativos do proprietário.

> A criação dos instaladores não equivale a homologação fiscal. A homologação AGT, credenciais, endpoints, XSD e validação oficial permanecem fora do pacote desktop e continuam desactivados.

## Estado actual

A configuração Electron foi adicionada, o pacote Linux de directório foi gerado e o executável iniciou em smoke test headless sem deixar processos pendurados. TypeScript, suite funcional e build web continuam aprovados. EXE, MSI e DMG finais devem ser gerados no workflow Windows/macOS com uma URL HTTPS de produção e, para distribuição pública, certificados de assinatura.

## Referências

[1]: https://www.electron.build/docs/targets/ "electron-builder — Target Selection Guide"
[2]: https://electronjs.org/docs/latest/tutorial/code-signing "Electron — Code Signing"
