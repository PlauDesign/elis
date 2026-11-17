# ELiS

Fonte tipográfica para a ELiS, a Escrita das Línguas de Sinais criada por Mariângela Estelita Barros, e o guia interativo publicado em [elis-libras.com.br](https://elis-libras.com.br).

A fonte é desenhada pela [Plau](https://plau.design) e distribuída sob a SIL Open Font License 1.1.

## A fonte

- `dist/fonts/`: ELiS26 em WOFF2, para sites (Regular, Bold, Italic e BoldItalic).
- `dist/downloads/`: pacotes com os TTF para Mac e Windows, os WOFF2 e o guia de uso.

Você pode usar, estudar, modificar e redistribuir a fonte, inclusive em projetos comerciais, nos termos de [OFL.txt](OFL.txt). Versões modificadas não podem usar o nome reservado "ELiS".

## O site

Site estático, sem build de front-end. O que é publicado fica em `dist/`.

```bash
npm install
npx playwright install chromium
npm test
```

Use Node 20 ou mais novo. `npm run build` regenera as páginas em inglês e espanhol depois de mudar `dist/index.html` ou `i18n/strings.json`.

### Odisseia e Compasso

O site é composto em Odisseia e Compasso, fontes comerciais da Plau. Elas não fazem parte deste repositório nem da licença aberta: ficam só no servidor do site. Em uma cópia local, o site aparece com as fontes de reserva do sistema, e os testes levam isso em conta.

## Licença

A OFL em [OFL.txt](OFL.txt) vale para os arquivos da fonte ELiS. Os textos, as imagens e o código do site são © Plau.
