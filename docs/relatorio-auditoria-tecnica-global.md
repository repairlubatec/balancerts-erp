# Relatório de auditoria técnica global — BALANCERTS.ERP

**Autor:** Manus AI  
**Data:** 19 de Agosto de 2026  
**Escopo:** Arquitectura, segurança, dados, módulos funcionais, conformidade preparada, experiência desktop, testes, desempenho e distribuição.

## 1. Conclusão executiva

O BALANCERTS.ERP encontra-se num estado **tecnicamente avançado para uma versão pré-produção**, com uma base funcional real e uma arquitectura coerente para um ERP empresarial web com experiência desktop. Não o classificaria ainda como produto pronto para venda em ambiente empresarial crítico, nem como aplicação Windows autónoma offline. A classificação global actual é **7,4/10 — pré-produção avançada**.

A aplicação já possui autenticação OAuth, RBAC por função, isolamento por empresa na maioria das operações, auditoria append-only com correlação, idempotência em fluxos críticos, séries documentais, contabilidade, tesouraria, fiscalidade preparada para AGT, compras, stock, transferências, contagens físicas, relatórios, fecho e Balancerts IA local. A suite actual foi validada com **235 testes em 64 ficheiros**, TypeScript sem erros e build de produção aprovado.

Os principais impedimentos para produção são estruturais, não apenas visuais: o modelo de organização está centrado no proprietário e não tem associação utilizador-organização; as relações da base de dados não declaram chaves estrangeiras no schema Drizzle; faltam endurecimento HTTP, limitação de pedidos, observabilidade e estratégia de backup/recuperação documentada; o empacotamento Electron é um cliente de um servidor remoto, não um executável autónomo; e a integração AGT real continua correctamente desligada por falta de credenciais, endpoint e homologação oficial.

> **Veredicto:** o produto já é um ERP funcional de pré-produção e uma demonstração técnica sólida. Ainda precisa de uma etapa de endurecimento empresarial, testes E2E e preparação operacional antes de ser apresentado como solução pronta para clientes grandes.

## 2. Classificação por área

| Área | Estado actual | Classificação | Observação principal |
|---|---|---:|---|
| Arquitectura | React/Vite/tRPC/Express/Drizzle/Electron bem integrados | 8/10 | Boa separação por camadas, mas `Home.tsx` e `server/db.ts` concentram demasiada lógica |
| Autenticação | OAuth, sessão HTTP-only, nonce OAuth e fallback Bearer | 7/10 | Boa base; cookie local e dependência externa precisam de endurecimento |
| RBAC | Funções admin, contabilista, financeiro, operador e auditor | 7/10 | Existe matriz, mas falta membership por organização |
| Isolamento empresarial | Filtros tenant-aware e validações no servidor | 7/10 | Forte para proprietário; incompleto para colaboração multiutilizador |
| Integridade da base de dados | Idempotência, unicidades e transacções importantes | 6/10 | Ausência de FKs declaradas deixa risco de registos órfãos |
| Contabilidade | Plano de contas, lançamentos, saldos, centros, apuramento e fecho | 8/10 | Núcleo sólido para pré-produção; necessita testes E2E e validação contabilística externa |
| Tesouraria | Contas, pagamentos, aprovações, extractos e reconciliação | 8/10 | Execução bancária externa continua preparada, não ligada |
| Comercial | Contrapartes, produtos, séries, documentos e estados | 8/10 | Boa base SAF-T; PDF/hash/QR e AGT permanecem sem certificação oficial |
| Operações | Armazéns, movimentos, transferências, saldos e contagens | 8/10 | Ciclo operacional principal implementado e auditado |
| Fiscalidade | Obrigações, normas versionadas, evidências e fila AGT | 7/10 | Preparação local boa; submissão AGT ainda não pode ser alegada |
| Controlo | Relatórios, auditoria, tarefas e fecho | 7,5/10 | Funcional, mas faltam mapas e exportações empresariais mais completos |
| Balancerts IA | Provider local Ollama opcional, revisão humana e auditoria | 7,5/10 | Segurança conceptual correcta; qualidade depende do modelo e do computador |
| UX desktop | Shell interno, separadores, janelas, barra de tarefas e Enter como Tab | 8/10 | Visual consistente; alguns formulários são demasiado densos/largos |
| Testes | 235 testes e validações de build | 8/10 | Boa cobertura de regras; cobertura E2E de todos os fluxos ainda não demonstrada |
| Distribuição | Scripts EXE/MSI/DMG e configuração Electron | 6/10 | O pacote actual aponta para backend remoto e não é autónomo |
| Operação de produção | Health check básico e logs locais | 5/10 | Faltam backup, monitorização, alertas, rate limiting e CI explícito |

