const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(`[ERROR] ${text}`);
    } else {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });

  console.log('=== STEP 1: Login to the app ===');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check if we're already logged in or on login page
  const loginForm = await page.locator('input[type="email"]').first();
  const isOnLoginPage = await loginForm.isVisible().catch(() => false);

  if (isOnLoginPage) {
    // NOTE: You need to set TEST_EMAIL and TEST_PASSWORD environment variables
    // or update these values for testing
    const email = process.env.TEST_EMAIL || 'admin@carramica.com';
    const password = process.env.TEST_PASSWORD || 'test123456';

    console.log(`Attempting login with: ${email}`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  console.log('\n=== STEP 2: Navigate to products page ===');
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Check if we're on the products page
  const pageContent = await page.content();
  const isLoggedIn = pageContent.includes('Produk Desty') || pageContent.includes('Produk ERM');
  console.log(`Products page loaded: ${isLoggedIn}`);

  if (!isLoggedIn) {
    console.log('ERROR: Could not access products page. Login may have failed.');
    console.log('Please provide valid TEST_EMAIL and TEST_PASSWORD environment variables.');
    await page.screenshot({ path: '/tmp/login-failed.png' });
    await browser.close();
    process.exit(1);
  }

  console.log('\n=== STEP 3: Click "Produk Desty" tab ===');
  const destyTab = await page.locator('Nav.Link', { hasText: 'Produk Desty' }).first();
  const destyTabExists = await destyTab.isVisible().catch(() => false);

  if (!destyTabExists) {
    // Try different selectors
    const tabByText = await page.locator('text=Produk Desty').first();
    const tabByTextVisible = await tabByText.isVisible().catch(() => false);

    if (tabByTextVisible) {
      await tabByText.click();
      console.log('Clicked "Produk Desty" using text selector');
    } else {
      console.log('ERROR: Produk Desty tab not found');
      await page.screenshot({ path: '/tmp/no-desty-tab.png', fullPage: true });
    }
  } else {
    await destyTab.click();
    console.log('Clicked "Produk Desty" tab');
  }
  await page.waitForTimeout(2000);

  console.log('\n=== STEP 4: Count products BEFORE sync ===');

  // Count Live products
  const liveButtons = await page.locator('button', { hasText: /Live/ }).all();
  let liveCount = 0;
  for (const btn of liveButtons) {
    const text = await btn.textContent();
    if (text.includes('Live')) {
      liveCount++;
    }
  }
  console.log(`Live button found: ${liveCount > 0}`);

  // Look for status filter buttons with counts
  const allProductsBadge = await page.locator('text=/Semua.*\\d+/').textContent().catch(() => 'Not found');
  const destyProductsBadge = await page.locator('text=/Produk Desty.*\\d+/').textContent().catch(() => 'Not found');
  const liveBadge = await page.locator('text=/Live.*\\d+/').textContent().catch(() => 'Not found');
  const holdBadge = await page.locator('text=/Hold.*\\d+/').textContent().catch(() => 'Not found');

  console.log(`All Products badge: ${allProductsBadge}`);
  console.log(`Desty Products badge: ${destyProductsBadge}`);
  console.log(`Live badge: ${liveBadge}`);
  console.log(`Hold badge: ${holdBadge}`);

  // Count rows in the table
  const tableRows = await page.locator('tbody tr').all();
  console.log(`Table rows visible: ${tableRows.length}`);

  // Check current status distribution from table
  let liveProductsBefore = 0;
  let holdProductsBefore = 0;

  for (const row of tableRows) {
    const rowText = await row.textContent();
    // Check for status badges in the row
    if (rowText.includes('bg-success') || rowText.includes('Live') || rowText.includes('🟢')) {
      liveProductsBefore++;
    }
    if (rowText.includes('bg-warning') || rowText.includes('Hold') || rowText.includes('🟡')) {
      holdProductsBefore++;
    }
  }
  console.log(`Before sync - Live products visible: ${liveProductsBefore}`);
  console.log(`Before sync - Hold products visible: ${holdProductsBefore}`);

  console.log('\n=== STEP 5: Click "Sync Produk Desty" button ===');
  const syncButton = await page.locator('button', { hasText: 'Sync Produk Desty' }).first();
  const syncButtonExists = await syncButton.isVisible().catch(() => false);
  console.log(`Sync button visible: ${syncButtonExists}`);

  if (!syncButtonExists) {
    // Try to find by title or class
    const allButtons = await page.locator('button').all();
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const title = await btn.getAttribute('title');
      if (text.includes('Sync') || (title && title.includes('Sync'))) {
        console.log(`Found sync button: "${text}" (title: ${title})`);
      }
    }
  }

  if (syncButtonExists) {
    await syncButton.click();
    console.log('Sync button clicked, waiting for sync to complete...');

    // Wait for syncing to start (button should show "Sync..." text)
    await page.waitForTimeout(5000);

    // Wait for syncing to complete (button should no longer be disabled)
    let maxWait = 60000; // 60 seconds max
    let waited = 0;
    while (waited < maxWait) {
      const isDisabled = await syncButton.isDisabled().catch(() => true);
      if (!isDisabled) {
        console.log('Sync completed (button no longer disabled)');
        break;
      }
      await page.waitForTimeout(2000);
      waited += 2000;
    }

    if (waited >= maxWait) {
      console.log('WARNING: Sync may still be in progress after 60 seconds');
    }

    // Wait for any async operations to complete
    await page.waitForTimeout(3000);
  } else {
    console.log('ERROR: Sync button not found!');
  }

  console.log('\n=== STEP 6: Check console logs for SYNC messages ===');
  const syncLogs = consoleLogs.filter(log =>
    log.includes('[SYNC]') ||
    log.includes('SYNC') ||
    log.includes('Sinkronisasi') ||
    log.includes('Desty')
  );

  if (syncLogs.length > 0) {
    console.log('SYNC-related logs:');
    syncLogs.forEach(log => console.log(`  ${log}`));
  } else {
    console.log('No SYNC-related logs found in console');
  }

  console.log('\n=== STEP 7: Count products AFTER sync ===');
  await page.waitForTimeout(2000);

  // Refresh counts from UI
  const allProductsBadgeAfter = await page.locator('text=/Semua.*\\d+/').textContent().catch(() => 'Not found');
  const destyProductsBadgeAfter = await page.locator('text=/Produk Desty.*\\d+/').textContent().catch(() => 'Not found');
  const liveBadgeAfter = await page.locator('text=/Live.*\\d+/').textContent().catch(() => 'Not found');
  const holdBadgeAfter = await page.locator('text=/Hold.*\\d+/').textContent().catch(() => 'Not found');

  console.log(`After sync - All Products: ${allProductsBadgeAfter}`);
  console.log(`After sync - Desty Products: ${destyProductsBadgeAfter}`);
  console.log(`After sync - Live: ${liveBadgeAfter}`);
  console.log(`After sync - Hold: ${holdBadgeAfter}`);

  // Re-count table rows
  const tableRowsAfter = await page.locator('tbody tr').all();
  console.log(`After sync - Table rows: ${tableRowsAfter.length}`);

  // Count by status
  let liveProductsAfter = 0;
  let holdProductsAfter = 0;

  for (const row of tableRowsAfter) {
    const rowText = await row.textContent();
    if (rowText.includes('bg-success') || rowText.includes('Live') || rowText.includes('🟢')) {
      liveProductsAfter++;
    }
    if (rowText.includes('bg-warning') || rowText.includes('Hold') || rowText.includes('🟡')) {
      holdProductsAfter++;
    }
  }
  console.log(`After sync - Live products visible: ${liveProductsAfter}`);
  console.log(`After sync - Hold products visible: ${holdProductsAfter}`);

  console.log('\n=== STEP 8: Check for error messages ===');
  if (consoleErrors.length > 0) {
    console.log('Console errors:');
    consoleErrors.forEach(err => console.log(`  ${err}`));
  } else {
    console.log('No console errors detected');
  }

  // Save screenshot
  await page.screenshot({ path: '/tmp/desty-sync-result.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/desty-sync-result.png');

  await browser.close();
  console.log('\n=== Test Complete ===');

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Before sync: Live=${liveProductsBefore}, Hold=${holdProductsBefore}`);
  console.log(`After sync: Live=${liveProductsAfter}, Hold=${holdProductsAfter}`);
  if (consoleErrors.length === 0) {
    console.log('Sync completed without errors');
  } else {
    console.log(`Sync completed with ${consoleErrors.length} error(s)`);
  }
})();
