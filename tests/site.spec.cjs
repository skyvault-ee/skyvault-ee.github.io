const { test, expect } = require('@playwright/test');

const locales = [
  ['/', 'en', 'Software that has to'],
  ['/sk/', 'sk', 'Softvér, ktorý musí'],
  ['/es/', 'es', 'Software que tiene que'],
  ['/et/', 'et', 'Tarkvara, mis peab'],
];

for (const [path, lang, heading] of locales) {
  test(`${lang}: accessible Tailwind homepage without the legacy theme`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('main h1')).toContainText(heading);
    await expect(page.locator('link[href*="/assets/css/site.css"]')).toHaveCount(1);
    await expect(page.locator('link[href*="style.css"], script[src*="jquery"], script[src*="bootstrap"]')).toHaveCount(0);
    await expect(page.locator('#portfolio .portfolio-item')).toHaveCount(2);
    await expect(page.locator('#contactForm label[for="email"]')).toBeVisible();
  });
}