## 3. Arquitectura e qualidade do código

A combinação React 19, Vite, Tailwind 4, tRPC 11, Express, Drizzle ORM, MySQL e Electron é apropriada para o produto pretendido. O contrato tRPC mantém tipos partilhados entre cliente e servidor e as mutações importantes estão concentradas em helpers persistentes. O uso de `db.transaction(...)` nos fluxos de pagamentos, recepções, séries documentais, transferências e outros fluxos críticos é uma decisão correcta.

O principal problema de manutenção é a concentração. `client/src/pages/Home.tsx` funciona como orquestrador do shell, montagem de muitos módulos, consultas, selecção de empresa, tabelas genéricas e formulários. `server/db.ts` também concentra grande parte das regras persistentes. Isto não impede o funcionamento actual, mas aumenta o risco de regressão e torna mais difícil testar e evoluir cada domínio independentemente. A recomendação é dividir por domínios: `companies`, `accounting`, `treasury`, `commercial`, `operations`, `control` e `ia`, preservando os contratos tRPC.

Foi executada a preparação do pacote Electron para Linux em modo de directório: a build Vite e o bundle de servidor concluíram, e o Electron Builder preparou `release/linux-unpacked`. Isto valida a cadeia de build, mas não prova a geração efectiva dos instaladores Windows e macOS.

## 4. Segurança, RBAC e isolamento

A segurança tem bons fundamentos. Há procedimentos protegidos, sessão OAuth, verificação de nonce no callback, cookies HTTP-only, verificação de scope em mutações críticas, funções de utilizador diferenciadas e registos de auditoria com actor, correlação e estados anterior/posterior.

A limitação mais importante está no modelo de organização. O schema tem `users.role` e `organizations.ownerUserId`, mas não existe uma tabela de associação entre utilizador e organização. As consultas e mutações tenant-aware filtram frequentemente por `organizations.ownerUserId = userId`. Na prática, o proprietário pode trabalhar na organização; os restantes papéis existentes no enum não constituem ainda uma autorização completa por organização. Para uma empresa grande, é necessário criar memberships com, no mínimo, `organizationId`, `userId`, função, estado, data de entrada, data de saída e permissões opcionais por empresa.

A segunda limitação é a ausência de chaves estrangeiras declaradas em `drizzle/schema.ts`. Existem IDs escalares para organizações, empresas, períodos, documentos, movimentos e linhas, e existem unicidades e idempotência, mas o schema não declara `references(...)`. A aplicação valida muitos vínculos, porém uma operação directa na base de dados ou uma falha num caminho não transaccional pode produzir órfãos. Antes de produção, devem ser avaliadas e adicionadas FKs não destrutivas, com migração e verificação de dados existentes.

No arranque Express observado, há limite de corpo de 50 MB, mas não há middleware evidente para headers de segurança, rate limiting, métricas ou política de conteúdo. Isto não significa que o sistema esteja aberto por defeito, mas significa que o hardening de produção ainda não está concluído. Deve ser acrescentada uma camada explícita com CSP compatível, HSTS apenas em HTTPS, X-Content-Type-Options, Referrer-Policy, rate limiting por sessão/IP, limites específicos por endpoint e logging estruturado sem dados fiscais sensíveis.

O cookie de sessão usa `httpOnly` e `SameSite=none`, com `secure` dependente de HTTPS. Em localhost HTTP, alguns navegadores podem rejeitar um cookie SameSite=None sem Secure. A distribuição desktop usa normalmente HTTPS remoto e fica menos exposta a este problema, mas o modo de teste local deve ter uma política explícita para `localhost`.

## 5. Avaliação dos módulos

### Contabilidade e Tesouraria

