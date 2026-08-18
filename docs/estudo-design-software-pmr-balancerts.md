# Estudo de direcção de design — BALANCERTS.ERP

**Estado:** análise concluída, sem implementação visual nesta fase.

## 1. Conclusão executiva

O que o BALANCERTS.ERP precisa não é de se transformar numa cópia visual do PMR. Precisa de adoptar a clareza modular, a selecção por empresa, a ligação entre aplicações, o arquivo digital, as tarefas, os relatórios, as notificações e a orientação para produtividade que o PMR apresenta publicamente, mas convertendo esses princípios numa **shell de software ERP profissional para Windows, macOS e PWA**.

A referência PMR é sobretudo uma apresentação institucional e uma demonstração de produto online. A futura aplicação BALANCERTS deve ser mais densa, accionável e orientada ao trabalho diário: várias janelas internas, separadores, painéis redimensionáveis, tabelas operacionais, atalhos de teclado, contexto empresarial persistente e rastreabilidade de cada operação. A aplicação deve parecer um ambiente de trabalho financeiro, não uma sucessão de páginas web.

## 2. O que foi analisado

Foram analisadas a página pública principal do [PMR Software][1], a página [PMR Interface][2], a área de [Produtos][3], a área de [Serviços][4] e a apresentação institucional [Sobre a PMR][5]. Também foram descarregados e lidos os documentos do workspace: Especificação-Mãe D1, Motor Contabilístico D2, Arquitectura Técnica D3, Qualidade/Testes D4, FTI-2.0, FTI-2.1 Hardening, Comando Mestre e o logótipo BALANCERTS.

Os documentos internos confirmam que o produto é um sistema financeiro-contabilístico de missão crítica, multiempresa e multiutilizador, com PGC Angola, fiscalidade versionada, isolamento rigoroso, auditoria, estados explícitos, motor contabilístico como autoridade única e rastreabilidade nos dois sentidos. A FTI-2.1 define ainda que a equipa não deve continuar a expandir a visão do produto, mas converter os contratos existentes em implementação, testes, observabilidade e evidência.

## 3. Padrões PMR que vale a pena adoptar

| Padrão de referência | Aplicação no BALANCERTS.ERP |
|---|---|
| Selecção inequívoca de empresa | Barra de contexto persistente com empresa, NIF, exercício e período activos |
| Organização por famílias de produto | Áreas de trabalho agrupadas em Operação, Financeiro, Comercial, Fiscalidade, Pessoas e Administração |
| Gestão de tarefas | Centro de trabalho com pendências accionáveis, responsável, prazo, estado e ligação à origem |
| Suporte entre aplicações | Navegação Documento → Fiscalidade → Lançamento → Conta → Relatório e no sentido inverso |
| Arquivo digital | Painel documental associado a entidade, hash, ACL, versão e origem |
| Tabelas e notificações | Grelhas densas com filtros, colunas configuráveis, estados, alertas e acções de teclado |
| PDFs e reporting | Visualizador de documentos e relatórios numa janela interna, sem abandonar o contexto do trabalho |
| Actualizações e segurança | Centro de saúde do sistema, auditoria, fila de integrações e avisos de configuração |

A página Interface do PMR destaca produtividade, redução de tempo, trabalho online, segurança documental, suporte entre aplicações, entidades, planos de contas, movimentos, arquivo digital, tarefas, reporting e estatísticas [2]. Estes conceitos correspondem directamente aos princípios já definidos na Especificação-Mãe BALANCERTS e devem ser preservados na nova experiência.

## 4. Direcção visual proposta

A identidade visual deve partir do logótipo BALANCERTS: **azul institucional**, **verde de crescimento** e **preto para autoridade e texto**, sobre superfícies claras e neutras. O azul deve representar acção e navegação; o verde, estados positivos e crescimento; o âmbar, configuração ou revisão; e o vermelho, bloqueios reais. A cor nunca deve ser a única forma de comunicar um estado.

A linguagem visual deve ser profissional e sóbria, com tipografia legível, bordas discretas, sombras curtas, densidade ajustável e pouco ornamento. O produto deve privilegiar informação, hierarquia e resposta imediata. O actual dashboard de cartões pode permanecer como visão geral, mas não deve ser o modelo de todas as páginas.

## 5. Arquitectura de software da interface

A aplicação deve evoluir para uma shell com cinco zonas estáveis:

| Zona | Responsabilidade |
|---|---|
| Barra superior | Empresa activa, organização, exercício/período, pesquisa global, notificações, estado do sistema e perfil |
| Navegação lateral | Módulos, favoritos, recentes, tarefas e atalhos; redimensionável e recolhível |
| Barra de trabalho | Separadores/janelas abertas, estado de gravação, filtros activos e comandos do módulo |
| Área central | Uma ou mais janelas internas com tabelas, formulários, documentos e relatórios |
| Painel contextual | Detalhe da entidade, rastreabilidade, auditoria, validações e acções relacionadas |

