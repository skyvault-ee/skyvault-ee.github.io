const { test, expect } = require('@playwright/test');

const locales = [
  ['/', 'en', 'Websites and systems'],
  ['/sk/', 'sk', 'Firemné weby a systémy'],
  ['/es/', 'es', 'Webs y sistemas'],
  ['/et/', 'et', 'Veebilehed ja süsteemid'],
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