O núcleo contabilístico está acima de um protótipo: inclui contexto por exercício/período, plano de contas, lançamentos, centros de custo, dimensões analíticas, importação, saldos iniciais, regularizações, aprovações, fecho e reabertura auditada. A tesouraria acrescenta contas, pagamentos com aprovação, transferências internas, importação de extractos e reconciliação com motivo obrigatório para ajustes.

O risco que permanece é de operação empresarial: os fluxos precisam de testes E2E contra uma base de dados de teste representativa, incluindo concorrência, fecho de período, reabertura, reversão, falha entre movimentos e reprocessamento. A existência de testes unitários e de integração é positiva, mas não substitui a aceitação de utilizadores contabilistas.

### Comercial e Fiscalidade

A numeração por série/código/tipo está protegida por unicidade e reserva transaccional. As contrapartes, produtos, condições de pagamento, limites de crédito, documentos, recepções e estados comerciais estão ligados aos módulos financeiros e operacionais.

A parte AGT encontra-se correctamente posicionada como **preparação técnica**: há XSD e estruturas de validação, fila, idempotência, evidências e adaptador configurável. Não há base para afirmar homologação, certificação ou submissão real. O PDF, hash, QR, regras finais e comunicação oficial devem ser validados contra as credenciais, endpoint, XSD e critérios vigentes fornecidos pela AGT.

### Operações

O módulo de stock já cobre armazéns, movimentos, transferências atómicas, saldo por artigo/armazém, recepções de compras e contagens físicas com aprovação e aplicação auditada. Esta é uma boa base P0/P1. Não encontrei evidência suficiente, nesta auditoria, de um ciclo completo de lotes, números de série, validade e rastreabilidade por lote, pelo que estes itens não devem ser anunciados como concluídos sem confirmação específica.

### Controlo e Balancerts IA

Controlo possui Fiscalidade, Relatórios, Fecho, Centro de Tarefas e Auditoria. A IA local Ollama está desenhada de forma prudente: indisponibilidade não bloqueia o ERP, as propostas têm revisão humana e a aplicação automática a documentos fiscais está desactivada. A qualidade da classificação dependerá do modelo local, da memória disponível e da qualidade dos prompts; os resultados devem ser tratados como assistência, nunca como decisão contabilística.

## 6. Experiência desktop

A revisão visual confirma uma experiência desktop-first consistente: menu lateral agrupado, separadores internos, janela central, barra superior, contexto da empresa e janelas internas em vez de pop-ups do navegador. A regra de Enter como Tab é uma decisão correcta para trabalho intensivo.

Há, contudo, três pontos de UX que devem ser tratados antes de uma entrega comercial. Primeiro, algumas áreas de Facturação e Stock ficam muito densas e parcialmente largas em 1440 px, exigindo rolagem horizontal ou demasiados campos na mesma linha. Segundo, o componente `OperationalCreatePanel` é genérico e aparece em vários módulos, incluindo Stock, onde coexistem criação de produto, movimento de stock e actualização genérica por ID; isto funciona tecnicamente, mas não comunica a separação de domínio esperada num ERP profissional. Terceiro, os filtros e estados ainda expõem alguns códigos técnicos e placeholders operacionais em zonas de baixo nível.

O shell é visualmente convincente como aplicação de gestão, mas continua a ser uma SPA React dentro de Electron. Não é ainda um executável Windows autónomo com base local e sincronização.

## 7. Testes, desempenho e engenharia de entrega

A validação actual é forte para o estágio do produto: 235 testes em 64 ficheiros, TypeScript sem erros e build aprovada. Os testes cobrem regras puras, RBAC, isolamento, idempotência, auditoria, contabilidade, tesouraria, operações, IA e componentes selecionados.

Os limites são igualmente importantes. Não existe evidência de uma bateria E2E abrangente que atravesse cada botão do shell com base de dados real, nem de testes de carga, recuperação de falhas, migração de versões, actualização do Electron ou instalação limpa em Windows. A build produz um JavaScript cliente de aproximadamente 1,6 MB antes de gzip e emite aviso de chunks superiores a 500 kB. Não é um bloqueio funcional, mas justifica divisão por módulos com `dynamic import`.

Os logs de desenvolvimento mostram erros históricos de parsing e avisos de chaves duplicadas durante iterações anteriores. A versão actual compila e apresenta as rotas, mas o log ainda regista o aviso `Duplicate key "DRAFT"` em `presentationLabels.ts`. Deve ser removido porque warnings persistentes degradam a confiança no diagnóstico e podem esconder regressões futuras.

