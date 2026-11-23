// Favicon e manequim acompanham a paleta vermelha do site.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('./fixtures');

for (const page of ['/', '/en.html', '/es.html', '/historia.html', '/sinal.html']) {
  test(`o favicon de ${page} usa o vermelho da paleta`, async ({ page: p }) => {
    await p.goto(page);
    const href = decodeURIComponent(await p.locator('link[rel="icon"]').getAttribute('href'));
    expect(href).toContain("fill='#d60027'");
    expect(href).not.toContain('#094043');
  });
}

test('o manequim tem fundo transparente e não usa mais o verde antigo', async ({ page }) => {
  await page.goto('/');
  const src = await page.locator('#corpo img').first().getAttribute('src');
  await expect(page.locator('.anatomy-stage')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(src).toMatch(/elis-anatomy-locator\.png\?v=\w+/);
  const png = fs.readFileSync(path.join(__dirname, '../../dist/assets/elis-anatomy-locator.png'));
  expect(png[25]).toBe(6); // tipo de cor 6: RGBA
  const cantos = await page.evaluate(async (url) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const corpo = ctx.getImageData(512, 400, 1, 1).data;
    return { canto: ctx.getImageData(4, 4, 1, 1).data[3], corpo: [...corpo] };
  }, src);
  expect(cantos.canto).toBe(0);
  const [r, g, b] = cantos.corpo;
  expect(g).toBeLessThanOrEqual(r); // o recheio não é mais esverdeado
});
