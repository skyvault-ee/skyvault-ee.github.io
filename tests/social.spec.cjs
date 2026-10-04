const { test, expect } = require('@playwright/test');

const profiles = [
  ['Facebook', 'https://www.facebook.com/skyvault.ee/'],
  ['Instagram', 'https://www.instagram.com/skyvault.ee/'],
];

const pages = [
  ['/', 'Social media'],
  ['/sk/', 'Sociálne siete'],
  ['/es/', 'Redes sociales'],
  ['/et/', 'Sotsiaalmeedia'],
  ['/sk/web-so-spravou/', 'Sociálne siete'],
];

for (const [path, label] of pages) {
  test(`${path}: footer links the company social profiles`, async ({ page }) => {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: label });
    await expect(nav).toBeVisible();
    await expect(nav.locator('a')).toHaveCount(profiles.length);
    for (const [name, url] of profiles) {
      const link = nav.getByRole('link', { name, exact: true });
      await expect(link).toHaveAttribute('href', url);
      await expect(link).toHaveAttribute('rel', 'me');
    }
  });
}

test('homepage structured data ties the profiles to the site (sameAs)', async ({ page }) => {
  await page.goto('/');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
  expect(data.sameAs).toEqual(profiles.map(([, url]) => url));
});
