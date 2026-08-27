# Evidência textual PGCA — 27/08/2026

O ficheiro `docs/normative-sources/pgc-angola-main-2025/docs/pgc.pdf` tem 78 páginas, não está cifrado e produziu 5 595 linhas de texto com `pdftotext -layout`. A introdução identifica as classes e a secção de contas inclui referências a Clientes, Fornecedores, Existências, Meios Monetários, Capital Próprio, Proveitos e Custos.

A extracção localiza secções de regras de movimentação a partir da linha 3 896 e referências explícitas às contas IVA 34.5 e 34.5.2 nas linhas 4 147–4 199 do texto extraído. Esta descoberta é evidência para análise e preparação de rascunhos, mas não é uma autorização de activação: cada conta e movimento deve ser associado a uma página legível, fonte persistida, vigência e aprovação humana.

O ficheiro não foi usado para alterar a base de dados, marcar contas como movimentáveis, criar regras activas ou promover a versão PGCA. A ausência de natureza explícita no envelope JSON continua a gerar revisão humana no validador estrutural.


A leitura das linhas 4 090–4 215 do texto extraído localiza a descrição das contas de fornecedores e do IVA. O trecho identifica a conta 34.5.2 como de natureza devedora e descreve débitos por IVA dedutível e créditos para transferência do saldo para 34.5.5.1/34.5.5.2; também inicia a descrição de 34.5.3 como conta de natureza credora para IVA liquidado. Estes trechos são candidatos a regras DRAFT_ONLY e precisam de confirmação visual da página 53/54 e da cadeia completa antes de qualquer aprovação.
