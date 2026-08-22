# Validação visual — 22/08/2026

A captura de `/contabilidade` confirmou a interface em shell desktop com barra lateral persistente, contexto financeiro visível, empresa Repair Lubatec activa, exercício 2023, período Setembro aberto e acções operacionais agrupadas por separadores. Os atalhos visíveis “Novo lançamento” e “Importar” aparecem como acções do módulo, sem scroll vertical necessário no viewport inicial.

A captura de `/pgca` confirmou a área normativa em português, com isolamento activo, governação de versões, escolha de empresa e versão normativa, contadores de contas/postáveis e separadores de plano de contas, versões/fontes e auditoria/migração. Não foram observados textos técnicos em inglês no viewport capturado. A versão PGCA ainda não está seleccionada, pelo que não se deve inferir prontidão ou activação a partir desta captura.

A verificação de tipos e a suite global também foram executadas nesta sessão: TypeScript sem erros; 106 ficheiros e 393 testes aprovados. Os erros Vite encontrados no log são históricos, anteriores à última actualização HMR, não reproduzidos pela validação actual.

## Actualização após selecção de lotes

A página `/pgca` continuou a renderizar correctamente com a versão `PGCA-82-01` em revisão e 20 contas carregadas. A nova funcionalidade usa o manifesto de lotes como catálogo de trabalho e não executa confirmação, activação ou alteração de dados por selecção. A aba de governação mantém-se integrada no mesmo shell desktop.
