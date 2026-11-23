// Acessibilidade: auditoria automática (axe, WCAG 2.2 AA) nos estados principais
// e verificações que o axe não cobre (teclado, reflow, novas abas, vídeo).
const { test, expect, PAGES } = require('./fixtures');
const { default: AxeBuilder } = require('@axe-core/playwright');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const TEXTS = {
  'pt-BR': { skip: 'Pular para o conteúdo', newTab: '(abre em nova aba)', captions: 'pt-BR' },
  en: { skip: 'Skip to content', newTab: '(opens in a new tab)', captions: 'en' },
  es: { skip: 'Saltar al contenido', newTab: '(se abre en una pestaña nueva)', captions: 'es' },
};

async function violations(page) {
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return result.violations.map(v => `${v.id}: ${v.help} → ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
}

for (const p of PAGES) {
  const t = TEXTS[p.lang];

  test(`${p.code}: sem violações de acessibilidade na página inicial @mobile`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('#map-content button').first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test(`${p.code}: sem violações de acessibilidade com o diálogo e o corpo em uso`, async ({ page }) => {
    await page.goto(p.path);
    await page.locator('#map-content button').first().click();
    await expect(page.locator('#key-dialog')).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await page.locator('#anatomy-pins button').nth(3).click();
    await page.locator('[data-view="face"]').click();
    await page.locator('#sinal-play').click();
    expect(await violations(page)).toEqual([]);
  });

  test(`${p.code}: o primeiro Tab leva a um link para pular ao conteúdo`, async ({ page }) => {
    await page.goto(p.path);
    await page.keyboard.press('Tab');
    const skip = page.locator(':focus');
    await expect(skip).toHaveText(t.skip);
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test(`${p.code}: links que abrem nova aba avisam isso`, async ({ page }) => {
    await page.goto(p.path);
    const links = page.locator('a[target="_blank"]');
    expect(await links.count()).toBeGreaterThan(3);
    for (const link of await links.all()) {
      await expect(link).toHaveAccessibleName(new RegExp(`${t.newTab.replace(/[()]/g, '\\$&')}$`));
    }
  });

  test(`${p.code}: botões de idioma têm o nome do idioma`, async ({ page }) => {
    await page.goto(p.path);
    const names = await page.locator('.lang-switch a').evaluateAll(as => as.map(a => a.getAttribute('aria-label')));
    expect(names).toEqual(['PT, Português', 'EN, English', 'ES, Español']);
  });

  test(`${p.code}: o vídeo abre com legendas no idioma da página`, async ({ page }) => {
    await page.goto(p.path);
    const src = new URL(await page.locator('.intro-video iframe').getAttribute('src'));
    expect(src.searchParams.get('cc_load_policy')).toBe('1');
    expect(src.searchParams.get('cc_lang_pref')).toBe(t.captions);
    expect(src.searchParams.get('hl')).toBe(t.captions);
  });

  test(`${p.code}: cabe em 320 px sem rolagem horizontal, mesmo com espaçamento de texto ampliado`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(p.path);
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    // WCAG 1.4.12: entrelinha 1,5, letras 0,12em, palavras 0,16em, parágrafos 2em.
    await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
}

test('o vídeo mostra o foco do teclado', async ({ page }) => {
  await page.goto('/');
  const iframe = page.locator('.intro-video iframe');
  for (let i = 0; i < 30 && !(await iframe.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(iframe).toBeFocused();
  await expect(page.locator('.intro-video')).not.toHaveCSS('outline-style', 'none');
});
