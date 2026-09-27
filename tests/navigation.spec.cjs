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
  await expect(page.locator('h1')).toContainText('Firemné weby a systémy');
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

const offer = '/sk/web-so-spravou/';
const privacy = '/sk/ochrana-udajov/';
const base = process.env.SITE_URL || 'http://127.0.0.1:4178';
// Top-level items plus the stable Web so správou child; page sections excluded.
const globalNav = page => page.locator('.desktop-menu .nav-list > li > a, .desktop-menu .nav-sublist > li > a').evaluateAll(links =>
  links.map(l => ({ text: l.textContent.trim(), to: new URL(l.href).pathname + new URL(l.href).hash, current: l.getAttribute('aria-current') })));
const labels = ['Služby', 'Web so správou', 'AI marketing', 'Referencie', 'AI školenia', 'Kontakt'];

test('SK global menu keeps labels, order and destinations on homepage, offer and privacy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const sections = ['/sk/#services', offer, '/sk/#automation', '/sk/#portfolio', '/sk/#training'];
  // Kontakt always leads to the nearest form: the page's own, else the homepage's.
  for (const [url, contact] of [['/sk/', '/sk/#contact'], [offer, `${offer}#contact`], [privacy, '/sk/#contact']]) {
    await page.goto(url);
    const nav = await globalNav(page);
    expect(nav.map(l => l.text), url).toEqual(labels);
    expect(nav.map(l => l.to), url).toEqual([...sections, contact]);
    expect(nav.filter(l => l.current === 'page').map(l => l.to), url).toEqual(url === offer ? [offer] : []);
  }
  await page.goto('/sk/');
  const homeHrefs = await page.locator('.desktop-menu .nav-list > li > a').evaluateAll(ls => ls.map(l => l.getAttribute('href')));
  expect(homeHrefs).toEqual(['#services', '#automation', '#portfolio', '#training', '#contact']);
  await expect(page.locator('.site-nav .nav-sections, .site-nav .nav-local')).toHaveCount(0);

  await page.goto(offer);
  const child = page.locator('.desktop-menu .nav-list > li:first-child > .nav-sublist > li > a');
  await expect(child).toHaveAttribute('href', offer);
  await expect(child).toHaveAttribute('aria-current', 'page');
  const [parentBox, childBox] = [await page.locator('.desktop-menu .nav-list > li:first-child > a').boundingBox(), await child.boundingBox()];
  expect(childBox.x).toBeGreaterThan(parentBox.x);
});

test('SK offer: page sections nest under the current page, without a second contact link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(offer);
  await expect(page.locator('.site-nav .nav-local, .site-nav .nav-local-label')).toHaveCount(0);
  const current = page.locator('.desktop-menu a[aria-current="page"]');
  const sections = current.locator('xpath=following-sibling::ul[contains(@class, "nav-sections")]');
  await expect(sections).toHaveAccessibleName('Na tejto stránke');
  const hrefs = await sections.locator('a').evaluateAll(ls => ls.map(l => l.getAttribute('href')));
  expect(hrefs).toEqual(['#rozsah', '#ukazky', '#postup', '#otazky']);
  expect((await sections.locator('a').first().boundingBox()).x).toBeGreaterThan((await current.boundingBox()).x);
  await expect(page.locator('.desktop-menu a[href$="#contact"]')).toHaveCount(1);
  await expect(page.locator('.site-nav')).not.toContainText('Nezáväzný dopyt');
  await expect(page.locator('.site-nav')).not.toContainText('Ďalšie služby');
});

test('current state: one current link per menu copy and AI marketing is not styled as current', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const url of ['/sk/', offer, privacy]) {
    await page.goto(url);
    const expected = url === offer ? 1 : 0;
    await expect(page.locator('.desktop-menu a[aria-current]')).toHaveCount(expected);
    await expect(page.locator('.mobile-panel a[aria-current]')).toHaveCount(expected);
    const ai = page.locator('.desktop-menu a[href$="#automation"]');
    expect(await ai.evaluate(a => getComputedStyle(a).fontWeight)).toBe('400');
  }
});

