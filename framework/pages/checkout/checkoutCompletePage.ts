import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class CheckoutComplete extends BasePage {
  readonly title: string;

  constructor(page: Page) {
    super(page, 'CheckoutCompletePage');
    this.title = '.complete-header';
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }
}