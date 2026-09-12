const { test, expect } = require('@playwright/test');

test('mobile navigation closes on selection and Escape restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.mobile-menu');
  const toggle = menu.locator('summary');
  await toggle.click();
  await expect(menu).toHaveAttribute('open', '');
  await menu.locator('a[href="#services"]').click();
  await expect(menu).not.toHaveAttribute('open');
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await expect(toggle).toBeFocused();
});

test('language navigation closes on outside click and changes language', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('.language-menu');
  await menu.locator('summary').click();
  await page.locator('h1').click();
  await expect(menu).not.toHaveAttribute('open');
  await menu.locator('summary').click();
  await menu.locator('a[hreflang="sk"]').click();
  await expect(page).toHaveURL(/\/sk\/$/);
  await expect(page.locator('h1')).toContainText('Softvér, ktorý musí');
});

test('project details preserve direct links and archive attribution', async ({ page }) => {
  await page.goto('/#portfolioModal2');
  const archived = page.locator('#portfolioModal2');
  await expect(archived).toHaveAttribute('open', '');
  await expect(archived.locator('.project-copy')).toContainText('client has since replaced');
  await expect(archived.locator('a[target="_blank"]')).toHaveCount(0);
  const current = page.locator('#portfolioModal1');
  await current.locator('summary').click();
  await expect(current.locator('a[target="_blank"]')).toHaveAttribute('href', 'https://travertin.at');
});
