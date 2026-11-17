const { test, expect, PAGES } = require('./fixtures');

for (const p of PAGES) {
  test(`${p.code}: página e textos dos scripts no idioma certo`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('html')).toHaveAttribute('lang', p.lang);
    await expect(page.locator('h1')).toContainText(p.h1);
    await expect(page.locator('.lang-switch [aria-current=page]')).toHaveText(p.code);
    await expect(page.locator('.category-nav [data-category=dedos]')).toHaveText(p.fingers);
    await expect(page.locator('.category-nav [data-category=complementares]')).toBeVisible();
    await page.locator('#map-content .glyph-card').first().click();
    await expect(page.locator('#key-instructions h3').first()).toHaveText(p.keyboard);
  });
}

test('trocar de idioma abre a outra página no topo, sem âncora', async ({ page }) => {
  await page.goto('/#mapa');
  await page.locator('.lang-switch a[hreflang=en]').click();
  await expect(page).toHaveURL(/\/en\.html$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
