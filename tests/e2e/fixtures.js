// Shared test setup: blocks requests to other sites and fails on errors from this site.
const base = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Odisseia and Compasso are commercial typefaces that live only on the server, not in the repository.
// A checkout without them shows the fallback fonts, so their 404 is expected and layout that depends on them is skipped.
const SITE_FONTS = /\/fonts\/(Compasso|Odisseia)(-Italic)?\.woff2$/;
exports.hasSiteFonts = fs.existsSync(path.join(__dirname, '..', '..', 'dist', 'fonts', 'Compasso.woff2'));

exports.test = base.test.extend({
  page: async ({ page, baseURL }, use) => {
    const errors = [];
    await page.route('**/*', route => (route.request().url().startsWith(baseURL) ? route.continue() : route.abort()));
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    page.on('console', message => {
      const url = message.location().url || '';
      if (message.type() === 'error' && url.startsWith(baseURL) && !SITE_FONTS.test(url)) errors.push(`console: ${message.text()}`);
    });
    await use(page);
    base.expect(errors, 'erros no console da página').toEqual([]);
  },
});
exports.expect = base.expect;

exports.PAGES = [
  { path: '/', lang: 'pt-BR', code: 'PT', h1: 'As línguas de sinais', fingers: 'Dedos', keyboard: 'No teclado' },
  { path: '/en.html', lang: 'en', code: 'EN', h1: 'Sign languages', fingers: 'Fingers', keyboard: 'On the keyboard' },
  { path: '/es.html', lang: 'es', code: 'ES', h1: 'Las lenguas de señas', fingers: 'Dedos', keyboard: 'En el teclado' },
];
