const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const path = '/sk/web-so-spravou/';
const endpoint = 'https://skyvault.dopice.sk/contact_me.php';
const base = process.env.SITE_URL || 'http://127.0.0.1:4178';

test('offer: price, scope, exclusions and nonbinding enquiry are explicit', async ({ page }) => {
  await page.goto(path);
  await expect(page.locator('main h1')).toHaveText('Firemný web, o ktorý sa nemusíte starať sami.');
  await expect(page.locator('[data-offer-price]')).toHaveText('199 € za spustenie + 29 € mesačne za prevádzku a správu');
  await expect(page.locator('main')).toContainText('Doména sa platí osobitne');
  await expect(page.locator('main')).toContainText('daňový režim a konečnú cenu potvrdíme v písomnej ponuke');
  await expect(page.locator('main')).toContainText('Odoslaním dopytu nič neobjednávate.');
  const scope = page.locator('#rozsah');
  await expect(scope.locator('.offer-panel').first().locator('li')).toHaveCount(3);
  await expect(scope.locator('.offer-panel').first()).toContainText('menšiu firmu');
  expect(await page.locator('main ul, main ol').evaluateAll(lists => lists.every(list => list.children.length > 0))).toBe(true);
  await expect(scope).toContainText('do 15 minút práce mesačne');
  await expect(scope).toContainText('nevyužitá sa neprenáša');
  await expect(scope).toContainText('Opravy chýb nami dodaného webu sa do tejto úpravy nepočítajú');
  await expect(scope).toContainText('nepotrebujete často meniť celý web');
  for (const excluded of ['e-shop', 'rezervácie', 'zákaznícke účty', 'viac jazykov']) await expect(scope).toContainText(excluded);
  for (const agreed of ['zoznam stránok', 'termín', 'cena práce navyše', 'ukončenia', 'odovzdanie súborov']) {
    await expect(page.locator('[data-written-offer]')).toContainText(agreed);
  }
  await expect(page.locator('#postup ol > li')).toHaveCount(4);
  await expect(page.locator('#otazky details')).not.toHaveCount(0);
});

test('offer: no unapproved promises, payment actions or private prospects', async ({ page }) => {
  await page.goto(path);
  const text = await page.locator('body').innerText();
  for (const claim of [
    /zaručen/i, /(?<!ne)garantujeme/i, /bez viazanosti/i, /neobmedzen/i, /web je (váš|vaš)/i, /zadarmo/i,
    /\b\d+\s*(stránok|podstránok|strán)\b/i, /do \d+ (hodín|dní)/i, /\b(24|48)\s*h/i, /zálohujeme|zálohy/i,
    /dostupnosť|uptime|99[,.]\d/i, /zaplatiť|objednať teraz|kúpiť/i, /poplatok za ukončenie/i,
    /ENERKLIMA|VENTKLIMA|K-KLIMA/i, /\bTODO\b|blokovan/i,
  ]) expect(text, String(claim)).not.toMatch(claim);
  await expect(page.locator('a[href^="tel:"], input[type="checkbox"]')).toHaveCount(0);
  await expect(page.locator('a[href*="token"], a[href*="preview"]')).toHaveCount(0);
});

