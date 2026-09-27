const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const path = '/sk/ukazky/remeselnik/';
const base = process.env.SITE_URL || 'http://127.0.0.1:4178';
const label = 'Ilustračná ukážka, nie zákaznícka referencia';

test('sample: persistent label, noindex, back link and no real contact data', async ({ page }) => {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  const banner = page.locator('[data-sample-label]');
  await expect(banner).toContainText(label);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect(banner).toBeInViewport();
  await expect(page.locator('a[href="/sk/web-so-spravou/"]').first()).toBeVisible();
  await expect(page.locator('a[href^="tel:"], a[href^="mailto:"], img, form[action], form[method]')).toHaveCount(0);
  await expect(page.locator('input[type="email"], input[type="tel"], input[name="name"], input[name="phone"]')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(/\+?\d{3}[\s-]?\d{3}[\s-]?\d{3}|recenzi|hodnoteni|★/i);
});

test('sample: simulated enquiry sends nothing and keeps input', async ({ page }) => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  const form = page.locator('#demo-enquiry');
  const button = form.locator('button[type="submit"]');
  await expect(button).toBeEnabled();
  await expect(page.locator('[data-nojs-note]')).toBeHidden();
  await button.click();
  await expect(page.locator('#demo-status')).toBeEmpty();
  await form.locator('select').selectOption({ index: 1 });
  await form.locator('textarea').fill('Obklad kúpeľne, približne 12 m².');
  await button.click();
  await expect(page.locator('#demo-status')).toContainText('Simulácia');
  await expect(page.locator('#demo-status')).toContainText('Nič sa neodoslalo');
  await expect(form.locator('textarea')).toHaveValue('Obklad kúpeľne, približne 12 m².');
  expect(page.url()).toBe(`${base}${path}`);
  expect(requests).toEqual([]);
});

test('sample: without JavaScript the simulation is disabled and explained', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${base}${path}`);
  await page.waitForLoadState('networkidle');
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  await expect(page.locator('#demo-enquiry button[type="submit"]')).toBeDisabled();
  await expect(page.locator('[data-nojs-note]')).toBeVisible();
  await expect(page.locator('#demo-enquiry textarea')).toBeDisabled();
  await expect(page.locator('#demo-enquiry select')).toBeDisabled();
  await page.keyboard.press('Enter');
  expect(page.url()).toBe(`${base}${path}`);
  expect(requests).toEqual([]);
  await context.close();
});

test('sample: responsive and accessible', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(path);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}px`).toBe(true);
  }
  for (const anchor of await page.locator('a[href^="#"]').all()) {
    await expect(page.locator(await anchor.getAttribute('href'))).toHaveCount(1);
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({ path: `test-results/managed-demo-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
