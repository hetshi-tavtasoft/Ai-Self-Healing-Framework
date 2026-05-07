import { type Page, type Locator } from '@playwright/test';

export class YourCartPage {
  readonly page: Page;
  readonly itemPrice: Locator;
  readonly checkoutButton: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.itemPrice = page.locator('.inventory_item_price');
    this.checkoutButton = page.locator('#checkout');
    this.title = page.locator('.title');
  }

  async getPrice(): Promise<number> {
    const priceText = await this.itemPrice.textContent();
    return parseFloat(priceText!.replace('$', ''));
  }

  async clickOnCheckoutButton(): Promise<void> {
    await this.checkoutButton.click();
  }

  async getTitleText(): Promise<string> {
    return (await this.title.first().textContent()) ?? '';
  }
}