test('offer: metadata is self-canonical Slovak without homepage translations', async ({ page, request }) => {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
  await expect(page).toHaveTitle(/Web so správou/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /199 €.*29 €/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.skyvault.ee${path}`);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'sk_SK');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain(`https://www.skyvault.ee${path}`);
  expect(sitemap).not.toContain('/sk/ukazky/');
});

test('offer: page navigation, language home links and footer privacy', async ({ page }) => {
  await page.goto(path);
  const hrefs = await page.locator('.desktop-menu a').evaluateAll(links => links.map(l => l.getAttribute('href')));
  expect(hrefs).toEqual([
    '/sk/#services', '/sk/web-so-spravou/', '#rozsah', '#ukazky', '#postup', '#otazky',
    '/sk/#automation', '/sk/#portfolio', '/sk/#training', '#contact',
  ]);
  for (const anchor of await page.locator('a[href^="#"]').all()) {
    await expect(page.locator(await anchor.getAttribute('href'))).toHaveCount(1);
  }
  const languages = page.locator('.language-options a');
  await expect(languages).toHaveCount(4);
  await expect(page.locator('.language-options a[aria-current], footer a[aria-current]')).toHaveCount(0);
  await expect(page.locator('.language-options')).toContainText('Úvodné stránky');
  await expect(page.locator('footer a[href="/sk/ochrana-udajov/"]')).toHaveText('Ochrana osobných údajov');
  await expect(page.locator('.site-nav img.brand-logo')).toHaveAttribute('src', '/img/logos/skyvault.png');
});

test('offer: proof labels U Brondaka as not live and links its Tailscale preview', async ({ page }) => {
  await page.goto(path);
  const proof = page.locator('#ukazky');
  await expect(proof.locator('img[src="/img/portfolio/travertin.jpg"]')).toBeVisible();
  await expect(proof).toContainText('mimo tohto balíka');
  await expect(proof).toContainText('U Bronďaka');
  await expect(proof).toContainText('Náhľad pred spustením');
  await expect(proof).toContainText('Zatiaľ nie je nasadený na ostrej doméne');
  await expect(proof.locator('a[href="https://mac-studio.tail26a69.ts.net/ubrondaka/"]')).toBeVisible();
  await expect(proof.locator('img[src="/img/portfolio/ubrondaka-preview.jpg"]')).toBeVisible();
  await expect(proof.locator('a[href="/sk/ukazky/remeselnik/"]')).toHaveCount(0);
  await expect(proof).not.toContainText('Web pre remeselníka');
});

test('offer: responsive, accessible and assets load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(path);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}px`).toBe(true);
    for (const image of await page.locator('main img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true);
    }
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `test-results/managed-web-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('offer: desktop side masthead and mobile menu with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(path);
  expect((await page.locator('.site-nav').boundingBox()).width).toBeLessThan(300);
  await expect(page.locator('[data-offer-price]')).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.locator('.mobile-menu');
  await menu.locator('summary').click();
  await menu.locator('.nav-sections a[href="#otazky"]').click();
  await expect(menu).not.toHaveAttribute('open');
  await expect(page.locator('#otazky')).toBeFocused();
  await menu.locator('summary').click();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await expect(menu.locator('summary')).toBeFocused();
});

test('offer: FAQ and menu work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${base}${path}`);
  await page.locator('.mobile-menu summary').click();
  await expect(page.locator('.mobile-menu .nav-sections a[href="#rozsah"]')).toBeVisible();
  await expect(page.locator('.mobile-menu .nav-list a[href="/sk/#services"]')).toBeVisible();
  await page.locator('.mobile-menu summary').click();
  const faq = page.locator('#otazky details').first();
  await faq.locator('summary').click();
  await expect(faq.locator('p').first()).toBeVisible();
  await context.close();
});

test('offer: contact reuses the existing four-field form, intercepted', async ({ page }) => {
  const payload = { name: 'Automated check', email: 'check@example.com', phone: '+421900000000', message: 'Intercepted local test, never delivered.' };
  let posted;
  await page.route(endpoint, async route => {
    posted = Object.fromEntries(new URLSearchParams(route.request().postData()));
    await route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
  });
  await page.goto(path);
  const form = page.locator('#contactForm');
  await expect(form).toHaveAttribute('action', endpoint);
  await expect(page.locator('#contact-heading')).toHaveText('Nezáväzný dopyt');
  await expect(page.locator('#contact a[href="mailto:alino.sadovsky@skyvault.ee"]')).toBeVisible();
  await expect(page.locator('#contact a[href="/sk/ochrana-udajov/#kontaktny-formular"]')).toBeVisible();
  await expect(form.locator('input[type="hidden"]')).toHaveCount(0);
  for (const [key, value] of Object.entries(payload)) await page.locator(`#${key}`).fill(value);
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#success')).toHaveAttribute('data-state', 'success');
  expect(posted).toEqual(payload);
});

test('homepages: only Slovak links the offer; other locales keep broad positioning', async ({ page }) => {
  await page.goto('/sk/');
  await expect(page.locator('.desktop-menu .nav-sublist a[href="/sk/web-so-spravou/"]')).toHaveText('Web so správou');
  await expect(page.locator('.desktop-menu a[href="/sk/web-so-spravou/"]')).not.toHaveAttribute('aria-current');
  await expect(page.locator('#services .service-column').first().locator('a[href="/sk/web-so-spravou/"]')).toBeVisible();
  await expect(page.locator('#services .service-column')).toHaveCount(6);
  await expect(page.locator('footer a[href="/sk/ochrana-udajov/"]')).toBeVisible();
  await expect(page.locator('#contact a[href="/sk/ochrana-udajov/#kontaktny-formular"]')).toBeVisible();
  await expect(page.locator('.language-options a[aria-current="page"]')).toHaveAttribute('hreflang', 'sk');
  await expect(page.locator('#contact-heading')).toHaveText('Ozvite sa');
  for (const other of ['/', '/es/', '/et/']) {
    await page.goto(other);
    await expect(page.locator('a[href*="web-so-spravou"], a[href*="ochrana-udajov"]')).toHaveCount(0);
    await expect(page.locator('#services .service-column')).toHaveCount(6);
    await expect(page.locator('.language-options a[aria-current="page"]')).toHaveCount(1);
  }
});

test('privacy notice separates the general contact form from outreach', async ({ page }) => {
  await page.goto('/sk/ochrana-udajov/');
  const general = page.locator('#kontaktny-formular');
  await expect(general).toContainText('meno, e-mail, telefón a správu');
  await expect(general).not.toContainText('WhatsApp');
  await expect(page.locator('body')).toContainText('Na novú požiadavku upozorňujeme správcu cez WhatsApp');
});
