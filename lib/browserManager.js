const { chromium, firefox, webkit } = require('playwright');

async function launchBrowser(browserType = 'chromium') {
  let browser;
  if (browserType === 'chromium') browser = await chromium.launch({ headless: false });
  else if (browserType === 'firefox') browser = await firefox.launch({ headless: false });
  else if (browserType === 'webkit') browser = await webkit.launch({ headless: false });

  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, context, page };
}

module.exports = { launchBrowser };