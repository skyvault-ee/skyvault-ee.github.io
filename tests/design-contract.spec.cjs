const { test, expect } = require('@playwright/test');

const locales = [
  ['/', 'Company websites', 'brand identity', 'SEO audits', 'Instagram', 'videos, Stories and posts'],
  ['/sk/', 'Firemné weby', 'vizuálna identita', 'SEO audity', 'Instagram', 'videí, príbehov a príspevkov'],
  ['/es/', 'Webs para empresas', 'identidad visual', 'Auditorías SEO', 'Instagram', 'vídeos, Stories y publicaciones compatibles'],
  ['/et/', 'Ettevõtete veebilehed', 'brändiidentiteet', 'SEO-auditid', 'Instagram', 'videod, lood ja postitused'],
];

for (const [path, websites, brand, seo, social, formats] of locales) {
  test(`${path}: original brand, company services and visible marketing automation`, async ({ page }) => {
    await page.goto(path);
    const logo = page.locator('.site-nav img.brand-logo');
    await expect(logo).toHaveAttribute('src', '/img/logos/skyvault.png');
    await expect(logo).toHaveAttribute('alt', 'Skyvault');
    await expect(page.locator('.site-nav .wordmark, .footer-wordmark')).toHaveCount(0);
    const services = page.locator('#services .service-column');
    await expect(services).toHaveCount(6);
    await expect(services.nth(0)).toContainText(websites);
    await expect(services.nth(1)).toContainText(brand);
    await expect(services.nth(2)).toContainText(seo);
    await expect(services.nth(5)).toContainText(social);
    await expect(services.nth(5)).toContainText('Facebook');
    const automation = page.locator('#automation');
    await expect(automation.locator('h2')).toBeVisible();
    await expect(automation.locator('li')).toHaveCount(6);
    await expect(automation).toContainText(social);
    await expect(automation).toContainText('Facebook');
    await expect(automation).toContainText(formats);
    await expect(automation.locator('details, summary')).toHaveCount(0);
    await expect(page.locator('.desktop-menu a[href="#automation"]')).toBeVisible();
    const price = page.locator('.training-rate');
    await expect(price).toContainText('€100');
    await expect(price).not.toContainText(/\bVAT\b|\bDPH\b|\bIVA\b|käibemaks|pöördmaksust/i);
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await automation.scrollIntoViewIfNeeded();
      for (const item of await automation.locator('li').all()) await expect(item).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test('desktop composition uses a side masthead and real work in the first viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const navigation = await page.locator('.site-nav').boundingBox();
  const intro = await page.locator('main > header').boundingBox();
  expect(navigation.width).toBeLessThan(300);
  expect(intro.x).toBeGreaterThanOrEqual(navigation.width);
  await expect(page.locator('.hero-project img')).toBeInViewport();
  expect(await page.locator('h1').evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeLessThan(64);
});
