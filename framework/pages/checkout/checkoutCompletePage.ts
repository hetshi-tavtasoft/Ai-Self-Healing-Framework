import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class CheckoutComplete extends BasePage {
  static locators = {
    title: '.complete-header',
  } as const;

  readonly title: string;

  constructor(page: Page) {
    super(page, 'CheckoutCompletePage');
    this.title = CheckoutComplete.locators.title;
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }
}