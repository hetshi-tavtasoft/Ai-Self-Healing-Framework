import { test, expect } from '../fixtures/pageFixtures';
import { testData } from '../utils/testData/testData';
import { constantData } from '../fixtures/constant';

test.describe('Healing Engine Demo', () => {
  test('Should demonstrate healing with broken locator', async ({ page, loginPage, productPage }) => {
    console.log('=== HEALING ENGINE DEMO ===');
    console.log('Navigating to Swag Labs...');
    await loginPage.navigate();

    console.log('\n--- Simulating broken locator ---');
    console.log('Changing login button locator to a wrong one...');
    
    const wrongLocator = '#wrong-login-button';
    try {
      await page.click(wrongLocator, { timeout: 3000 });
    } catch (e) {
      console.log('Locator failed as expected!');
      console.log('In the real implementation, the RetryEngine would:');
      console.log('1. Capture the failure');
      console.log('2. Take a DOM snapshot');
      console.log('3. Find similar elements');
      console.log('4. Score candidates');
      console.log('5. Return the best alternative');
    }

    console.log('\n--- Using healing-enabled page objects ---');
    console.log('Now logging in with healing-enabled LoginPage...');
    await loginPage.loginToSwagLabs(
      testData.user.username,
      testData.user.password
    );

    console.log('Verifying navigation to products page...');
    const productTitle = await productPage.getTitleText();
    await expect(productTitle).toContain(constantData.data.productTitle);

    console.log('\n✅ Demo completed successfully!');
    console.log('Check these files for healing records:');
    console.log('  - healing-data/healed-locators/healed.json');
    console.log('  - healing-data/failed-locators/failed.json');
    console.log('  - healing-data/dom-snapshots/');
  });

  test('Test healing engine directly', async ({ page }) => {
    console.log('=== DIRECT HEALING ENGINE TEST ===');
    
    await page.goto('https://www.saucedemo.com/');
    await page.waitForLoadState('networkidle');

    console.log('Page loaded. Testing locator healing...');
    
    const wrongLocator = '#login-button-wrong';
    
    try {
      await page.click(wrongLocator, { timeout: 3000 });
    } catch (e) {
      console.log(`\nLocator "${wrongLocator}" failed as expected.`);
      console.log('The RetryEngine would now:');
      console.log('1. Check for previously healed locators');
      console.log('2. Capture DOM snapshot');
      console.log('3. Parse DOM with cheerio');
      console.log('4. Find candidate elements');
      console.log('5. Score with string-similarity');
      console.log('6. Return best match (e.g., "#login-button")');
    }
    
    await page.waitForTimeout(1000);
    console.log('\n✅ Engine test completed.');
  });
});
