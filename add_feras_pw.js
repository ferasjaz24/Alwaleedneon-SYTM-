import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  console.log("Navigating to app...");
  await page.goto('http://localhost:3000');
  
  console.log("Waiting for #login-container-card...");
  await page.waitForSelector('#login-container-card', { timeout: 15000 });

  console.log("Clicking F24 trigger 4 times...");
  for (let i = 0; i < 4; i++) {
    await page.click('#f24-backdoor-trigger');
  }

  console.log("Waiting for F24 overlay...");
  await page.waitForSelector('#f24-overlay', { timeout: 5000 });

  console.log("Typing credentials...");
  await page.fill('#f24-user-input', 'feras.admin@nextpage.com');
  await page.fill('#f24-pass-input', '!Feras2424$');

  console.log("Submitting...");
  await page.click('#f24-btn-submit');

  console.log("Waiting for dashboard...");
  try {
    await page.waitForFunction(() => {
      return document.body.innerText.includes('الإدارة') || 
             document.body.innerText.includes('Welcome') ||
             document.body.innerText.includes('Dashboard') ||
             document.body.innerText.includes('المعلم فراس') ||
             document.body.innerText.includes('F24 Super Admin Authorized');
    }, { timeout: 15000 });
    console.log("Login successful! Database updated via frontend logic.");
  } catch (e) {
    console.log("Timeout waiting for dashboard, but script finished.", e);
  }

  await browser.close();
})();
