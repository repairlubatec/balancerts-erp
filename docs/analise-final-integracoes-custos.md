# BALANCERTS.ERP — Análise factual para conclusão do software

**Data de referência:** 20 de Agosto de 2026  
**Empresa de referência:** Repair Lubatec  
**Objectivo:** identificar o que falta implementar, validar ou contratar para transformar o produto interno num software pronto para aceitação, distribuição e integração externa.

> **Nota financeira:** os valores abaixo são preços publicados pelos fornecedores consultados e podem mudar por região, impostos, câmbio, contrato, validação da entidade e condições comerciais. Não constituem uma proposta de compra nem uma garantia de custo final.

## 1. Conclusão executiva

O BALANCERTS.ERP não precisa de uma reconstrução geral. O núcleo interno está desenvolvido: shell Windows-first, multi-empresa, RBAC, auditoria, Contabilidade, Tesouraria, Comercial, Operações, RH, Balancerts IA, exportações, SAF-T de preparação e fluxos de revisão. O que falta para a versão final está concentrado em cinco grupos: **aceitação com dados reais**, **posting salarial efectivamente aprovado**, **integrações externas**, **distribuição assinada** e **activos/credenciais que ainda não foram fornecidos**.

A integração AGT é tecnicamente preparada, mas não deve ser chamada de concluída ou certificada. A documentação oficial consultada descreve facturação electrónica para softwares certificados, assinatura JWS, séries, requestID e processamento assíncrono com consulta posterior [1]. Isso confirma que a implementação interna pode preparar o contrato, a fila e o polling, mas a autorização de produção depende da AGT.

Para Windows, o certificado de assinatura de código **não é um certificado que elimina todos os avisos de malware**. Ele identifica o editor, protege a integridade do ficheiro e ajuda a evitar “Unknown Publisher”; o SmartScreen continua a construir reputação para novos ficheiros. A Microsoft indica que EV já não oferece bypass imediato do SmartScreen desde 2024 [2].

## 2. O que já está implementado no software

| Área | Situação técnica actual |
|---|---|
| Shell desktop | Barra de título, menus, separadores, janelas internas, foco, minimizar/maximizar/restaurar/fechar, atalhos e barra de estado |
| Empresas | Criação, edição, activação, exercício, período, empresa activa, estado e auditoria |
| Segurança | Hierarquia Plataforma → Organização → Empresa, isolamento tenant-aware, memberships, RBAC e segregação de funções |
| Contabilidade | Partidas dobradas, PGC/PGCA parametrizado, lançamento, revisão, publicação, estorno, relatórios, reconciliação e rastreabilidade |
| Tesouraria | Caixa, bancos, pagamentos, transferências internas, extractos, reconciliação, diferenças, ajustes e comprovativos |
| Comercial | Clientes, fornecedores, produtos, serviços, documentos, linhas, impostos, séries, numeração, emissão, anulação e rectificação |
| Operações | Armazéns, stock, entradas, saídas, transferências, recepções, inventários, compras e valorização |
| Fiscalidade | IVA Geral/Simplificado/Exclusão, calendário, registo fiscal, prontidão SAF-T e validações conservadoras |
| Auditoria | Trilho append-only com actor, tenant, entidade, correlação, estado anterior/posterior, reconstrução e exportação XLSX |
| RH | Colaboradores, contratos, salários, IRT, Segurança Social, folhas, aprovação, recibos, PDF, ZIP, mapas e gráfico de custos |
| Centro de Tarefas | Responsável, prioridade, estado, prazo, pesquisa, filtros, paginação, ordenação, acções em massa, desfazer, notificações e CSV/XLSX |
| Balancerts IA | Provider local/offline, sugestões, classificação assistida, revisão humana, Ollama opcional e sem aplicação automática |

## 3. O que falta a nível de implementação interna

### 3.1. Teste operacional com dados reais da Repair Lubatec

A Repair Lubatec está activa, mas a última validação confirmou ausência de tarefas RH, colaboradores, contratos e folhas de pagamento persistidas. Por isso, o cenário real solicitado de alteração em massa, confirmação, desfazer e fluxo RH → Contabilidade → Auditoria ainda não foi executado no tenant real.

Para encerrar este ponto são necessários pelo menos dois registos de tarefa RH reais, idealmente associados a colaboradores e responsáveis reais. Depois devem ser executados: selecção, alteração de estado ou prioridade, confirmação interna, verificação do resultado, desfazer, verificação do estado inicial e consulta do evento de auditoria.

### 3.2. Posting salarial efectivo

O diário salarial opcional já possui contas, linhas, equilíbrio, revisão, aprovação separada, idempotência e auditoria. O que continua protegido é a publicação contabilística final. Isto é intencional: o sistema não deve lançar automaticamente salários numa empresa sem aprovação explícita do contabilista autorizado.

