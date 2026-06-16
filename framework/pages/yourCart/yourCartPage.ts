import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class YourCartPage extends BasePage {
  static locators = {
    itemPrice: '.inventory_item_price',
    checkoutButton: '#checkout',
    title: '.title',
  } as const;

  readonly itemPrice: string;
  readonly checkoutButton: string;
  readonly title: string;

  constructor(page: Page) {
    super(page, 'YourCartPage');
    this.itemPrice = YourCartPage.locators.itemPrice;
    this.checkoutButton = YourCartPage.locators.checkoutButton;
    this.title = YourCartPage.locators.title;
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