O modelo deve ser de **multijanelas internas**, não de múltiplas rotas isoladas. Cada janela deve possuir título, ícone, estado, empresa/contexto, fechar, maximizar, dividir e, quando necessário, abrir em painel lateral. A persistência deve guardar apenas preferências de apresentação e contexto seguro; nunca deve substituir a autorização do backend.

## 6. Regras de interação obrigatórias

A UI deve apresentar sempre a empresa, exercício e período que governam a operação. Antes de confirmar uma acção crítica, deve mostrar estado, impacto, origem, permissões e resultado esperado. Estados de documentos, lançamentos, períodos, tarefas, integrações e pendências devem ser explícitos.

A interface nunca deve simular uma operação concluída com dados demonstrativos. Quando não existirem registos, deve mostrar um estado vazio accionável e explicar a configuração necessária. Erros devem indicar código funcional, correlação, causa compreensível e próxima acção segura.

A cadeia de rastreabilidade deve ser navegável em ambos os sentidos. A partir de uma factura, o utilizador deve chegar ao imposto, lançamento, conta e relatório. A partir de um relatório, deve conseguir voltar à conta, lançamento, documento e origem. Esta navegação deve ocorrer em janelas/painéis relacionados, mantendo o contexto anterior.

## 7. O que deve ser mantido do ERP actual

A sidebar redimensionável, o selector de empresa activa, o contexto tenant-aware, a auditoria, os estados vazios honestos, a configuração PENDING, as séries documentais, a revisão de importações, a fila AGT, o QR, os PDFs, a rastreabilidade e os testes existentes são fundamentos correctos. O redesign deve reorganizar a apresentação sem reescrever o motor contabilístico, contratos de segurança, isolamento ou persistência.

O actual `DashboardLayout` é uma base adequada para a shell: já possui sidebar recolhível, largura redimensionável, navegação de módulos, perfil e contexto persistente. O actual `Home.tsx` concentra demasiadas responsabilidades e deve ser progressivamente decomposto por áreas de trabalho, sem alterar os contratos de backend que já funcionam.

## 8. O que deve mudar

A primeira mudança deve ser estrutural, não cosmética: introduzir uma área de trabalho com separadores e janelas internas; separar visão geral, listagens, formulários, detalhe e auditoria; criar comandos de módulo consistentes; e transformar os painéis de contexto em componentes reutilizáveis.

A segunda mudança deve ser de densidade: reduzir cartões decorativos, aumentar a informação útil por ecrã, permitir escolha de densidade, usar grelhas com cabeçalho fixo, filtros persistentes, selecção por teclado e acções em lote quando autorizadas.

A terceira mudança deve ser de coerência: todas as áreas devem usar o mesmo padrão de cabeçalho, filtros, tabela, detalhe, estado, feedback, confirmação, auditoria e rastreabilidade. Isto reduz a sensação de páginas independentes e aproxima o sistema de uma aplicação profissional.

## 9. Limites de implementação

O redesign não pode enfraquecer os requisitos dos documentos internos. O motor contabilístico continua a ser a autoridade única; as permissões continuam a ser validadas no servidor; documentos confirmados permanecem imutáveis; auditoria é append-only; séries, sequências e operações críticas permanecem transaccionais e idempotentes; e a IA continua assistiva, sem acesso directo irrestrito à base contabilística.

A integração AGT, homologação, credenciais e endpoints reais não fazem parte desta fase de design. O software deve manter a preparação local, mas não declarar certificação nem comunicar externamente sem os elementos oficiais.

## 10. Decisão recomendada

Recomendo implementar o redesign em três etapas controladas, sem acrescentar módulos de negócio: primeiro a shell de software e o sistema de janelas; depois os padrões comuns de listagem, detalhe, formulário, auditoria e rastreabilidade; por fim a migração visual dos módulos existentes, começando por Minhas Empresas, Facturação, Contabilidade, Documentos e Fiscalidade. Cada etapa deve manter os testes actuais e acrescentar evidência visual/funcional, sem aceitar alterações que sejam apenas cosméticas.

## Referências

[1]: https://pmr.pt/ "PMR Software — página principal"
[2]: https://pmr.pt/interface/ "PMR Interface — funcionalidades e galeria"
[3]: https://pmr.pt/produtos/ "PMR — produtos e famílias de aplicações"
[4]: https://pmr.pt/servicos/ "PMR — serviços e pacotes"
[5]: https://pmr.pt/sobre/ "PMR — missão, visão, software e história"
