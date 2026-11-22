const { test, expect } = require('./fixtures');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.category-nav [data-category=complementares]')).toBeVisible();
});

test('mostra os nove filtros de grupo', async ({ page }) => {
  await expect(page.locator('.category-nav button')).toHaveText([
    'Todos', 'Dedos', 'Palma', 'Ponto de articulação', 'Tipo de movimento', 'Diacríticos', 'Pontuação', 'Números', 'Complementares',
  ]);
});

test('a busca por tecla diferencia maiúsculas de minúsculas', async ({ page }) => {
  const search = page.locator('#map-search');
  const keys = page.locator('#map-content .glyph-card kbd');
  await search.fill('q');
  await expect(keys).toHaveText(['q']);
  await search.fill('Q');
  await expect(keys).toHaveText(['Q']);
});

test('a busca por nome encontra a região do corpo', async ({ page }) => {
  await page.locator('#map-search').fill('testa');
  await expect(page.locator('#map-content .glyph-card kbd')).toHaveText(['T']);
});

test('o cartão abre os detalhes e insere a tecla no laboratório', async ({ page }) => {
  await page.locator('#input').fill('');
  await page.locator('#map-content .glyph-card').first().click();
  const dialog = page.locator('#key-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#key-dialog-title')).toHaveText('Fechado');
  await page.locator('#key-insert').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#input')).toHaveValue('q');
});

test('o filtro Todos mostra os 404 glifos da fonte', async ({ page }) => {
  await page.locator('.category-nav [data-category=todos]').click();
  await expect(page.locator('#map-content .catalog-card')).toHaveCount(404);
});
