# Reteste dos ficheiros desktop guardados no Google Drive

## Resultado

A pasta [BALANCERTS.ERP Desktop Releases](https://drive.google.com/drive/folders/1YmtpkzJuEzHiXNpBY0fMkK-oVLIZb8-F) contém dois ficheiros: o smoke package Linux e o pacote de configuração/documentação desktop. Ambos foram descarregados novamente através do Google Drive para uma área temporária e testados sem alterar os originais.

| Ficheiro | Tamanho | MD5 confirmado | ZIP íntegro |
|---|---:|---|---|
| `BALANCERTS-ERP-desktop-linux-smoke.zip` | 171 549 622 bytes | `edb2f91ddef159f026aca93a758cd5dc` | Sim |
| `BALANCERTS-ERP-desktop-package-docs.zip` | 5 117 bytes | `56490b193dfd23e31f0f64fff4f73c30` | Sim |

## Smoke test Electron

O pacote Linux foi extraído sem erros. O binário recuperado é um executável ELF x86-64 válido. Com `xvfb`, a aplicação Electron abriu a página `BALANCERTS.ERP` na URL de teste `http://127.0.0.1:3000`; a porta de debugging devolveu uma página com título `BALANCERTS.ERP` e URL correcta. Isto confirma o arranque do wrapper e o carregamento da aplicação. O término forçado por timeout gera uma mensagem de shutdown do Electron; esta mensagem pertence ao encerramento artificial do teste e não ao arranque.

## Validação do ERP

Depois do reteste do Drive, foram executados novamente TypeScript, a suite Vitest completa e o build de produção. O resultado manteve-se em **51 ficheiros e 182 testes aprovados**, TypeScript sem erros e build web aprovado. Os logs recentes mostram apenas avisos esperados de autenticação sem cookie quando a página é aberta sem sessão e mensagens normais do React/Vite; não foi identificado erro funcional novo.

## Limites

O ZIP guardado é um smoke package Linux, não um EXE, MSI ou DMG. A configuração destes targets foi verificada pelo electron-builder, mas a criação e validação final dos instaladores requerem runners Windows/macOS. A assinatura Windows, assinatura/notarização Apple, URL HTTPS de produção e testes de instalação em máquinas reais continuam necessários antes da distribuição pública. A homologação AGT não é afectada nem activada por estes testes.
