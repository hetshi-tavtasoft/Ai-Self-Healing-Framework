import { Page, Browser, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';
import { LoginPage } from '../pages/login/loginPage';
import { ProductPage } from '../pages/products/productsPage';
import { YourCartPage } from '../pages/yourCart/yourCartPage';
import { CheckoutInformation } from '../pages/checkout/checkoutInformationPage';
import { CheckoutOverview } from '../pages/checkout/checkoutOverviewPage';
import { CheckoutComplete } from '../pages/checkout/checkoutCompletePage';

interface LocatorCheck {
  pageName: string;
  locatorName: string;
  locator: string;
  exists: boolean;
  visible: boolean;
  error?: string;
}

interface PageCheckDef {
  name: string;
  pageClass: { new (page: Page): unknown; locators: Record<string, string> };
  url: string;
  preCheck?: (p: Page) => Promise<void>;
}

const pageCheckDefs: PageCheckDef[] = [
  { name: 'LoginPage', pageClass: LoginPage, url: 'https://www.saucedemo.com/' },
  {
    name: 'ProductPage',
    pageClass: ProductPage,
    url: 'https://www.saucedemo.com/inventory.html',
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
    pageClass: YourCartPage,
    url: 'https://www.saucedemo.com/cart.html',
    preCheck: async (p: Page) => {
      await p.goto('https://www.saucedemo.com/');
      await p.fill('#user-name', 'standard_user');
      await p.fill('#password', 'secret_sauce');
      await p.click('#login-button');
      await p.waitForURL('**/inventory.html');
      await p.locator('.inventory_item').first().locator('button').click();
      await p.locator('a.shopping_cart_link').click();
      await p.waitForURL('**/cart.html');
    }
  },
  {
    name: 'CheckoutInformationPage',
    pageClass: CheckoutInformation,
    url: 'https://www.saucedemo.com/checkout-step-one.html',
    preCheck: async (p: Page) => {
      await p.goto('https://www.saucedemo.com/');
      await p.fill('#user-name', 'standard_user');
      await p.fill('#password', 'secret_sauce');
      await p.click('#login-button');
      await p.waitForURL('**/inventory.html');
      await p.locator('.inventory_item').first().locator('button').click();
      await p.locator('a.shopping_cart_link').click();
      await p.waitForURL('**/cart.html');
      await p.click('#checkout');
      await p.waitForURL('**/checkout-step-one.html');
    }
  },
  {
    name: 'CheckoutOverviewPage',
    pageClass: CheckoutOverview,
    url: 'https://www.saucedemo.com/checkout-step-two.html',
    preCheck: async (p: Page) => {
      await p.goto('https://www.saucedemo.com/');
      await p.fill('#user-name', 'standard_user');
      await p.fill('#password', 'secret_sauce');
      await p.click('#login-button');
      await p.waitForURL('**/inventory.html');
      await p.locator('.inventory_item').first().locator('button').click();
      await p.locator('a.shopping_cart_link').click();
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
    pageClass: CheckoutComplete,
    url: 'https://www.saucedemo.com/checkout-complete.html',
    preCheck: async (p: Page) => {
      await p.goto('https://www.saucedemo.com/');
      await p.fill('#user-name', 'standard_user');
      await p.fill('#password', 'secret_sauce');
      await p.click('#login-button');
      await p.waitForURL('**/inventory.html');
      await p.locator('.inventory_item').first().locator('button').click();
      await p.locator('a.shopping_cart_link').click();
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

export async function checkAllLocators(): Promise<LocatorCheck[]> {
  const browser: Browser = await chromium.launch({ headless: true });
  const results: LocatorCheck[] = [];

  try {
    const page = await browser.newPage();

    for (const pageDef of pageCheckDefs) {
      const pageLocators = pageDef.pageClass.locators;

      if (pageDef.preCheck) {
        await pageDef.preCheck(page);
      } else {
        await page.goto(pageDef.url);
        await page.waitForLoadState('networkidle');
      }

      for (const [locatorName, locatorValue] of Object.entries(pageLocators)) {
        const result: LocatorCheck = {
          pageName: pageDef.name,
          locatorName,
          locator: locatorValue,
          exists: false,
          visible: false,
        };

        try {
          const el = page.locator(locatorValue).first();
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
      console.error(`\n⚠️  ${failed.length} locator(s) failed validation.`);
      if (config.healthCheck.abortOnFailure) {
        console.error('Aborting due to healthCheck.abortOnFailure = true');
        process.exit(1);
      }
      console.error('Tests will continue — runtime healing will handle failures dynamically.\n');
    } else {
      console.log(`\n✅ All ${results.length} locators passed validation.\n`);
    }
  }).catch(err => {
    console.error('Locator health check failed:', err);
    process.exit(1);
  });
}
