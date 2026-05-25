const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1920 });
  const filePath = 'file://' + path.resolve(__dirname, 'grafica-wsp.html');
  await page.goto(filePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // wait for fonts
  await page.screenshot({
    path: path.resolve(__dirname, 'polla-mundialera-2026.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1080, height: 1920 }
  });
  await browser.close();
  console.log('PNG generado: polla-mundialera-2026.png');
})();