test('SK offer global links leave the page; Kontakt stays on it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(offer);
  await page.locator('.desktop-menu .nav-list a', { hasText: 'AI marketing' }).click();
  await expect(page).toHaveURL(/\/sk\/#automation$/);
  await expect(page.locator('#automation')).toBeInViewport();
  await page.goto(offer);
  await page.locator('.desktop-menu a', { hasText: 'Kontakt' }).click();
  await expect(page).toHaveURL(new RegExp(`${offer}#contact$`));
  await expect(page.locator('#contact-heading')).toHaveText('Nezáväzný dopyt');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mobile-menu summary').click();
  await page.locator('.mobile-menu .nav-list a[href="/sk/#services"]').click();
  await expect(page).toHaveURL(/\/sk\/#services$/);
});

test('other locales keep their own global menu without the SK child', async ({ page }) => {
  for (const [url, first] of [['/', 'Services'], ['/es/', null], ['/et/', null]]) {
    await page.goto(url);
    const hrefs = await page.locator('.desktop-menu .nav-list a').evaluateAll(ls => ls.map(l => l.getAttribute('href')));
    expect(hrefs).toEqual(['#services', '#automation', '#portfolio', '#training', '#contact']);
    await expect(page.locator('.site-nav .nav-sublist, .site-nav .nav-sections, .site-nav .nav-local')).toHaveCount(0);
    await expect(page.locator('.language-options p')).toHaveCount(0);
    if (first) await expect(page.locator('.desktop-menu .nav-list a').first()).toHaveText(first);
  }
});

for (const size of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }]) {
  test(`short desktop keeps the language control visible while the menu scrolls: ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto(offer);
    const summary = page.locator('.language-menu summary');
    await expect(summary).toBeInViewport({ ratio: 1 });
    const left = async sel => Math.round((await page.locator(sel).first().boundingBox()).x);
    expect(await left('.desktop-menu .nav-list > li > a')).toBe(await left('.brand-home'));
    expect(await left('.language-menu')).toBe(await left('.brand-home'));
    await expect(page.locator('.brand-caption')).toBeHidden();
    const last = page.locator('.desktop-menu a').last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 1 });
    await expect(summary).toBeInViewport({ ratio: 1 });
    await summary.click();
    const options = page.locator('.language-options');
    await expect(options).toBeInViewport({ ratio: 1 });
    await expect(options.locator('a[hreflang="en"]')).toBeVisible();
    // Not clipped by an ancestor: the link at the option's centre is the option itself.
    const box = await options.locator('a[hreflang="et"]').boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('hreflang'), [box.x + box.width / 2, box.y + box.height / 2]);
    expect(hit).toBe('et');
  });
}

for (const url of ['/sk/', offer, privacy]) {
  test(`mobile menu panel scrolls to its final link on a short screen: ${url}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto(url);
    await page.locator('.mobile-menu summary').click();
    const panel = page.locator('.mobile-menu > nav');
    const box = await panel.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(480 + 1);
    expect(await panel.evaluate(p => getComputedStyle(p).overflowY)).toBe('auto');
    const last = panel.locator('a').last();
    await expect(last).toHaveText('Kontakt');
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 1 });
    await last.focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
    await expect(page.locator('.mobile-menu summary')).toBeFocused();
  });
}

test('SK offer mobile menu works without JavaScript on a short screen', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 480 } });
  const page = await context.newPage();
  await page.goto(`${base}${offer}`);
  await page.locator('.mobile-menu summary').click();
  const panel = page.locator('.mobile-menu > nav');
  await expect(panel.locator('.nav-list a[href="/sk/#services"]')).toBeVisible();
  await expect(panel.locator('.nav-sublist a[aria-current="page"]')).toHaveText('Web so správou');
  const faq = panel.locator('.nav-sections a[href="#otazky"]');
  await faq.scrollIntoViewIfNeeded();
  await faq.click();
  await expect(page).toHaveURL(new RegExp(`${offer}#otazky$`));
  // Without JS the native disclosure stays open after a link; no reopen needed.
  await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
  const contact = panel.locator('a', { hasText: 'Kontakt' });
  await contact.scrollIntoViewIfNeeded();
  await expect(contact).toBeInViewport({ ratio: 1 });
  await contact.click();
  await expect(page).toHaveURL(new RegExp(`${offer}#contact$`));
  await context.close();
});

test('privacy notice uses the site shell without a form and stays unindexed', async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(privacy);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('.site-nav img.brand-logo')).toBeVisible();
  await expect(page.locator('footer a[href="/sk/ochrana-udajov/"]')).toBeVisible();
  await expect(page.locator('#contactForm, #contact')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Ochrana údajov pri oslovení');
  await expect(page.locator('main #kontaktny-formular #kontaktny-formular-nadpis')).toHaveText('Kontaktný formulár na skyvault.ee');
  await expect(page.locator('main a[href="/sk/"]')).toHaveText('← Späť na skyvault.ee');
  await expect(page.locator('.language-options')).toContainText('Úvodné stránky');
  await expect(page.locator('.language-options a[aria-current]')).toHaveCount(0);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain(privacy);
  await page.goto(`${privacy}#kontaktny-formular`);
  await expect(page.locator('#kontaktny-formular-nadpis')).toBeInViewport();
});

test('language menu hint appears only away from the language homepage', async ({ page }) => {
  await page.goto('/sk/');
  await expect(page.locator('.language-options p')).toHaveCount(0);
  await expect(page.locator('.language-options a[aria-current="page"]')).toHaveAttribute('hreflang', 'sk');
});
