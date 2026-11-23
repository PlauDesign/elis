// No celular, o menu fica preso ao topo enquanto a página rola.
const { test, expect } = require('./fixtures');

for (const pagina of ['/', '/historia.html']) {
  test(`o menu de ${pagina} continua no topo depois de rolar @mobile`, async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'comportamento só do celular');
    await page.goto(pagina);
    const menu = page.locator('.sidebar');
    await page.evaluate(() => window.scrollTo(0, 2400));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(2000);
    const box = await menu.boundingBox();
    expect(Math.round(box.y)).toBe(0);
    await expect(menu.locator('nav a').first()).toBeInViewport();
    // Compacto: não toma mais que uma faixa fina da tela.
    expect(box.height).toBeLessThanOrEqual(64);
    // Sem rolagem horizontal na página.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test('os links do menu param abaixo da barra fixa, sem esconder o título @mobile', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'comportamento só do celular');
  await page.goto('/');
  await page.locator('.sidebar nav a[href="#mapa"]').click();
  const topo = await page.locator('#mapa').evaluate(el => el.getBoundingClientRect().top);
  const barra = (await page.locator('.sidebar').boundingBox()).height;
  expect(topo).toBeGreaterThanOrEqual(barra - 1);
});
