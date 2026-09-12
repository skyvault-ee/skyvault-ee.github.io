Skyvault website
===============

https://www.skyvault.ee

A static Jekyll site with compiled Tailwind CSS 4, self-hosted Manrope fonts,
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

Projects and training sections use native details/summary disclosures, so the
content remains available without JavaScript. Archived projects deliberately
have no outbound link. The unlinked /send_cv/ legacy form retains its separate
Bootstrap assets and is not part of the marketing homepage.

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
