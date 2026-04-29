const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.toString());
    });
    
    console.log('Navigating to http://localhost:5173/app/learners...');
    await page.goto('http://localhost:5173/app/learners', { timeout: 30000 });

    await page.waitForSelector('button');
    const startButton = await page.$$eval('button', (btns) => {
      const target = btns.find((btn) => btn.textContent && btn.textContent.includes('Start Process'));
      if (!target) return null;
      target.click();
      return true;
    });
    if (!startButton) throw new Error('Start Process button not found');
    await new Promise((r) => setTimeout(r, 1500));

    const tabIds = ['tokens', 'automata', 'parser', 'grammar', 'parsetree', 'semantic', 'codegen'];
    for (const id of tabIds) {
      const selector = `#learn-tab-${id}`;
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      await new Promise((r) => setTimeout(r, 250));
    }

    console.log('Learner tab smoke test complete.');

    await browser.close();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Puppeteer Script Error:', err);
    process.exit(1);
  }
})();
