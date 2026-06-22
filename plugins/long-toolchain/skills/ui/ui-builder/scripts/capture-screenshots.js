/**
 * Capture screenshots of a URL at multiple breakpoints.
 *
 * Usage (from Playwright script or terminal):
 *   node capture-screenshots.js <url> [output-dir]
 *
 * Breakpoints captured: Mobile (375), Tablet (768), Desktop (1440), Wide (1920)
 */

const { chromium } = require('playwright');
const path = require('path');

const BREAKPOINTS = [
  { name: 'mobile',  width: 375,  height: 812 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide',    width: 1920, height: 1080 },
];

const HIDE_DYNAMIC_CSS = `
  [data-dynamic], .timestamp, .avatar, .ad, [role="timer"],
  iframe, video, [data-testid="live-indicator"] {
    visibility: hidden !important;
  }
`;

async function captureScreenshots(url, outputDir = 'screenshots/reference') {
  const browser = await chromium.launch();

  for (const bp of BREAKPOINTS) {
    const context = await browser.newContext({
      viewport: { width: bp.width, height: bp.height },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Full-page screenshot
    const fullPath = path.join(outputDir, `${bp.name}-full.png`);
    await page.screenshot({
      path: fullPath,
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      style: HIDE_DYNAMIC_CSS,
    });
    console.log(`  Captured: ${fullPath} (${bp.width}x${bp.height})`);

    // Viewport-only screenshot
    const vpPath = path.join(outputDir, `${bp.name}-viewport.png`);
    await page.screenshot({
      path: vpPath,
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      style: HIDE_DYNAMIC_CSS,
    });
    console.log(`  Captured: ${vpPath} (viewport only)`);

    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured.');
}

// CLI entry point
if (require.main === module) {
  const url = process.argv[2];
  const outputDir = process.argv[3] || 'screenshots/reference';
  if (!url) {
    console.error('Usage: node capture-screenshots.js <url> [output-dir]');
    process.exit(1);
  }
  captureScreenshots(url, outputDir).catch((err) => {
    console.error('Capture failed:', err.message);
    process.exit(1);
  });
}

module.exports = { captureScreenshots, BREAKPOINTS, HIDE_DYNAMIC_CSS };
