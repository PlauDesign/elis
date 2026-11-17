const { test, expect } = require('./fixtures');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('mostra em ELiS o que é digitado', async ({ page }) => {
  await page.locator('#input').fill('qg');
  await expect(page.locator('#preview')).toHaveText('qg');
  await expect(page.locator('#char-count')).toHaveText('2 caracteres');
});

test('botões B e I alternam negrito e itálico', async ({ page }) => {
  const bold = page.locator('#bold-toggle');
  const italic = page.locator('#italic-toggle');
  const footer = page.locator('.lab-footer span').last();

  await bold.click();
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#preview')).toHaveCSS('font-weight', '700');
  await expect(footer).toHaveText('Negrito · ELiS');

  await italic.click();
  await expect(footer).toHaveText('Negrito e itálico · ELiS');
  await expect(page.locator('#preview')).toHaveCSS('font-style', 'italic');

  await bold.click();
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
  await expect(footer).toHaveText('Itálico · ELiS');
});

test('atalhos de teclado ligam negrito e itálico no campo', async ({ page }) => {
  await page.locator('#input').focus();
  await page.keyboard.press('ControlOrMeta+b');
  await expect(page.locator('#bold-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ControlOrMeta+i');
  await expect(page.locator('#italic-toggle')).toHaveAttribute('aria-pressed', 'true');
});

test('restaurar exemplo volta o texto e o estilo iniciais', async ({ page }) => {
  await page.locator('#input').fill('abc');
  await page.locator('#bold-toggle').click();
  await page.locator('#reset').click();
  await expect(page.locator('#input')).toHaveValue('qgçQà');
  await expect(page.locator('#bold-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#toast')).toHaveText('Exemplo restaurado');
});
