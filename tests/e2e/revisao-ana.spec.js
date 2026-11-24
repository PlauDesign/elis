// Revisão de Ana Laura Ferraz (Figma "Revisão Site elis-libras.com.br", novembro de 2026):
// textos mais didáticos e uma nova ordem de seções no guia.
const { test, expect } = require('./fixtures');

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('as seções seguem a nova ordem: grupos, corpo, mapa, recursos e laboratório', async ({ page }) => {
  const ids = await page.locator('main > section[id]').evaluateAll(list => list.map(s => s.id));
  expect(ids).toEqual(['grupos', 'corpo', 'mapa', 'recursos', 'experimentar', 'baixar', 'duvidas']);
  const nav = page.locator('.sidebar nav a');
  expect(await nav.evaluateAll(list => list.map(a => a.getAttribute('href')))).toEqual(
    ['#grupos', '#corpo', '#mapa', '#recursos', '#experimentar', '#baixar', '#mariangela', 'historia.html']);
});

test('a introdução explica os visografemas e leva ao download', async ({ page }) => {
  const intro = page.locator('.intro');
  await expect(intro).toContainText('A fonte ELiS permite representar graficamente os sinais das línguas de sinais por meio de símbolos chamados visografemas.');
  await expect(intro).toContainText('96 visografemas básicos organizados em quatro grupos');
  await expect(intro).toContainText('Neste site, você poderá conhecer melhor o projeto');
  const cta = intro.locator('a.intro-download');
  await expect(cta).toHaveText('Baixar a ELiS');
  await expect(cta).toHaveAttribute('href', '#baixar');
  await expect(intro.locator('.groups')).toHaveCount(0);
});

