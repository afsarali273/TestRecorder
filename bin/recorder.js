#!/usr/bin/env node
const { launchBrowser } = require('../lib/browserManager');
const yargs = require('yargs');
const fs = require('fs');
const { toPlaywright, toSelenium } = require('../lib/codeGenerator');

const argv = yargs.option('url', { type: 'string', demandOption: true })
                  .option('browser', { type: 'string', default: 'chromium' })
                  .option('replay', { type: 'string', default: '' })
                  .argv;

(async () => {
  const { browser, context, page } = await launchBrowser(argv.browser);
  if (argv.replay) {
    const steps = JSON.parse(fs.readFileSync(argv.replay));
    for (let s of steps) {
      if (s.type === 'click') await page.click(s.selector);
      if (s.type === 'input') await page.fill(s.selector, s.value);
    }
    console.log('Replay finished.');
    await browser.close();
    return;
  }

  // Open recorder UI in a separate detached window (right-aligned)
  const { width: screenWidth, height: screenHeight } = await browser.newContext().then(ctx => 
    ctx.newPage().then(p => p.evaluate(() => ({ width: screen.width, height: screen.height }))).finally(() => ctx.close())
  ).catch(() => ({ width: 1920, height: 1080 }));
  
  const recorderWidth = 650;
  const recorderHeight = screenHeight;
  const recorderX = screenWidth - recorderWidth;
  
  const recorderContext = await browser.newContext({ 
    viewport: { width: recorderWidth, height: recorderHeight },
    screen: { width: recorderWidth, height: recorderHeight }
  });
  const recorderPage = await recorderContext.newPage();
  
  // Position window on the right
  await recorderPage.evaluate(({ x, y, width, height }) => {
    window.moveTo(x, y);
    window.resizeTo(width, height);
  }, { x: recorderX, y: 0, width: recorderWidth, height: recorderHeight });
  
  const path = require('path');
  const recorderUIPath = 'file://' + path.resolve('./recorderScripts/recorderUI.html');
  await recorderPage.goto(recorderUIPath);

  const scriptContent = fs.readFileSync('./recorderScripts/recorderScript.js', 'utf8');
  
  // Function to inject recorder into a page
  const injectRecorder = async (targetPage) => {
    try {
      await targetPage.waitForLoadState('domcontentloaded', { timeout: 5000 });
      
      const hasFunction = await targetPage.evaluate(() => typeof window.sendToRecorder === 'function').catch(() => false);
      
      if (!hasFunction) {
        await targetPage.exposeFunction('sendToRecorder', async (data) => {
          try {
            if (data.action === 'scanResults') {
              await recorderPage.evaluate((elements) => {
                if (window.showScanResults) {
                  window.showScanResults(elements);
                }
              }, data.elements);
            } else if (data.event) {
              await recorderPage.evaluate((evt) => {
                window.addEvent(evt);
              }, data.event);
            } else {
              await recorderPage.evaluate((evt) => {
                window.addEvent(evt);
              }, data);
            }
          } catch (err) {
            // Ignore if recorder page is closed
          }
        });
      }
      
      await targetPage.evaluate(scriptContent);
      
      await targetPage.evaluate(() => {
        if (!window.__recorderInitialized) {
          window.__recorderInitialized = true;
          window.addEventListener('message', (e) => {
            if (e.data.source === 'recorder') {
              window.sendToRecorder(e.data.event);
            }
          });
        }
      });
    } catch (err) {
      // Ignore injection errors during navigation
    }
  };

  // Track navigation events
  const trackNavigation = (targetPage) => {
    targetPage.on('framenavigated', async (frame) => {
      if (frame === targetPage.mainFrame()) {
        try {
          const url = frame.url();
          await recorderPage.evaluate((url) => {
            window.addEvent({ type: 'navigation', url, timestamp: Date.now() });
          }, url);
          await injectRecorder(targetPage);
        } catch (err) {
          // Ignore navigation errors
        }
      }
    });
  };

  // Expose scan functions to recorder UI
  await recorderPage.exposeFunction('requestScan', async () => {
    return await page.evaluate(() => {
      if (typeof scanPageElements === 'function') {
        return scanPageElements();
      }
      return [];
    });
  }).catch(() => {});
  
  await recorderPage.exposeFunction('requestScanSection', async () => {
    return await page.evaluate(() => {
      if (typeof window.startSectionScan === 'function') {
        window.startSectionScan();
      }
    });
  }).catch(() => {});

  // Open target page
  await page.goto(argv.url);
  await injectRecorder(page);
  trackNavigation(page);

  // Handle new tabs/popups
  context.on('page', async (newPage) => {
    try {
      await newPage.waitForLoadState('domcontentloaded');
      await injectRecorder(newPage);
      trackNavigation(newPage);
    } catch (err) {
      // Ignore errors for closed pages
    }
  });

  console.log('🎉 Recording started!');
  console.log('🔴 Interact with the webpage. Right-click for assertions.');
  console.log('⏸️  Use Pause/Stop buttons in recorder UI or press ENTER to stop...');

  // Listen for stop action from recorder UI
  let stopRequested = false;
  const checkStop = setInterval(async () => {
    try {
      const state = await recorderPage.evaluate(() => window.getRecorderState()).catch(() => null);
      if (state && state.isStopped && !stopRequested) {
        stopRequested = true;
        clearInterval(checkStop);
        await saveAndClose();
      }
    } catch (err) {
      // Ignore errors
    }
  }, 500);

  const saveAndClose = async () => {
    try {
      const events = await recorderPage.evaluate(() => window.getRecordedEvents());
      
      if (!events || events.length === 0) {
        console.log('⚠️  No events recorded.');
      } else {
        fs.writeFileSync('recordedSteps.json', JSON.stringify(events, null, 2));
        console.log('✅ Recording stopped. Saved recordedSteps.json');
        console.log(`📊 Recorded ${events.length} events`);
        console.log('Playwright code:\n', toPlaywright(events));
        console.log('Selenium code:\n', toSelenium(events));
      }
    } catch (err) {
      console.error('❌ Error saving events:', err.message);
    }
    await browser.close();
    process.exit(0);
  };

  process.stdin.once('data', async () => {
    stopRequested = true;
    clearInterval(checkStop);
    await saveAndClose();
  });
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});