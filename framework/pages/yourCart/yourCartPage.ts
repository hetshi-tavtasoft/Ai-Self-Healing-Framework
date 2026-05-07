import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class YourCartPage extends BasePage {
  readonly itemPrice: string;
  readonly checkoutButton: string;
  readonly title: string;

  constructor(page: Page) {
    super(page, 'YourCartPage');
    this.itemPrice = '.inventory_item_price';
    this.checkoutButton = '#checkout';
    this.title = '.title';
  }

  async getPrice(): Promise<number> {
    const priceText = await this.getText(this.itemPrice, 'item price');
    return parseFloat(priceText.replace('$', ''));
  }

  async clickOnCheckoutButton(): Promise<void> {
    await this.click(this.checkoutButton, 'checkout button');
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }
}