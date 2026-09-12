const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

for (const [path, lang] of [['/', 'en'], ['/sk/', 'sk'], ['/es/', 'es'], ['/et/', 'et']]) {
  test(`${lang}: responsive, accessible and complete`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(path);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${lang} overflow at ${width}px`).toBe(true);
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
      }
    }
    for (const anchor of await page.locator('a[href^="#"]').all()) {
      const href = await anchor.getAttribute('href');
      await expect(page.locator(href)).toHaveCount(1);
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.skyvault.ee${path}`);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(5);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('navigation and project content also work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:4178'}/`);
  await page.locator('.mobile-menu summary').click();
  await expect(page.locator('.mobile-menu a[href="#services"]')).toBeVisible();
  await page.locator('.mobile-menu summary').click();
  await page.locator('#portfolioModal1 summary').click();
  await expect(page.locator('#portfolioModal1 .project-copy')).toBeVisible();
  await context.close();
});
