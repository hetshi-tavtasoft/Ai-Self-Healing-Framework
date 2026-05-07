import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login/loginPage';
import { ProductPage } from '../pages/products/productsPage';
import { YourCartPage } from '../pages/yourCart/yourCartPage';
import { CheckoutInformation } from '../pages/checkout/checkoutInformationPage';
import { CheckoutOverview } from '../pages/checkout/checkoutOverviewPage';
import { CheckoutComplete } from '../pages/checkout/checkoutCompletePage';

type PageFixtures = {
  loginPage: LoginPage;
  productPage: ProductPage;
  yourCartPage: YourCartPage;
  checkoutInformationPage: CheckoutInformation;
  checkoutOverviewPage: CheckoutOverview;
  checkoutCompletePage: CheckoutComplete;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  yourCartPage: async ({ page }, use) => {
    await use(new YourCartPage(page));
  },
  checkoutInformationPage: async ({ page }, use) => {
    await use(new CheckoutInformation(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverview(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutComplete(page));
  },
});

export { expect } from '@playwright/test';
