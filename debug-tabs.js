const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Navigating to products page ===');
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('\n=== Getting all tab text on the page ===');
  const tabs = await page.locator('[role="tab"], button, a').all();
  console.log(`Found ${tabs.length} interactive elements`);
  for (const tab of tabs.slice(0, 30)) {
    const text = await tab.textContent().catch(() => '');
    const className = await tab.getAttribute('class').catch(() => '');
    if (text.trim()) {
      console.log(`  - "${text.trim()}" (class: ${className.slice(0, 50)})`);
    }
  }

  console.log('\n=== Looking for any "Desty" text on the page ===');
  const destyElements = await page.locator('text=/Desty/i').all();
  for (const el of destyElements) {
    const text = await el.textContent().catch(() => '');
    console.log(`  Found: "${text.trim()}"`);
  }

  console.log('\n=== Looking for "Produk" text on the page ===');
  const produkElements = await page.locator('text=/Produk/i').all();
  for (const el of produkElements.slice(0, 10)) {
    const text = await el.textContent().catch(() => '');
    console.log(`  Found: "${text.trim()}"`);
  }

  console.log('\n=== Looking for "Sync" text on the page ===');
  const syncElements = await page.locator('text=/Sync/i').all();
  for (const el of syncElements) {
    const text = await el.textContent().catch(() => '');
    console.log(`  Found: "${text.trim()}"`);
  }

  console.log('\n=== Page HTML structure (first 5000 chars) ===');
  const html = await page.content();
  console.log(html.slice(0, 5000));

  await browser.close();
})();
