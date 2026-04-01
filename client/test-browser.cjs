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
    
    console.log('Navigating to http://localhost:5173/learn/lexer...');
    await page.goto('http://localhost:5173/learn/lexer', { timeout: 30000 });
    
    console.log('Waiting 5 seconds for React to mount and errors to surface...');
    await new Promise(r => setTimeout(r, 5000));

    await browser.close();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Puppeteer Script Error:', err);
    process.exit(1);
  }
})();
