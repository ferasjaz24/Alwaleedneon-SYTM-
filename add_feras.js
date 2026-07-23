import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Expose a function to tell us when done
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000');
  
  // Wait for the app to load
  await page.waitForSelector('#login-container-card');

  // Trigger F24 by clicking 4 times
  for (let i = 0; i < 4; i++) {
    await page.click('#f24-backdoor-trigger');
  }

  // Wait for modal
  await page.waitForSelector('#f24-overlay');

  // Type credentials
  await page.type('#f24-user-input', 'feras.admin@nextpage.com');
  await page.type('#f24-pass-input', '!Feras2424$');

  // Submit
  await page.click('#f24-btn-submit');

  // Wait for successful login
  await page.waitForFunction(() => {
    return document.body.innerText.includes('مرحباً بك في لوحة تحكم الإدارة') || 
           document.body.innerText.includes('Welcome') ||
           document.body.innerText.includes('Dashboard') ||
           document.body.innerText.includes('المعلم فراس');
  }, { timeout: 10000 }).catch(e => console.log('Timeout waiting for login success'));

  console.log("Script completed");
  await browser.close();
})();
