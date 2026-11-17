# Guia da fonte ELiS

Site estático, sem build de front-end. O que é publicado fica em `dist/`.
A página principal é `dist/index.html`, em português. `dist/en.html` e `dist/es.html` são geradas por `i18n/build.py` e não devem ser editadas à mão.
A página `dist/historia.html` traz o artigo sobre a história da ELiS, com estilo próprio em `dist/historia.css`. `dist/historia-en.html` e `dist/historia-es.html` são geradas do mesmo jeito.

## Fluxo de trabalho (TDD)

1. Antes de mudar o comportamento do site, escreva ou ajuste um teste que descreva o resultado esperado e confirme que ele falha.
2. Faça a mudança mínima para o teste passar.
3. Rode a suíte completa antes de commitar: `npm test`.

## Comandos

- `npm test`: roda tudo (gerador de traduções e testes de navegador).
- `npm run test:build`: confere se `en.html` e `es.html` estão atualizados e roda os testes de `i18n/build.py`.
- `npm run test:e2e`: testes de navegador com Playwright, em `tests/e2e/`.
- `npm run build`: regenera `en.html` e `es.html` depois de mudar `dist/index.html` ou `i18n/strings.json`.

Use Node 20 ou mais novo (veja `.nvmrc`). Na primeira vez: `npm install` e `npx playwright install chromium`.

## Traduções

- Textos da página: `i18n/strings.json`, do português para inglês e espanhol. O build falha se um texto novo ficar sem tradução.
- Textos criados pelos scripts: `dist/i18n.js`. Nos scripts, envolva o texto em português com `T('...')`.

## Repositório público e fontes

Este repositório é público. A fonte ELiS é distribuída sob a OFL (`OFL.txt`, igual a `dist/downloads/OFL.txt`).

Odisseia e Compasso são fontes comerciais da Plau e não podem entrar no repositório, nem no histórico. Os quatro arquivos (`dist/fonts/Compasso*.woff2` e `dist/fonts/Odisseia*.woff2`) estão no `.gitignore`. `tests/build/test_repo.py` falha se alguma fonte que não seja a ELiS for rastreada pelo git.

Sem esses arquivos (no CI ou em um clone novo), o site usa as fontes de reserva e os testes de navegador ignoram o 404 deles; o teste das aspas penduradas, que mede a Compasso, é pulado.

## CI e deploy

O GitHub Actions (`.github/workflows/ci.yml`) roda `npm test` em todo PR e em todo push para `main`.

Depois que um PR é mesclado, o push para `main` roda os testes e, se passarem, publica `dist/` em elis-libras.com.br com rsync por SSH. O deploy só adiciona ou atualiza arquivos; nada é apagado no servidor. Se os testes falharem, nada é publicado.

O deploy usa estes segredos do repositório: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` e `DEPLOY_KNOWN_HOSTS`. A chave pública correspondente fica no `authorized_keys` do servidor, restrita com `rrsync` à pasta do site, então ela não abre um shell nem escreve fora dessa pasta.
