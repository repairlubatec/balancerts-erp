# Validação no navegador — Contabilidade

**URL:** https://3000-il6hqm9sj5vcwt4ese0k2-6b355097.us4.manus.computer/contabilidade?entry=new&from_webdev=1

A rota abriu no navegador autenticado do utilizador e renderizou o shell desktop do BALANCERTS.ERP, com navegação em português, módulos, separadores de janela e os botões `Novo lançamento` e `Importar documento`. O painel mostra o bloqueio correcto quando não existe empresa activa/período criado: os lançamentos ficam bloqueados até existir uma versão PGCA activa e validada. A página apresenta ainda isolamento activo, mapas contabilísticos, motor protegido e trilho de auditoria.

A validação foi de leitura apenas. Não foi submetida nenhuma operação nem alterado qualquer dado.

**Observação técnica:** a página carregou com HTTP 200 e a compilação TypeScript/testes dirigidos continuam aprovados. O erro JSX encontrado nos logs tem timestamp anterior e não reapareceu durante esta abertura; permanece registado como histórico até limpeza/reinício formal dos logs.
