Skyvault website
===============

https://www.skyvault.ee

A static Jekyll site with compiled Tailwind CSS 4, self-hosted IBM Plex Sans fonts,
and small vanilla JavaScript enhancements. English, Slovak, Spanish and Estonian
share one set of templates. There is no frontend framework or runtime CSS CDN.

Build and preview
-----------------

Prerequisites: Node.js/npm, Docker, and Chrome for the browser tests.

    npm ci
    npm run build
    python3 -m http.server 4178 --directory _site

Open http://localhost:4178. The build uses jekyll/jekyll:3.8 under Docker to
match the existing Ruby dependencies without changing system Ruby. It requires
a running Docker daemon and access to the gem registry on a fresh container.

For CSS-only changes:

    npm run build:css
    npm run watch:css

Rebuild Jekyll to copy updated assets/templates into the preview directory.

Verification
------------

    npm test

Playwright serves the built _site automatically if port 4178 is free. Tests cover
all four locales at mobile, tablet and desktop widths, axe accessibility checks,
navigation, project details, metadata, images and contact-form responses.
Every automated contact POST is intercepted locally; tests never send email.
Set SITE_URL to run the same checks against another deployment.

If installed Chrome closes between contexts on macOS (`browser.newContext:
Target page, context or browser has been closed`), use the optional managed
Chromium runner. This runs the same complete suite without retries or weakened
assertions; it does not alter the normal Chrome configuration:

    npx playwright install chromium --only-shell
    npx playwright test --config scripts/playwright-headless.config.cjs --workers=1

Editing
-------

- Layout and sections: _layouts/default.html and _includes/*.html.
- Design tokens and Tailwind source: assets/css/source.css.
- Compiled production CSS: assets/css/site.css (tracked intentionally).
- Menus, project deep links and form handling: assets/js/site.js.
- Translations: _data/i18n/{en,sk,es,et}.yml. Keep keys in sync.
- Language registry: _data/languages.yml.
- Project facts: _posts/*.markdown; translated prose lives in the language files.
- Project screenshots: img/portfolio/.
- Self-hosted font files and their SIL Open Font License: assets/fonts/.

Keep the original logo at img/logos/skyvault.png unchanged. Desktop navigation
uses a side masthead; mobile uses a compact header. Automation and training are
separate, permanently visible sections, not collapsed disclosures. Project
details use native details/summary and also work without JavaScript. Archived
projects deliberately have no outbound link. The unlinked /send_cv/ legacy form
retains its separate Bootstrap assets and is not part of the marketing homepage.

Contact service
---------------

The form retains https://skyvault.dopice.sk/contact_me.php and its URL-encoded
POST fields: name, email, phone and message. The PHP service permits the production
origin, so a real submission from localhost is blocked by CORS.

The legacy success contract includes an empty HTTP 200 body. Explicit success
tokens also work; unexpected output, non-2xx responses and network failures
show an error and preserve the visitor's input. Empty-200 responses cannot prove
inbox delivery; a stronger guarantee needs a change to the mail service.

Deployment
----------

GitHub Pages builds the master branch of skyvault-ee/skyvault-ee.github.io.
It does not run npm. Run the local build and tests, then commit the generated
assets/css/site.css together with template/CSS source changes before pushing.

    npm run build
    npm test
    git push origin master

Keep CNAME as www.skyvault.ee. Verify the Pages build and all four live routes
after pushing; a successful push alone does not prove deployment.

Never publish node_modules, test reports, local .hermes notes, or the unrelated
specialists.markdown and _layouts/outsourcing.html drafts. They are excluded in
_config.yml. The legacy theme remains in the repository only for /send_cv/.

Managed website offer (Slovak only)
-----------------------------------

- Offer page: /sk/web-so-spravou/ (sk/web-so-spravou/index.html, _layouts/landing.html).
  Price, scope, FAQ and navigation live in _data/offers/managed-web-sk.yml; change
  them only together with the written offer.
- Proof card: U Bronďaka, explicitly a pre-launch preview, links to
  https://mac-studio.tail26a69.ts.net/ubrondaka/ at the owner's request.
  Screenshot: img/portfolio/ubrondaka-preview.jpg. Do not relabel as live or
  switch to the restaurant's production domain until deployment is verified.
- Original illustrative sample (no longer linked from the offer):
  /sk/ukazky/remeselnik/. Fictional brand, noindex, excluded
  from the sitemap. Its enquiry form is a local simulation (assets/js/managed-demo.js)
  with no action, method, fetch or storage; without JavaScript both fields and
  the button stay disabled. Input is enabled only after the no-send handler is installed.
- The global menu keeps the same labels and order on the SK homepage, offer and
  privacy notice. Web so správou is an always-visible child of Služby; only the
  current page link receives aria-current="page", and that page's own sections
  (offer `nav` in the YAML) nest under it. Kontakt, the last item, targets the
  page's own #contact form unless the page sets `contact: false`, then the
  locale homepage form. AI marketing is promoted by colour only.
- Desktop sidebar: only the link list scrolls; logo and language control stay
  on screen, the language dropdown opens upward. Below 50rem viewport height
  the caption hides and the logo shrinks. Mobile panels scroll within short
  viewports and retain native no-JS disclosure.
- /sk/ochrana-udajov/ uses the landing shell with `contact: false`,
  `robots: noindex` (injected by landing.html) and `sitemap: false`; its notice
  text lives unchanged inside `.legal-prose`.
  The first service card also links the offer. Other locales retain their own
  global menu and must not link the SK offer as a translation.
- head.html prints hreflang alternates only on the four language homepages.
- The landing page reuses the existing contact form, endpoint and four fields.
- Tests: tests/managed-web.spec.cjs and tests/managed-demo.spec.cjs. They write
  review screenshots to test-results/managed-*.png.

### Managed website release gates

The page is implemented for private preview. Before publishing it:

- [ ] Commercial: written offer and terms that state page/section scope,
      launch schedule, extra-work price, cancellation/notice and file handover
      match the FAQ on the page.
- [ ] Price: confirm 199 € + 29 €/month, tax treatment and domain charging with
      the approved commercial document (weby pilot scope).
- [ ] Operations: production hosting, HTTPS, deploy and recovery for customer
      sites demonstrated; "Štandardné spustenie na dohodnutej doméne" is an
      acceptance commitment, not yet evidenced.
- [ ] Contact delivery: authorized, labelled inbox test of the real
      contact_me.php endpoint from the production origin (tests only mock it).
      Phone stays required until the endpoint is verified to accept it empty.
- [ ] Privacy: legal review of the general contact-form paragraph added to
      /sk/ochrana-udajov/ (processor, retention, recipients). The notice is not
      certified compliant; a separate general privacy policy/terms page may be needed.
- [ ] Human copy review of the Slovak text and visual review of the screenshots.
- [ ] Do not add Offer/Review JSON-LD until price and availability are approved.
- [ ] Do not expose unapproved prospect previews or bearer URLs. U Bronďaka's
      non-token Tailscale preview is explicitly approved for this review page;
      reassess preview availability and publication permission before public launch.
