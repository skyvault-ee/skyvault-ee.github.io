const { test, expect } = require('@playwright/test');

for (const path of ['/', '/sk/', '/es/', '/et/']) {
  test(`${path}: original brand asset and permanently visible automation`, async ({ page }) => {
    await page.goto(path);
    const logo = page.locator('.site-nav img.brand-logo');
    await expect(logo).toHaveAttribute('src', '/img/logos/skyvault.png');
    await expect(logo).toHaveAttribute('alt', 'Skyvault');
    await expect(page.locator('.site-nav .wordmark, .footer-wordmark')).toHaveCount(0);
    const automation = page.locator('#automation');
    await expect(automation.locator('h2')).toBeVisible();
    await expect(automation.locator('li')).toHaveCount(4);
    await expect(automation.locator('details, summary')).toHaveCount(0);
    await expect(page.locator('.desktop-menu a[href="#automation"]')).toBeVisible();
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
