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

// Nomes do quadro "Movimento" de Barros (2016, p. 206), na ordem das teclas de "Teclas detalhadas beta.pdf".
test('cada visografema de movimento mostra o nome do movimento', async ({ page }) => {
  await page.locator('.category-nav [data-category=movimento]').click();
  const grupos = page.locator('#map-content .map-group');
  const nomes = n => grupos.nth(n).locator('.glyph-card .glyph-label');
  await expect(nomes(0)).toHaveText([
    'Para frente', 'Para trás', 'Para frente e para trás', 'Para cima', 'Para baixo', 'Para cima e para baixo',
    'Para a direita', 'Para a esquerda', 'Para a direita e para a esquerda', 'Para o meio', 'Para fora',
    'Para cima e à direita', 'Para cima e à esquerda', 'Para baixo e à direita', 'Para baixo e à esquerda',
    'Arco', 'Flexão/extensão de braço', 'Circular vertical', 'Circular horizontal', 'Circular frontal']);
  await expect(nomes(1)).toHaveText([
    'Abrir', 'Fechar', 'Abrir e fechar', 'Flexão dos dedos na base', 'Flexão dos dedos na ponta', 'Unir e separar dedos',
    'Tamborilar de dedos', 'Friccionar de dedos', 'Dobrar o punho', 'Movimento lateral do punho', 'Girar o punho', 'Girar o antebraço']);
  await expect(nomes(2)).toHaveText([
    'Negação com a cabeça', 'Afirmação com a cabeça', 'Língua na bochecha', 'Língua para fora', 'Corrente de ar',
    'Vibração dos lábios', 'Movimento lateral do queixo', 'Murchar bochechas', 'Inflar bochechas', 'Abrir a boca', 'Piscar', 'Girar o tronco']);
  // A entrada ° não está no quadro de Barros (2016): fica sem nome, em vez de um nome inventado.
  const grau = grupos.nth(0).locator('.glyph-card', { has: page.locator('kbd', { hasText: /^°$/ }) });
  await expect(grau.locator('.glyph-label')).toHaveCount(0);
});

test('os detalhes de Ä dizem que é o tamborilar de dedos', async ({ page }) => {
  await page.locator('#map-search').fill('Ä');
  await page.locator('#map-content .glyph-card').first().click();
  await expect(page.locator('#key-dialog-title')).toHaveText('Tamborilar de dedos');
  await expect(page.locator('#key-description')).toHaveText('Movimentos de mão: Tamborilar de dedos.');
});

test('a busca por nome encontra o movimento', async ({ page }) => {
  await page.locator('#map-search').fill('tamborilar');
  await expect(page.locator('#map-content .glyph-card kbd')).toHaveText(['Ä']);
});

// Barros (2016, p. 205) nomeia os básicos de Demais dedos: fechado, muito curvo, curvo, inclinado e estendido.
// Os desenhos com ponto ou traço aparecem como variantes do básico, sem um significado inventado.
test('cada visografema de Demais dedos mostra um nome', async ({ page }) => {
  await page.locator('.category-nav [data-category=dedos]').click();
  const grupo = page.locator('#map-content .map-group').nth(1);
  await expect(grupo.locator('.glyph-card kbd')).toHaveText(['u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k']);
  await expect(grupo.locator('.glyph-card .glyph-label')).toHaveText([
    'Muito curvo', 'Variante de muito curvo, com ponto', 'Curvo', 'Variante de curvo, com traço', 'Variante de curvo, com ponto',
    'Inclinado', 'Variante de inclinado, com traço', 'Variante de inclinado, com ponto',
    'Estendido', 'Variante de estendido, com traço', 'Variante de inclinado, cruzada', 'Fechado']);
  await grupo.locator('.glyph-card').first().click();
  await expect(page.locator('#key-dialog-title')).toHaveText('Muito curvo');
  await expect(page.locator('#key-description')).toHaveText('Demais dedos: Muito curvo.');
});