Os scripts incluem `check`, `test`, `build` e `desktop:win`/`desktop:mac`, mas não foi encontrada uma pipeline CI explícita, política de backup/restore da base de dados ou observabilidade de produção com métricas e alertas. O health check existente é útil, mas insuficiente para um ERP crítico.

## 8. Prontidão real para Windows

O Electron Builder está configurado para NSIS/MSI em Windows x64 e DMG/ZIP em macOS x64/arm64. Isto é suficiente como ponto de partida para criar instaladores, mas ainda não representa uma aplicação autónoma. `electron/main.mjs` carrega `BALANCERTS_DESKTOP_URL`; o pacote exclui cliente, servidor, schema, documentação e testes, logo o instalador depende de um backend remoto acessível por HTTPS.

Para uma primeira versão comercial, esta arquitectura é aceitável se for assumida como **cliente desktop ligado a serviço central**. Se o requisito for funcionamento sem internet ou com dados locais, será necessário definir uma arquitectura diferente: base local cifrada, sincronização, resolução de conflitos, fila offline, actualização de schema e recuperação.

## 9. Prioridades técnicas

| Prioridade | Trabalho | Motivo |
|---|---|---|
| P0 | Criar memberships por organização e aplicar RBAC ao membership em todas as queries/mutações | Necessário para uma empresa grande com vários utilizadores |
| P0 | Rever e adicionar FKs, índices de pesquisa e políticas de integridade | Reduz risco de dados órfãos e inconsistências |
| P0 | Hardening HTTP, rate limiting, headers, limites por endpoint e logging seguro | Necessário antes de exposição pública |
| P0 | Backup automático, teste de restauro e plano de continuidade | Um ERP não pode depender apenas da disponibilidade actual da base de dados |
| P1 | Suite E2E com base de dados: login, empresa, documento, pagamento, stock, fecho e auditoria | Confirma que os botões funcionam no ciclo real, não apenas em mocks |
| P1 | Gerar e testar instaladores Windows em máquina limpa | Validar EXE/MSI, atualização, permissões, URL e recuperação |
| P1 | Remover warning de chave duplicada e dividir `Home.tsx`/`db.ts` por domínio | Melhora manutenção e reduz regressões |
| P1 | Completar exportações PDF/XLSX e mapas operacionais | Necessário para uso diário e auditoria |
| P2 | Lotes, números de série, validade e rastreabilidade avançada | Necessário apenas para sectores que utilizem estes controlos |
| P2 | Code splitting, cache e medição de queries | Melhora desempenho em instalações com muitos dados |
| P2 | Providers pagos e integração AGT real | Dependem de credenciais, endpoint, critérios e homologação externa |

## 10. Resposta directa

**Tecnicamente, o app está bem encaminhado e já ultrapassou a fase de demonstração visual.** Tem regras persistentes, transacções, auditoria, módulos integrados e uma experiência desktop coerente. **Ainda não está tecnicamente pronto para ser declarado produto empresarial final, certificado AGT ou ERP autónomo para Windows.**

A maior prioridade não é adicionar mais ecrãs; é endurecer o que já existe: membership multiutilizador, integridade relacional, segurança de produção, backup, E2E e instalador Windows real. Depois destas correcções, a base poderá ser avaliada novamente para uma classificação de pré-produção próxima de produção.

## Referências internas

- `drizzle/schema.ts` — modelo de dados, unicidades e ausência de `references(...)`.
- `server/db.ts` — queries tenant-aware, transacções, idempotência e auditoria.
- `server/permissions.ts` — matriz de permissões.
- `server/_core/context.ts` e `server/_core/cookies.ts` — autenticação e sessão.
- `server/_core/index.ts` — arranque Express, limites de corpo e API tRPC.
- `client/src/pages/Home.tsx` — montagem dos postos e formulários operacionais.
- `client/src/lib/presentationLabels.ts` — rótulos e warning de chave duplicada.
- `electron/main.mjs` e `electron-builder.yml` — distribuição desktop e dependência de URL remota.
- `package.json` — scripts de testes, build, Electron e migrações.
- `docs/auditoria-tecnica-global.md` — evidências técnicas recolhidas durante esta auditoria.
