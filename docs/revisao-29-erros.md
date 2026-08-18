# Revisão dos 29 erros reportados

## Resultado da investigação

A análise do estado actual não encontrou 29 falhas independentes no backend. Foram identificadas duas fontes de cascata no frontend que podiam aparecer ao utilizador como dezenas de erros: avisos repetidos do Fast Refresh provocados por exports utilitários dentro de `Home.tsx`, e várias mensagens de erro `UNAUTHORIZED` emitidas por cada query quando a sessão não estava disponível.

## Correcções aplicadas

Os helpers `resolveNewAction`, `getActionPresentation` e `getQuickActions` foram movidos para `client/src/lib/homeActions.ts`. Os helpers de traceabilidade deixaram de ser reexportados pelo componente React. Esta separação mantém a mesma API funcional da command palette e permite ao Vite actualizar o componente sem invalidar o Fast Refresh.

O tratamento tRPC em `client/src/main.tsx` passou a reconhecer o código estruturado `UNAUTHORIZED` e a mensagem legada. O redireccionamento para login é protegido por uma guarda para ocorrer uma única vez, e erros de autenticação esperados deixam de ser impressos como erros repetidos. Erros de negócio continuam a ser registados.

Foi criado `client/src/lib/trpcErrors.ts` com testes específicos para erros estruturados, mensagem legada e erros não relacionados. Os testes existentes da command palette foram ajustados para importarem os helpers do módulo próprio.

## Validação concluída

| Verificação | Resultado |
|---|---|
| Suite Vitest | 53 ficheiros, 187 testes aprovados |
| TypeScript | `pnpm exec tsc --noEmit` aprovado |
| Build de produção | Frontend e servidor aprovados |
| Rotas verificadas | Overview, Empresas, Facturação e Contabilidade carregadas visualmente |
| Dados reais persistentes | Repair Lubatec visível na página Empresas |
| Integração AGT | Não activada nem alterada |

Os avisos de tamanho de bundle do Vite permanecem apenas como aviso de optimização, não como erro funcional.
