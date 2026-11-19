const { test, expect, PAGES } = require('./fixtures');

for (const p of PAGES) {
  test(`${p.code}: todos os arquivos locais existem`, async ({ page, request, baseURL }) => {
    await page.goto(p.path);
    const urls = await page.evaluate(() => {
      const list = [...document.querySelectorAll('a[href], link[href], script[src], img[src]')]
        .map(el => el.href || el.src)
        .filter(url => url.startsWith(location.origin) && !url.includes('#'));
      const og = document.querySelector('meta[property="og:image"]')?.content;
      if (og) list.push(new URL(new URL(og).pathname, location.origin).href);
      return [...new Set(list)];
    });
    expect(urls.length).toBeGreaterThan(5);
    for (const url of urls) {
      const response = await request.get(url);
      expect(response.status(), url.replace(baseURL, '')).toBe(200);
    }
  });

  test(`${p.code}: sem rolagem horizontal no celular @mobile`, async ({ page }) => {
    await page.goto(p.path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('o ZIP da fonte e a licença estão disponíveis', async ({ request }) => {
  const zip = await request.get('/downloads/ELiS-Libras%202.004.zip');
  expect(zip.status()).toBe(200);
  expect((await zip.body()).subarray(0, 2).toString()).toBe('PK');
  const license = await request.get('/downloads/OFL.txt');
  expect(await license.text()).toContain('SIL Open Font License, Version 1.1');
});

const REPO = 'https://github.com/PlauDesign/elis';
const CONTRIBUTE = {
  PT: { name: 'Contribua com a ELiS no GitHub', footer: 'Repositório da ELiS no GitHub' },
  EN: { name: 'Contribute to ELiS on GitHub', footer: 'ELiS repository on GitHub' },
  ES: { name: 'Contribuye a ELiS en GitHub', footer: 'Repositorio de ELiS en GitHub' },
};
const STORY_PAGES = [
  { path: '/historia.html', code: 'PT' },
  { path: '/historia-en.html', code: 'EN' },
  { path: '/historia-es.html', code: 'ES' },
];

for (const p of [...PAGES, ...STORY_PAGES]) {
  test(`${p.path}: o header leva ao repositório no GitHub`, async ({ page }) => {
    await page.goto(p.path);
    const link = page.locator('header').getByRole('link', { name: CONTRIBUTE[p.code].name });
    await expect(link).toHaveAttribute('href', REPO);
    await expect(link).toBeVisible();
  });
}

for (const p of PAGES) {
  test(`${p.code}: o rodapé convida a contribuir no GitHub`, async ({ page }) => {
    await page.goto(p.path);
    const link = page.locator('footer').getByRole('link', { name: CONTRIBUTE[p.code].footer });
    await expect(link).toHaveAttribute('href', REPO);
  });
}
