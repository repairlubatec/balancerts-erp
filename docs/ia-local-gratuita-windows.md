# Teste de IA gratuita local no Windows

O BALANCERTS.ERP pode testar Balancerts IA através de um provider local compatível com Ollama. Esta modalidade não exige uma chave de API paga e mantém o ERP operacional quando o serviço local está desligado.

## Preparação

Instale o Ollama no computador Windows e descarregue um modelo local. Para o teste inicial, use um modelo leve compatível com o hardware disponível, como `qwen2.5:3b`.

```powershell
ollama pull qwen2.5:3b
ollama serve
```

O serviço local deve ficar acessível em `http://127.0.0.1:11434`. Se o instalador já tiver iniciado o serviço, não é necessário executar `ollama serve` novamente.

## Configuração no ERP

Abra **Sistema → Balancerts IA**, seleccione a empresa activa, mantenha **Activar Balancerts IA** e **Activar IA local** activos, indique `http://127.0.0.1` no endereço, `11434` na porta e `qwen2.5:3b` no modelo. Prima **Guardar configuração** e depois **Testar IA local**.

O posto regista o resultado do teste no histórico. Uma indisponibilidade local não bloqueia facturação, contabilidade, tesouraria ou stock.

## Segurança funcional

A IA local recebe apenas o pedido autorizado pelo fluxo do ERP. As sugestões de classificação e preenchimento permanecem propostas; uma pessoa deve rever e aprovar ou rejeitar cada sugestão. Nenhuma sugestão aprovada altera automaticamente documentos, impostos, lançamentos ou movimentos.

Azure e OpenAI permanecem desactivados nesta fase. Podem ser configurados mais tarde, quando existirem credenciais, autorização e critérios de homologação.

## Revisão visual

A rota Balancerts IA foi revista no shell desktop. O diagnóstico apresenta correctamente o estado indisponível quando Ollama não está instalado no ambiente de teste, os comandos em linhas separadas, os botões para copiar e testar novamente e a configuração local sem abrir janelas do navegador.
