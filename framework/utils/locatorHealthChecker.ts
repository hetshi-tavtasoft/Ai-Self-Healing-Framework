import { Page, Browser, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface LocatorCheck {
  pageName: string;
  locatorName: string;
  locator: string;
  exists: boolean;
  visible: boolean;
  error?: string;
}

export async function checkAllLocators(): Promise<LocatorCheck[]> {
  const browser: Browser = await chromium.launch({ headless: true });
  const results: LocatorCheck[] = [];

  try {
    const page = await browser.newPage();

    const pages: { name: string; url: string; preCheck?: (p: Page) => Promise<void>; checks: { name: string; locator: string }[] }[] = [
      {
        name: 'LoginPage',
        url: 'https://www.saucedemo.com/',
        checks: [
          { name: 'usernameInput', locator: '#user-name' },
          { name: 'passwordInput', locator: '#password' },
          { name: 'loginButton', locator: '#login-button' },
          { name: 'title', locator: '.login_logo' },
        ]
      },
      {
        name: 'ProductPage',
        url: 'https://www.saucedemo.com/inventory.html',
        checks: [
          { name: 'sortingField', locator: '.product_sort_container' },
          { name: 'price', locator: '.inventory_item_price' },
          { name: 'title', locator: '.title' },
          { name: 'cartContainer', locator: 'a.shopping_cart_link' },
        ],
        preCheck: async (p: Page) => {
          await p.goto('https://www.saucedemo.com/');
          await p.fill('#user-name', 'standard_user');
          await p.fill('#password', 'secret_sauce');
          await p.click('#login-button');
          await p.waitForURL('**/inventory.html');
        }
      },
      {
        name: 'YourCartPage',
        url: 'https://www.saucedemo.com/cart.html',
        checks: [
          { name: 'itemPrice', locator: '.inventory_item_price' },
          { name: 'checkoutButton', locator: '#checkout' },
          { name: 'title', locator: '.title' },
        ],
        preCheck: async (p: Page) => {
          await p.goto('https://www.saucedemo.com/');
          await p.fill('#user-name', 'standard_user');
          await p.fill('#password', 'secret_sauce');
          await p.click('#login-button');
          await p.waitForURL('**/inventory.html');
          await page.locator('.inventory_item').first().locator('button').click();
          await page.locator('a.shopping_cart_link').click();
          await p.waitForURL('**/cart.html');
        }
      },
      {
        name: 'CheckoutInformationPage',
        url: 'https://www.saucedemo.com/checkout-step-one.html',
        checks: [
          { name: 'firstName', locator: '#first-name' },
          { name: 'lastName', locator: '#last-name' },
          { name: 'zipcode', locator: '#postal-code' },
          { name: 'continueButton', locator: '#continue' },
          { name: 'title', locator: '.title' },
        ],
        preCheck: async (p: Page) => {
          await p.goto('https://www.saucedemo.com/');
          await p.fill('#user-name', 'standard_user');
          await p.fill('#password', 'secret_sauce');
          await p.click('#login-button');
          await p.waitForURL('**/inventory.html');
          await page.locator('.inventory_item').first().locator('button').click();
          await page.locator('a.shopping_cart_link').click();
          await p.waitForURL('**/cart.html');
          await p.click('#checkout');
          await p.waitForURL('**/checkout-step-one.html');
        }
      },
      {
        name: 'CheckoutOverviewPage',
        url: 'https://www.saucedemo.com/checkout-step-two.html',
        checks: [
          { name: 'productPrice', locator: '.inventory_item_price' },
          { name: 'finishButton', locator: '#finish' },
          { name: 'title', locator: '.title' },
        ],
        preCheck: async (p: Page) => {
          await p.goto('https://www.saucedemo.com/');
          await p.fill('#user-name', 'standard_user');
          await p.fill('#password', 'secret_sauce');
          await p.click('#login-button');
          await p.waitForURL('**/inventory.html');
          await page.locator('.inventory_item').first().locator('button').click();
          await page.locator('a.shopping_cart_link').click();
          await p.waitForURL('**/cart.html');
          await p.click('#checkout');
          await p.waitForURL('**/checkout-step-one.html');
          await p.fill('#first-name', 'John');
          await p.fill('#last-name', 'Doe');
          await p.fill('#postal-code', '12345');
          await p.click('#continue');
          await p.waitForURL('**/checkout-step-two.html');
        }
      },
      {
        name: 'CheckoutCompletePage',
        url: 'https://www.saucedemo.com/checkout-complete.html',
        checks: [
          { name: 'title', locator: '.complete-header' },
        ],
        preCheck: async (p: Page) => {
          await p.goto('https://www.saucedemo.com/');
          await p.fill('#user-name', 'standard_user');
          await p.fill('#password', 'secret_sauce');
          await p.click('#login-button');
          await p.waitForURL('**/inventory.html');
          await page.locator('.inventory_item').first().locator('button').click();
          await page.locator('a.shopping_cart_link').click();
          await p.waitForURL('**/cart.html');
          await p.click('#checkout');
          await p.waitForURL('**/checkout-step-one.html');
          await p.fill('#first-name', 'John');
          await p.fill('#last-name', 'Doe');
          await p.fill('#postal-code', '12345');
          await p.click('#continue');
          await p.waitForURL('**/checkout-step-two.html');
          await p.click('#finish');
          await p.waitForURL('**/checkout-complete.html');
        }
      }
    ];

    for (const pageDef of pages) {
      if (pageDef.preCheck) {
        await pageDef.preCheck(page);
      } else {
        await page.goto(pageDef.url);
        await page.waitForLoadState('networkidle');
      }

      for (const check of pageDef.checks) {
        const result: LocatorCheck = {
          pageName: pageDef.name,
          locatorName: check.name,
          locator: check.locator,
          exists: false,
          visible: false,
        };

        try {
          const el = page.locator(check.locator).first();
          result.exists = await el.count() > 0;
          if (result.exists) {
            result.visible = await el.isVisible();
          }
        } catch (e: any) {
          result.error = e.message;
        }

        results.push(result);
      }
    }

    await page.close();
  } finally {
    await browser.close();
  }

  return results;
}

export function generateHealthReport(results: LocatorCheck[]): string {
  const total = results.length;
  const passed = results.filter(r => r.exists && r.visible).length;
  const failed = total - passed;

  let report = '# Locator Health Report\n\n';
  report += `**Total locators:** ${total}  \n`;
  report += `**Passed:** ${passed}  \n`;
  report += `**Failed:** ${failed}  \n`;
  report += `**Health:** ${(passed / total * 100).toFixed(1)}%\n\n`;

  if (failed > 0) {
    report += '## Failed Locators\n\n';
    report += '| Page | Name | Locator | Issue |\n';
    report += '|------|------|---------|-------|\n';

    for (const r of results.filter(r => !r.exists || !r.visible)) {
      const issue = !r.exists ? 'Not found in DOM' :
                    !r.visible ? 'Not visible' :
                    r.error || 'Unknown';
      report += `| ${r.pageName} | ${r.locatorName} | \`${r.locator}\` | ${issue} |\n`;
    }

    report += '\n';
  }

  report += '## All Locators\n\n';
  report += '| Page | Name | Locator | Status |\n';
  report += '|------|------|---------|--------|\n';

  for (const r of results) {
    const status = r.exists && r.visible ? '✅' : '❌';
    report += `| ${r.pageName} | ${r.locatorName} | \`${r.locator}\` | ${status} |\n`;
  }

  return report;
}

if (require.main === module) {
  checkAllLocators().then(results => {
    const report = generateHealthReport(results);
    const reportPath = path.resolve(__dirname, '../../locator-health-report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(report);

    const failed = results.filter(r => !r.exists || !r.visible);
    if (failed.length > 0) {
      console.error(`\n❌ ${failed.length} locator(s) failed validation.`);
      process.exit(1);
    }
    console.log(`\n✅ All ${results.length} locators passed validation.`);
  }).catch(err => {
    console.error('Locator health check failed:', err);
    process.exit(1);
  });
}