A conclusão exige um teste com uma folha real aprovada, contas salariais configuradas, período aberto, operador e aprovador distintos, lançamento publicado, origem da folha ligada, prevenção de duplicação e posterior visualização no Diário, Razão e Auditoria.

### 3.3. Logótipo oficial

A integração do cabeçalho está preparada, mas o activo oficial da Repair Lubatec ainda não foi fornecido. É necessário receber PNG ou SVG oficial, confirmar que pertence à entidade correcta e validar a apresentação em recibos, PDFs e eventual instalador. Não deve ser usado um logótipo inventado ou obtido sem confirmação.

### 3.4. Ficheiro real anonimizado

A importação comercial já possui pré-validação, detecção de dados potencialmente identificáveis, revisão de linhas, erros, confirmação e isolamento. A cobertura existente usa dados de teste seguros. Falta apenas o ficheiro real anonimizado da equipa para provar o fluxo com a estrutura efectivamente utilizada pelo cliente.

## 4. Integrações AGT: o que está pronto e o que falta

O projecto já inclui configuração versionada, contratos de API, QR, hash, JWS de teste, filas, requestID, polling, retry, idempotência, respostas, estados, auditoria, SAF-T AO, XSD local e bloqueios de submissão quando a prontidão é insuficiente.

A documentação pública do Portal do Parceiro AGT descreve um fluxo assíncrono: o contribuinte envia JSON, recebe imediatamente um `requestID`, o documento entra numa fila e o software consulta posteriormente o resultado; callbacks são indicados como disponibilidade futura [1]. A mesma documentação enquadra a comunicação como destinada a softwares certificados e utiliza mecanismos de assinatura digital JWS e controlo de séries [1].

| Dependência AGT | Situação |
|---|---|
| Endpoint oficial de produção/teste | Ainda não fornecido/activado |
| Credenciais e chaves | Ainda não fornecidas |
| Identificador ou número de validação | Ainda não fornecido |
| Códigos oficiais de resposta | Devem ser confirmados no ambiente autorizado |
| Critérios de homologação | Dependem da AGT |
| Certificação formal | Só pode ser declarada pela AGT |
| Submissão real | Deve permanecer bloqueada até autorização |
| SAF-T local | Preparado e validado estruturalmente; não equivale a aceitação AGT |

**Custo:** não foi encontrada na documentação pública consultada uma tabela oficial que permita afirmar um preço de homologação, credencial ou certificação AGT. Portanto, não deve ser comunicado ao cliente um valor inventado. O valor será confirmado directamente com a AGT ou com o canal oficial autorizado.

## 5. Integração bancária

A Tesouraria interna está implementada sem depender de banco externo. Inclui preparação de pagamentos, aprovação, execução interna, comprovativo, transferências entre contas, extractos, hash, idempotência e reconciliação. A integração bancária real exige uma decisão de fornecedor e dados que ainda não existem no projecto.

| Elemento necessário | Por que é necessário |
|---|---|
| Banco ou bancos alvo | Cada instituição pode ter API, ficheiro ou canal diferente |
| Endpoint e documentação | Define autenticação, consulta, pagamento e estados |
| Credenciais de teste | Permitem homologação sem movimentar produção |
| Certificados ou chaves | Podem ser exigidos para autenticação mútua |
| Formato de extracto | OFX, MT940, ISO 20022 ou formato proprietário |
| Aprovação jurídica/financeira | Autoriza comunicação e execução de pagamentos |
| Testes de reconciliação | Confirmam idempotência, reversão e divergências |

**Custo:** não é possível dar um preço real sem saber o banco e o produto contratado. A alternativa gratuita é continuar com importação manual de extractos e exportação de ficheiros, que já é suportada. A API bancária, pagamentos automáticos e certificados podem ter custos do banco ou do integrador.

## 6. Assinatura de código e avisos do Windows

### 6.1. O que a assinatura resolve

A assinatura de código permite ao Windows verificar a identidade do editor e detectar alteração posterior do binário. Um certificado OV pode apresentar o nome verificado da organização e remover o aviso genérico de editor desconhecido, conforme a oferta publicada pela SSL.com [4].

### 6.2. O que a assinatura não resolve

A assinatura não é uma certificação de segurança absoluta, não substitui antivírus, não prova certificação AGT e não garante que o SmartScreen nunca apresente aviso. A própria documentação da Microsoft afirma que a reputação se constrói com o tempo e que os ficheiros novos podem apresentar avisos mesmo estando assinados [2].

### 6.3. Opções reais para Windows

