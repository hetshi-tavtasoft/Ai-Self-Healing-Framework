import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class CheckoutOverview extends BasePage {
  readonly title: string;
  readonly productPrice: string;
  readonly finishButton: string;

  constructor(page: Page) {
    super(page, 'CheckoutOverviewPage');
    this.title = '.title';
    this.productPrice = '.inventory_item_price';
    this.finishButton = '#finish';
  }

  async getProductPrice(): Promise<number> {
    const priceText = await this.getText(this.productPrice, 'product price');
    return parseFloat(priceText.replace('$', ''));
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }

  async clickOnFinishButton(): Promise<void> {
    await this.click(this.finishButton, 'finish button');
  }
}