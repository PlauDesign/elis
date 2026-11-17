// Página "A história da ELiS": artigo para ler à parte, no mesmo site e no estilo do guia.
const { test, expect, hasSiteFonts } = require('./fixtures');
const { default: AxeBuilder } = require('@axe-core/playwright');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const STORY = [
  { path: '/historia.html', guide: '/', guideLink: './', lang: 'pt-BR', code: 'PT', h1: 'A história da ELiS', credits: 'Créditos' },
  { path: '/historia-en.html', guide: '/en.html', guideLink: 'en.html', lang: 'en', code: 'EN', h1: 'The story of ELiS', credits: 'Credits' },
  { path: '/historia-es.html', guide: '/es.html', guideLink: 'es.html', lang: 'es', code: 'ES', h1: 'La historia de ELiS', credits: 'Créditos' },
];

for (const s of STORY) {
  test(`${s.code}: o guia leva à história`, async ({ page }) => {
    await page.goto(s.guide);
    await page.locator(`.sidebar a[href="${s.path.slice(1)}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${s.path.replace('.', '\\.')}$`));
  });

  test(`${s.code}: a história fica de pé sozinha, no idioma da página @mobile`, async ({ page }) => {
    await page.goto(s.path);
    await expect(page.locator('html')).toHaveAttribute('lang', s.lang);
    await expect(page.locator('h1')).toHaveText(s.h1);
    await expect(page.locator('.lang-switch [aria-current=page]')).toHaveText(s.code);
    await expect(page.locator('.story-credits h2')).toHaveText(s.credits);
    await expect(page.locator('.sidebar .brand')).toHaveAttribute('href', s.guideLink);
    // Imagens carregam (o fixture também falha se alguma der 404).
    for (const img of await page.locator('.story img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth)).toBeGreaterThan(0);
    }
    const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test(`${s.code}: a história cabe em 320 px sem rolagem horizontal`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(s.path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
}

test('trocar de idioma na história abre a história no outro idioma', async ({ page }) => {
  await page.goto('/historia.html');
  await page.locator('.lang-switch a[hreflang=es]').click();
  await expect(page).toHaveURL(/\/historia-es\.html$/);
  await page.locator('.lang-switch a[hreflang=en]').click();
  await expect(page).toHaveURL(/\/historia-en\.html$/);
});

test('o olho e o intertítulo entre aspas penduram as aspas: a primeira letra alinha com o texto', async ({ page }) => {
  test.skip(!hasSiteFonts, 'O recuo é medido na Compasso, que não fica no repositório.');
  await page.goto('/historia.html');
  const hung = page.locator('.story-quote blockquote p, .story-text h2:text-matches("^“")');
  expect(await hung.count()).toBe(5);
  for (const p of await hung.all()) {
    const { letter, column, quote, size } = await p.evaluate(el => {
      const node = el.firstChild;
      const range = document.createRange();
      range.setStart(node, 0); range.setEnd(node, 1);
      const quote = range.getBoundingClientRect().left;
      range.setStart(node, 1); range.setEnd(node, 2);
      return { letter: range.getBoundingClientRect().left, column: el.closest('.story-text').getBoundingClientRect().left, quote, size: parseFloat(getComputedStyle(el).fontSize) };
    });
    expect(quote).toBeLessThan(column);
    // Tolerância de 5% do corpo: a renderização de texto varia um pouco entre sistemas.
    expect(Math.abs(letter - column)).toBeLessThan(size * 0.05);
  }
});
