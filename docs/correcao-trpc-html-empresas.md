# Correcção do erro tRPC em `/empresas`

## Sintoma

A página `/empresas` apresentava `TRPCClientError: Unexpected token '<', "<!doctype "... is not valid JSON`. O cliente tRPC estava a tentar interpretar uma resposta HTML como JSON.

## Causa confirmada

O service worker interceptava todos os pedidos GET do mesmo domínio. Quando um pedido API falhava transitoriamente, o fallback genérico devolvia a aplicação shell (`/`), que é HTML. Em pedidos `/api/trpc`, o parser tRPC recebia então `<!doctype html>` em vez de uma resposta JSON.

## Correcção aplicada

O service worker foi actualizado para:

- deixar passar directamente todos os pedidos em `/api/*`, incluindo `/api/trpc`;
- usar o fallback HTML apenas para pedidos de navegação offline;
- devolver uma resposta de erro de rede para outros recursos, em vez de devolver HTML;
- actualizar a cache de `balancerts-erp-shell-v1` para `balancerts-erp-shell-v2`;
- remover caches antigas do shell durante a activação.

Foi adicionada uma regressão em `client/public/sw.test.ts` para impedir que esta regra volte a ser alterada inadvertidamente.

## Validação

- `pnpm vitest run`: **52 ficheiros, 184 testes aprovados**.
- `pnpm exec tsc --noEmit`: **aprovado**.
- `pnpm run build`: **aprovado** para frontend e servidor.
- Pedido directo a `/api/trpc/companies.list`: respondeu `401 Unauthorized` com `content-type: application/json` sem sessão, o comportamento esperado; não devolveu HTML.
- Verificação visual de `/empresas`: **carregada correctamente** com as empresas persistentes, incluindo Repair Lubatec.

A integração real com a AGT não foi activada nem alterada.
