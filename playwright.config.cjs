const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: process.env.SITE_URL || 'http://127.0.0.1:4178',
    browserName: 'chromium',
    channel: 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.SITE_URL ? undefined : {
    command: 'python3 -m http.server 4178 --bind 127.0.0.1 --directory _site',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: !process.env.CI,
  },
});
