// Optional local runner when installed Chrome exits between test contexts.
// Preserve all tests/assertions; use Playwright's managed headless Chromium.
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = require('../playwright.config.cjs');

module.exports = {
  ...base,
  testDir: path.join(root, 'tests'),
  outputDir: path.join(root, 'test-results'),
  use: { ...base.use, channel: undefined },
  webServer: base.webServer ? { ...base.webServer, cwd: root } : undefined,
};