test('a seção dos grupos lista os quatro grupos, com "tipo de movimento"', async ({ page }) => {
  const grupos = page.locator('#grupos');
  await expect(grupos.locator('h2')).toHaveText('Os grupos de visografemas.');
  await expect(grupos.locator('.groups-list > li h3')).toHaveText(
    ['Configuração dos dedos', 'Orientação da palma', 'Ponto de articulação', 'Tipo de movimento']);
  // Como no site no ar: quatro colunas, cada uma com o número do grupo em destaque.
  await expect(grupos.locator('.groups-list > li .group-num')).toHaveText(['01', '02', '03', '04']);
  // Os números usam a Compasso condensada dos títulos, não a fonte monoespaçada.
  const numero = await grupos.locator('.group-num').first().evaluate(el => { const c = getComputedStyle(el); return [c.fontFamily, c.fontWeight]; });
  expect(numero[0]).toMatch(/^["']?Compasso/);
  expect(numero[1]).toBe('700');
  const colunas = await grupos.locator('.groups-list').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(colunas).toBe(test.info().project.name === 'mobile' ? 2 : 4);
  await expect(grupos).toContainText('chamado visografema');
});

test('BONITO aparece primeiro em Libras, com um só botão de play, e depois em ELiS, com cada visografema explicado', async ({ page }) => {
  const exemplo = page.locator('#grupos .word-motion');
  await expect(exemplo.locator('h4')).toHaveText(['BONITO, em Libras', 'BONITO, em ELiS']);
  await expect(exemplo.locator('#sinal-play')).toHaveText('Reproduzir sinal');
  for (const removido of ['#motion-play', '#motion-insert', '#sinal-restart', '#sinal-speed', '#sinal-progress', '.motion-tabs'])
    await expect(page.locator(removido)).toHaveCount(0);
  await expect(exemplo.locator('.bonito-parts > li')).toHaveText([
    /Dedos.*Polegar na posição horizontal/, /Dedos.*Demais dedos estendidos/, /Palma.*Palma da mão para trás/,
    /Ponto de articulação.*Rosto/, /Tipo de movimento.*Tamborilar de dedos/]);
  await expect(exemplo.locator('.motion-word [data-part]')).toHaveText(['t', 'g', 'ç', 'Q', 'Ä']);
  await expect(page.locator('.anatomy-learning')).toHaveCount(0);
});

test('o corpo mostra onde o sinal é realizado, sem as opções de contato', async ({ page }) => {
  const corpo = page.locator('#corpo');
  await expect(corpo.locator('h2')).toHaveText('Onde o sinal é realizado.');
  await expect(corpo.locator('.anatomy-result')).toContainText('Digite H para escrever o visografema de pescoço');
  for (const removido of ['.contact-options', '#contact-explanation', '#anatomy-caveat', '#anatomy-meaning'])
    await expect(corpo.locator(removido)).toHaveCount(0);
  await expect(corpo.locator('.anatomy-visual .caption')).toContainText('Os botões mostram os visografemas da região.');
});

test('o mapa de caracteres começa explicando os grupos e usa os nomes completos', async ({ page }) => {
  const mapa = page.locator('#mapa');
  await expect(mapa.locator('h2')).toHaveText('Mapa de caracteres');
  await expect(mapa).toContainText('A ELiS é composta por 96 visografemas divididos em 4 grupos');
  await expect(mapa.locator('.category-nav button')).toContainText(['Ponto de articulação', 'Tipo de movimento']);
  await expect(mapa.locator('.note')).toContainText('Pressionar q entrega um visografema diferente do que se tem ao pressionar Q.');
});

test('os recursos da fonte mostram os quatro sublinhados no rosto e a nova pergunta', async ({ page }) => {
  const recursos = page.locator('#recursos');
  await expect(recursos.locator('h2')).toHaveText('Recursos da fonte.');
  await expect(recursos.locator('.contact-card .glyph-label')).toHaveText([
    'Sem contato', 'Contato simples ou de passagem', 'Dois toques', 'Três ou mais toques']);
  await expect(recursos.locator('.section-lead')).toContainText('A fonte ELiS possui dois recursos únicos');
  await expect(recursos.locator('h3')).toHaveText(['Sublinhado significa contato', 'Como digitar', 'Ligaduras']);
  await expect(recursos).toContainText('um traço significa contato simples ou de passagem, dois traços são dois toques e três traços, três ou mais toques');
  await expect(recursos).toContainText('Alguns visografemas de dedos possuem ligaduras');
  // A frase sobre apóstrofos curvos e ª/º explica o motivo: o editor troca os caracteres sozinho.
  await expect(recursos).toContainText('Alguns editores de texto trocam caracteres sozinhos');
  await expect(recursos).not.toContainText('Letras repetidas');
  await expect(recursos.locator('.note strong')).toHaveText('Os visografemas não se conectaram automaticamente?');
  await expect(recursos).not.toContainText('Entradas compatíveis');
});

// Figma "ELiS — Social launch", frame Recursos da Fonte: um visografema com os sublinhados,
// lado a lado, e um exemplo que mostra no rosto o que cada um quer dizer.
test('cada sublinhado do rosto mostra no exemplo onde e quantas vezes a mão toca', async ({ page }) => {
  const demo = page.locator('#contact-demo');
  const cards = demo.locator('.contact-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.elis')).toHaveText(['Q', "'1Q", "'2Q", "'3Q"]);
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(demo.locator('#contact-play')).toHaveText('Reproduzir exemplo');

  const exemplo = demo.locator('.contact-stage');
  await expect(exemplo.locator('.contact-mark')).toHaveCount(0);
  await expect(demo.locator('#contact-text')).toContainText('sem tocar');

  await cards.nth(2).click();
  await expect(cards.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'false');
  await expect(demo.locator('#contact-text')).toContainText('Dois toques em diferentes áreas do mesmo ponto de articulação');
  await expect(demo.locator('#contact-key')).toHaveText("'2Q");
  await expect(exemplo.locator('.contact-mark')).toHaveCount(2, { timeout: 6000 });

  await cards.nth(3).click();
  await expect(demo.locator('#contact-key')).toHaveText("'3Q");
  await expect(exemplo.locator('.contact-mark')).toHaveCount(3, { timeout: 6000 });
});

test('o rosto do exemplo usa uma imagem própria, em alta resolução, e leva à explicação de Estelita', async ({ page }) => {
  const demo = page.locator('#contact-demo');
  const rosto = demo.locator('.contact-stage svg image');
  await expect(rosto).toHaveAttribute('href', /assets\/elis-rosto\.png/);
  const largura = await page.evaluate(async (url) => {
    const img = new Image(); img.src = url; await img.decode(); return img.naturalWidth;
  }, await rosto.getAttribute('href'));
  expect(largura).toBeGreaterThanOrEqual(800);
  const video = demo.locator('a.contact-video');
  await expect(video).toHaveAttribute('href', 'https://www.youtube.com/watch?v=Du7E6w-wR-0&t=1830s');
  await expect(video).toContainText('ELiS: do básico ao acabamento');
});

test('na legenda do BONITO, a etapa 4 (tipo de movimento) faz o boneco executar o sinal, como no site no ar', async ({ page }) => {
  const legenda = page.locator('#grupos .bonito-parts');
  await legenda.scrollIntoViewIfNeeded();
  const etapas = legenda.locator('button[data-step]');
  await expect(etapas).toHaveCount(5);
  await expect(etapas.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.motion-word [data-part="0"]')).toHaveClass(/active/);

  await legenda.getByRole('button', { name: /Ponto de articulação/ }).click();
  await expect(page.locator('.motion-word [data-part="3"]')).toHaveClass(/active/);
  await expect(page.locator('.motion-word [data-part="0"]')).not.toHaveClass(/active/);

  const movimento = legenda.getByRole('button', { name: /Tipo de movimento/ });
  await movimento.click();
  await expect(movimento).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.motion-word [data-part="4"]')).toHaveClass(/active/);
  await expect(page.locator('#sinal-stage')).not.toHaveAttribute('data-mao', 'aberta', { timeout: 5000 });
});

// No celular, o boneco e a leitura em ELiS precisam caber juntos na tela: tocar em uma etapa
// só faz sentido se der para ver o boneco reagir.
test('@mobile no celular, o boneco, a palavra em ELiS e as cinco etapas cabem na mesma tela', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  const palco = page.locator('#sinal-stage');
  const menu = await page.locator('.sidebar').boundingBox();
  await palco.evaluate((el, alturaMenu) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - alturaMenu - 8), menu.height);
  await expect(palco).toBeInViewport({ ratio: 1 });
  await expect(page.locator('#sinal-play')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.bonito-elis .motion-word')).toBeInViewport({ ratio: 1 });
  for (const etapa of await page.locator('.bonito-step').all()) await expect(etapa).toBeInViewport({ ratio: 1 });
  // A dica de mouse e teclado não cobre o boneco em telas de toque.
  await expect(page.locator('.sinal-hint')).toBeHidden();
});

test('@mobile no celular, o boneco continua visível enquanto a leitura em ELiS rola', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 });
  const palco = page.locator('#sinal-stage');
  await page.locator('.bonito-step').last().evaluate(el => el.scrollIntoView({ block: 'end' }));
  await expect(palco).toBeInViewport({ ratio: 1 });
  const menu = await page.locator('.sidebar').boundingBox();
  const caixa = await palco.boundingBox();
  expect(caixa.y).toBeGreaterThanOrEqual(menu.y + menu.height - 1);
});
