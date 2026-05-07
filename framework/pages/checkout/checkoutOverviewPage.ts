import { type Page, type Locator } from '@playwright/test';

export class CheckoutOverview {
  readonly page: Page;
  readonly title: Locator;
  readonly productPrice: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.productPrice = page.locator('.inventory_item_price');
    this.finishButton = page.locator('#finish');
  }

  async getProductPrice(): Promise<number> {
    const priceText = await this.productPrice.textContent();
    return parseFloat(priceText!.replace('$', ''));
  }

  async getTitleText(): Promise<string> {
    return (await this.title.first().textContent()) ?? '';
  }

  async clickOnFinishButton(): Promise<void> {
    await this.finishButton.click();
  }
}