| Opção | Custo publicado | Adequação |
|---|---:|---|
| Microsoft Store com MSIX | Assinatura da Store indicada como gratuita | Melhor alternativa para distribuição pela Store; não é o mesmo que entregar MSI/EXE directo |
| Azure Artifact Signing Basic | 9,99 USD/mês, até 5.000 assinaturas/mês; 0,005 USD por assinatura adicional | Serviço oficial Microsoft; disponibilidade geográfica e validação de identidade devem ser confirmadas |
| Azure Artifact Signing Premium | 99,99 USD/mês, até 100.000 assinaturas/mês; 0,005 USD adicional | Equipas com grande volume; provavelmente excessivo para o início |
| Certificado OV tradicional | Cerca de 150–300 USD/ano como faixa indicada pela documentação Microsoft; fornecedores variam | Opção tradicional para distribuição fora da Store |
| SSL.com OV consultado | 129 USD/ano na página consultada; armazenamento físico pode acrescentar 379 USD | Preço publicado específico, sujeito a validação, região e impostos |
| Certificado EV | Normalmente 400 USD/ano ou mais | Não é recomendado apenas para evitar SmartScreen; a vantagem de bypass imediato foi removida |
| Autoassinado | Gratuito | Apenas desenvolvimento ou rede interna gerida; inadequado para clientes públicos |
| SignPath Foundation | Gratuito apenas para projectos open source elegíveis | Não é uma opção garantida para software comercial fechado |

A Microsoft indica que o Azure Artifact Signing é recomendado para distribuição fora da Store, custa aproximadamente 9,99 USD/mês no plano básico, requer validação de identidade e tem limitações geográficas [2] [3]. A Microsoft também indica que MSIX distribuído pela Microsoft Store pode ser assinado pela própria Store sem compra de certificado, enquanto um MSI/EXE enviado pela Store continua a exigir assinatura do editor [2].

A SSL.com publica uma opção OV de 129 USD/ano no momento da consulta e apresenta opções adicionais de armazenamento de chave, incluindo token físico YubiKey por 379 USD [4]. Estes valores não devem ser confundidos com uma cotação universal nem com um valor de 19 USD.

### 6.4. Avaliação do valor de 19 USD

Não encontrei nas fontes oficiais consultadas uma base para afirmar que **19 USD** seja o preço de um certificado público de assinatura de código adequado ao BALANCERTS.ERP. O valor de 19 USD pode corresponder a outra taxa, promoção, domínio, serviço ou plano específico, mas não deve ser apresentado ao cliente como “o certificado obrigatório” sem factura, fornecedor, tipo de certificado, validade, entidade emitente e compatibilidade Authenticode confirmados.

### 6.5. Recomendação prática Windows

Para uma primeira distribuição comercial, existem duas rotas realistas. A rota de custo mais previsível é publicar um MSIX através da Microsoft Store, aceitando as regras e comissões da Store. A rota de distribuição directa é usar Azure Artifact Signing Basic, se a entidade e a região forem elegíveis, ou adquirir um certificado OV de uma CA reconhecida. Em ambos os casos, o instalador deve ser assinado no pipeline, receber timestamp, ser testado num Windows limpo e manter a mesma identidade legal do editor.

## 7. Assinatura e notarização macOS

Para distribuição de aplicações macOS a clientes, a Apple Developer Program é a via oficial para Developer ID e notarização. A página oficial da Apple publica a adesão de **99 USD por ano**, em moeda local quando disponível, e inclui Notarization e Developer ID para aplicações Mac [5].

O desenvolvimento e testes básicos podem ser feitos com Apple Account sem adesão, mas a distribuição profissional exige o programa. Para uma empresa, a inscrição deve ser feita em nome da entidade legal, podendo exigir D-U-N-S e verificação institucional [5].

O trabalho pendente do lado macOS é: conta empresarial Apple Developer, certificados Developer ID Application e Installer, credenciais de notarização, build num macOS real, assinatura do app, criação DMG/PKG, submissão à notarização, validação do ticket e teste de instalação num Mac limpo.

## 8. Integrações gratuitas ou de baixo custo

| Integração | Alternativa gratuita/baixo custo | Limitação |
|---|---|---|
| IA local | Ollama e modelos locais | Exige computador com recursos adequados; qualidade depende do modelo |
| PDF | Geração local já integrada | Não é certificação fiscal por si só |
| CSV/XLSX | Bibliotecas já integradas no projecto | Não substitui validação do cliente sobre os dados exportados |
| SAF-T | Builder e validação XSD local | Não substitui homologação AGT |
| Banco | Importação manual de extractos e reconciliação interna | Não executa pagamentos automaticamente |
| Windows | MSIX pela Microsoft Store | Depende de conta, revisão e regras da Store |
| Windows interno | Certificado autoassinado | Só funciona depois de instalar confiança nos equipamentos geridos |
| macOS desenvolvimento | Apple Account e Xcode | Não serve para distribuição comercial notarizada |
| CI/CD | GitHub Actions ou outro executor gratuito dentro das quotas aplicáveis | Minutos, armazenamento e runners têm limites do fornecedor |
| Armazenamento | S3/armazenamento já preparado na arquitectura | Pode gerar custos por volume, pedidos e transferência |

