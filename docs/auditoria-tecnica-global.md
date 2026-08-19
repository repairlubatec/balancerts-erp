# Auditoria técnica global — BALANCERTS.ERP

## Evidências iniciais

A aplicação usa React 19, Vite, Tailwind 4, tRPC 11, Express, Drizzle ORM, MySQL, Electron e OAuth externo. O código fonte contém aproximadamente 230 ficheiros TypeScript/TSX distribuídos por cliente, servidor, schema e partilhados. O router tRPC concentra os contratos dos módulos numa única superfície, enquanto `server/db.ts` concentra grande parte da persistência.

A suite verificada no último ciclo contém 64 ficheiros e 235 testes aprovados, com TypeScript e build de produção aprovados. Existem scripts de distribuição Electron para Windows e macOS. O shell de janelas internas e a navegação por módulos estão implementados numa aplicação SPA React.

## Achados técnicos já confirmados

O controlo de acesso combina autenticação protegida e matriz RBAC por módulo. Porém, as consultas e mutações tenant-aware filtram repetidamente por `organizations.ownerUserId = actorUserId`. O schema contém `users.role`, `organizations.ownerUserId` e empresas, mas não contém uma tabela de membros/associações utilizador-organização. Isto significa que o desenho actual suporta sobretudo o proprietário da organização e não um modelo completo de colaboração empresarial multiutilizador.

O schema Drizzle não declara `references(...)` para as relações entre empresas, organizações, períodos, documentos, movimentos e linhas. Há vários índices únicos e chaves de idempotência importantes, mas a integridade referencial depende maioritariamente da aplicação. Esta decisão reduz protecção contra órfãos e inconsistências caso exista acesso directo à base de dados ou falha numa operação não transaccional.

O servidor aceita corpos JSON até 50 MB e não apresenta, no arranque principal, middleware evidente para headers de segurança, limitação de pedidos, métricas ou política de conteúdo. Existe health check do router e protecção OAuth, mas a observabilidade de produção, rate limiting e endurecimento HTTP devem ser verificados antes de uma exposição pública.

O cookie de sessão é HTTP-only e usa OAuth com verificação de nonce, mas `SameSite` é definido como `none` e `secure` depende do pedido HTTPS. Em localhost HTTP, esta combinação pode causar rejeição do cookie em alguns navegadores. O Electron carrega uma URL remota HTTPS, pelo que a distribuição desktop é actualmente um cliente embebido de um servidor remoto, não um ERP totalmente autónomo.

A configuração Electron cria targets Windows x64 para NSIS/MSI e macOS x64/arm64 para DMG/ZIP. O empacotamento depende de `BALANCERTS_DESKTOP_URL` e de um endpoint HTTPS preparado; os ficheiros cliente/servidor/base de dados não são empacotados como aplicação autónoma. Isto deve ser considerado uma distribuição desktop com backend remoto, não um executável offline.

A build produz um bundle cliente superior a 1,6 MB antes de gzip e emite aviso de chunks acima de 500 kB. Não existe, nos scripts inspeccionados, um pipeline CI explícito, lint dedicado, sistema de backup/restore de dados ou observabilidade de produção completa.

## Evidências visuais

A amostra de oito rotas confirma um shell desktop consistente: menu lateral agrupado, separadores internos, barra superior, janela central e ausência de pop-ups do navegador. Os módulos têm composição densa e adequada a uma aplicação de gestão. Foram observados, contudo, pontos de acabamento: em Facturação e Stock existem formulários muito largos com campos e filtros que ficam parcialmente fora da viewport de 1440 px; a janela de contexto contabilístico usa sobreposição interna correctamente, mas o fluxo inicial ainda depende de dados de períodos já criados; há rótulos e códigos documentais técnicos inevitáveis em áreas fiscais, embora os estados visíveis estejam maioritariamente traduzidos. A interface é desktop-first, mas ainda não equivale a uma aplicação nativa offline.
