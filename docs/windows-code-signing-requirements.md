# BALANCERTS.ERP — Requisitos de assinatura Windows

## Identidade legal

O produto é **BALANCERTS.ERP**, criado pela **Repair Lubatec**. O instalador deve manter esta identidade no `productName`, no copyright e nos atalhos.

## Certificado exigido

A distribuição comercial Windows deve utilizar um certificado de assinatura de código válido, normalmente em formato `.p12` ou `.pfx`, emitido por uma entidade certificadora reconhecida. O certificado deve incluir a chave privada e estar dentro do prazo de validade.

O processo seguro recebe o certificado através de `CSC_LINK` e a palavra-passe exclusivamente através de `CSC_KEY_PASSWORD`. Estes valores não devem ser gravados no repositório, no código, em ficheiros `.env` versionados, nem enviados para o chat.

## Validação no sandbox

Sem `CSC_LINK` e `CSC_KEY_PASSWORD`, o script `scripts/build-windows-signed.mjs` termina com código 2 e não inicia o empacotamento. Esta validação foi executada com sucesso. O sandbox Linux pode validar configuração, identidade, compilação e pacote de directório, mas não substitui a geração nativa de NSIS/MSI num executor Windows.

## Execução autorizada

A compilação final deve ocorrer num executor Windows com uma URL HTTPS estável de produção e com os segredos injectados pelo gestor seguro. Os destinos configurados são NSIS/EXE e MSI x64. A assinatura deve ser verificada antes de distribuir o instalador e deve ser acompanhada de uma política de renovação do certificado.

## Situação actual

A configuração técnica e o bloqueio seguro por ausência de certificado estão preparados. A emissão do instalador comercial assinado permanece pendente da disponibilização segura do certificado e da respectiva palavra-passe; nenhum segredo foi solicitado ou exposto nesta etapa.
