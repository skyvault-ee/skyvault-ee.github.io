const { test, expect } = require('@playwright/test');

const endpoint = 'https://skyvault.dopice.sk/contact_me.php';
const payload = {
  name: 'Automated browser check',
  email: 'browser-check@example.com',
  phone: '+421900000000',
  message: 'Local automated verification only. This request is intercepted and never delivered.',
};

async function fillForm(page) {
  for (const [key, value] of Object.entries(payload)) await page.locator(`#${key}`).fill(value);
}

// All contact submissions in this suite are intercepted; no real mail is sent.
for (const [name, body, state] of [
  ['mail failure', 'fail', 'error'],
  ['validation rejection', 'No arguments Provided!', 'error'],
  ['unexpected PHP output', '<b>Fatal error</b>', 'error'],
  ['legacy empty success', '', 'success'],
  ['explicit success', 'success', 'success'],
]) {
  test(`contact: ${name}`, async ({ page }) => {
    let posted;
    await page.route(endpoint, async route => {
      posted = Object.fromEntries(new URLSearchParams(route.request().postData()));
      await route.fulfill({ status: 200, contentType: 'text/plain', body });
    });
    await page.goto('/');
    await fillForm(page);
    await page.locator('#contactForm button[type="submit"]').click();
    await expect(page.locator('#success')).toHaveAttribute('data-state', state);
    expect(posted).toEqual(payload);
    await expect(page.locator('#message')).toHaveValue(state === 'success' ? '' : payload.message);
    await expect(page.locator('#contactForm button[type="submit"]')).toBeEnabled();
    if (state === 'error') await expect(page.locator('#success')).not.toContainText('has been sent');
  });
}

test('contact: localized validation rejects empty input without a request', async ({ page }) => {
  let requests = 0;
  await page.route(endpoint, route => { requests++; return route.abort(); });
  await page.goto('/sk/');
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
  expect(await page.locator('#name').evaluate(e => e.validationMessage)).toBe('Zadajte, prosím, vaše meno.');
  await page.locator('#name').fill(payload.name);
  await expect(page.locator('#name')).not.toHaveAttribute('aria-invalid');
  expect(requests).toBe(0);
});

test('contact: HTTP 400 explains server validation instead of claiming an outage', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ status: 400, contentType: 'text/plain', body: 'No arguments Provided!' }));
  await page.goto('/');
  await fillForm(page);
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#success')).toContainText('Please check your details');
  await expect(page.locator('#success')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#message')).toHaveValue(payload.message);
});

test('contact: a server error cannot be accepted as success', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ status: 503, body: 'success' }));
  await page.goto('/');
  await fillForm(page);
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#success')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#message')).toHaveValue(payload.message);
});

test('contact: transport failure keeps the message and allows retry', async ({ page }) => {
  await page.route(endpoint, route => route.abort());
  await page.goto('/');
  await fillForm(page);
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#success')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#success')).toContainText('not responding');
  await expect(page.locator('#message')).toHaveValue(payload.message);
  await expect(page.locator('#contactForm button[type="submit"]')).toBeEnabled();
});

test('contact: pending requests cannot be submitted twice', async ({ page }) => {
  let requests = 0;
  let finish;
  await page.route(endpoint, async route => {
    requests++;
    await new Promise(resolve => { finish = resolve; });
    await route.fulfill({ status: 200, body: 'success' });
  });
  await page.goto('/');
  await fillForm(page);
  await page.locator('#contactForm button[type="submit"]').click();
  await expect(page.locator('#contactForm')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#contactForm button[type="submit"]')).toBeDisabled();
  await page.locator('#contactForm').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  await expect.poll(() => requests).toBe(1);
  finish();
  await expect(page.locator('#success')).toHaveAttribute('data-state', 'success');
});