“Gratuito” significa sem preço de licença directa, não necessariamente sem custo total. Hardware, alojamento, armazenamento, largura de banda, manutenção, domínio, suporte, validação empresarial e tempo de operação continuam a ter custo.

## 9. Plano final por prioridade

### P0 — necessário antes de declarar aceitação operacional

Primeiro, criar os dados reais mínimos da Repair Lubatec e executar o teste RH com alteração em massa, confirmação, desfazer e auditoria. Depois, criar uma folha real aprovada e executar o fluxo RH → Contabilidade → Auditoria sem posting automático não autorizado. Em paralelo, fornecer o logótipo oficial e testar o ficheiro real anonimizado da equipa.

### P1 — necessário antes da distribuição comercial

Escolher a estratégia Windows: Microsoft Store/MSIX ou distribuição directa com Azure Artifact Signing/OV. Criar conta Apple Developer se DMG/macOS for realmente necessário no primeiro lançamento. Empacotar, assinar, testar instalação, actualização e desinstalação e preparar notas de versão, checksum e canal de actualização.

### P2 — necessário para integrações externas

Escolher banco ou bancos alvo, obter documentação e credenciais de sandbox, configurar certificados, testar pagamentos e extractos, e somente depois activar comunicação. Para AGT, solicitar endpoint, chaves, requestID, ambiente, códigos e homologação pelos canais oficiais; não activar submissão real apenas por existir um builder local.

## 10. Estimativa de custos externos conhecidos

| Item | Mínimo possível identificado | Custo mais provável para distribuição profissional |
|---|---:|---:|
| Windows via MSIX Store | 0 USD de certificado da Store | Taxas comerciais e conta da Store podem aplicar-se |
| Azure Artifact Signing Basic | 9,99 USD/mês | Cerca de 119,88 USD/ano antes de impostos e extras |
| OV tradicional | Cerca de 129 USD/ano em exemplo publicado; Microsoft indica 150–300 USD/ano como faixa típica | 150–300 USD/ano, mais token/HSM se exigido |
| EV | 400 USD/ano ou mais | Não recomendado apenas por SmartScreen |
| Apple Developer | 99 USD/ano | 99 USD/ano, mais equipamento Mac e custos de build |
| AGT | Sem preço público confirmado nas fontes consultadas | Confirmar directamente com AGT/entidade autorizada |
| Banco | Não determinável sem banco | Contrato, API, certificados ou taxas bancárias específicas |
| Ollama/local IA | 0 USD de licença | Hardware, electricidade e manutenção |

**Cenário mínimo de distribuição:** Windows através da Store/MSIX e macOS através de Apple Developer implicaria, como referências de licença, 99 USD/ano para Apple mais eventuais custos da Store, sem contar desenvolvimento e publicação. **Cenário de distribuição directa:** Azure Artifact Signing Basic mais Apple Developer representa aproximadamente 218,88 USD/ano antes de impostos e custos de infraestrutura, se a entidade for elegível para Azure Artifact Signing. Um OV tradicional pode alterar esse total.

## 11. Conclusão factual

Para finalizar o BALANCERTS.ERP como produto comercial, não é necessário pagar uma taxa genérica de 19 USD sem identificar o fornecedor. O software precisa de uma decisão documentada sobre três coisas diferentes: **aceitação funcional interna**, **homologação/integridade fiscal AGT** e **confiança/distribuição do instalador**.

A assinatura recomendada para Windows é Azure Artifact Signing Basic, se a empresa for elegível, ou um certificado OV tradicional de uma autoridade reconhecida. Para macOS, a referência oficial é Apple Developer Program por 99 USD/ano. Para AGT, não deve ser afirmado qualquer preço ou certificação sem confirmação oficial. Para bancos, o custo só pode ser calculado depois de escolher as instituições.

O BALANCERTS.ERP está tecnicamente preparado para avançar. Os próximos dados concretos necessários são: duas tarefas RH reais, dados RH para uma folha de teste, logótipo oficial, ficheiro anonimizado da equipa, decisão de distribuição Windows/macOS, entidade legal do editor, escolha do fornecedor de assinatura, banco alvo e credenciais/endpoint AGT.

## Referências

[1]: https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/index.html "Portal do Parceiro AGT — Introdução à Facturação Electrónica"
[2]: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options "Microsoft Learn — Code signing options for Windows app developers"
[3]: https://azure.microsoft.com/en-us/pricing/details/artifact-signing/ "Microsoft Azure — Artifact Signing pricing"
[4]: https://www.ssl.com/products/software-integrity/code-signing/ov/ "SSL.com — OV Code Signing"
[5]: https://developer.apple.com/support/compare-memberships/ "Apple Developer — Choosing a Membership"
