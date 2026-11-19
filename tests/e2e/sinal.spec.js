// Página "Sinal em 3D": um boneco executa o sinal BONITO ao lado da escrita em ELiS.
// É um estudo em português, para revisão linguística; ainda não tem versões em inglês e espanhol.
const { test, expect } = require('./fixtures');
const { default: AxeBuilder } = require('@axe-core/playwright');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

test.beforeEach(async ({ page }) => {
  await page.goto('/sinal.html');
});

test('abre com o boneco desenhado e a mão aberta diante do rosto @mobile', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('BONITO');
  const stage = page.locator('#sinal-stage');
  await expect(stage).toHaveAttribute('data-render', 'webgl');
  await expect(stage).toHaveAttribute('data-mao', 'aberta');
  await expect(page.locator('#sinal-canvas')).toHaveAccessibleName(/BONITO/);
  await expect(page.locator('#sinal-percent')).toHaveText('0%');
  // O quadro não fica em branco: há pixels do boneco além da cor de fundo.
  const colors = await page.locator('#sinal-canvas').evaluate(canvas => {
    const copy = document.createElement('canvas');
    copy.width = 48; copy.height = 48;
    const ctx = copy.getContext('2d');
    ctx.drawImage(canvas, 0, 0, 48, 48);
    const data = ctx.getImageData(0, 0, 48, 48).data;
    const seen = new Set();
    for (let i = 0; i < data.length; i += 4) seen.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
    return seen.size;
  });
  expect(colors).toBeGreaterThan(8);
});

test('cada grupo da escrita mostra a sua leitura', async ({ page }) => {
  const tabs = page.locator('.sinal-tabs button');
  await expect(tabs).toHaveText(['Dedos', 'Palma', 'Local', 'Movimento']);
  await expect(page.locator('#sinal-leitura')).toContainText('polegar');
  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-pressed', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#sinal-leitura')).toContainText('um a um');
  await expect(page.locator('.sinal-word [data-part="3"]')).toHaveClass(/active/);
  await expect(page.locator('.sinal-word [data-part="0"]')).not.toHaveClass(/active/);
});

test('o percurso leva a mão aberta até a mão fechada', async ({ page }) => {
  const stage = page.locator('#sinal-stage');
  const range = page.locator('#sinal-progress');
  await range.fill('50');
  await expect(page.locator('#sinal-percent')).toHaveText('50%');
  await expect(stage).toHaveAttribute('data-mao', 'fechando');
  await range.fill('100');
  await expect(page.locator('#sinal-percent')).toHaveText('100%');
  await expect(stage).toHaveAttribute('data-mao', 'fechada');
});

test('reproduzir executa o sinal até o fim e reiniciar volta ao começo', async ({ page }) => {
  const play = page.locator('#sinal-play');
  // Em 0,5× o sinal leva 4 s: dá tempo de ver o botão em "Pausar" mesmo com o WebGL por software dos testes.
  await page.locator('#sinal-speed').selectOption('0.5');
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await expect(play).toHaveText('Pausar');
  await page.locator('#sinal-speed').selectOption('2');
  await expect(page.locator('#sinal-percent')).toHaveText('100%', { timeout: 20000 });
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await expect(play).toHaveText('Reproduzir');
  await page.locator('#sinal-restart').click();
  await expect(page.locator('#sinal-percent')).toHaveText('0%');
  await expect(page.locator('#sinal-stage')).toHaveAttribute('data-mao', 'aberta');
});

test('as vistas trocam a câmera', async ({ page }) => {
  const stage = page.locator('#sinal-stage');
  await expect(stage).toHaveAttribute('data-vista', 'frente');
  await page.locator('[data-vista-alvo="perfil"]').click();
  await expect(stage).toHaveAttribute('data-vista', 'perfil');
  await expect(page.locator('[data-vista-alvo="perfil"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-vista-alvo="mao"]').click();
  await expect(stage).toHaveAttribute('data-vista', 'mao');
});

test('o teclado gira o boneco', async ({ page }) => {
  const canvas = page.locator('#sinal-canvas');
  await canvas.focus();
  const before = await page.locator('#sinal-stage').getAttribute('data-giro');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#sinal-stage')).not.toHaveAttribute('data-giro', before);
});

test('sem violações de acessibilidade @mobile', async ({ page }) => {
  await expect(page.locator('#sinal-stage')).toHaveAttribute('data-render', 'webgl');
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

test('cabe em 320 px sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/sinal.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('a página é um estudo: fica fora dos buscadores e cita as referências', async ({ page }) => {
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.sinal-note')).toContainText('Barros (2016)');
  await expect(page.locator('.sinal-note a[href*="youtube.com/watch?v=jfLON6uUpjY"]')).toBeVisible();
});

// O mesmo boneco aparece no guia, na seção que lê a palavra BONITO, nos três idiomas.
const GUIDE = [
  { path: '/', code: 'PT', play: 'Reproduzir sinal', pause: 'Pausar sinal', front: 'Frente' },
  { path: '/en.html', code: 'EN', play: 'Play sign', pause: 'Pause sign', front: 'Front' },
  { path: '/es.html', code: 'ES', play: 'Reproducir seña', pause: 'Pausar seña', front: 'Frente' },
];
const loadedThree = page => page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('three.module')));

for (const g of GUIDE) {
  test(`${g.code}: o guia mostra o boneco ao lado da leitura de BONITO`, async ({ page }) => {
    await page.goto(g.path);
    const stage = page.locator('.word-motion #sinal-stage');
    // O three.js só é baixado quando a seção se aproxima da tela.
    expect(await loadedThree(page)).toBe(false);
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute('data-render', 'webgl');
    await expect(page.locator('#sinal-canvas')).toHaveAccessibleName(/BONITO/);
    await expect(page.locator('#sinal-play')).toHaveText(g.play);
    await expect(page.locator('[data-vista-alvo="frente"]')).toHaveText(g.front);
    await page.locator('#sinal-speed').selectOption('0.5');
    await page.locator('#sinal-play').click();
    await expect(page.locator('#sinal-play')).toHaveText(g.pause);
  });
}

test('no guia, a etapa Movimento executa o sinal no boneco e as outras voltam à mão aberta', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('.word-motion #sinal-stage');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-render', 'webgl');
  await page.locator('.motion-tabs [data-step="3"]').click();
  await expect(stage).toHaveAttribute('data-mao', 'fechada', { timeout: 20000 });
  await page.locator('.motion-tabs [data-step="0"]').click();
  await expect(stage).toHaveAttribute('data-mao', 'aberta');
  await expect(page.locator('.word-motion .caption')).toContainText('estudo de movimento');
});

test('o guia com o boneco em uso não tem violações de acessibilidade @mobile', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('.word-motion #sinal-stage');
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveAttribute('data-render', 'webgl');
  const result = await new AxeBuilder({ page }).include('.word-motion').withTags(TAGS).analyze();
  expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
