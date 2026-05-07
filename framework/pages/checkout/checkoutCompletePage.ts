import { type Page, type Locator } from '@playwright/test';

export class CheckoutComplete {
  readonly page: Page;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.complete-header');
  }

  async getTitleText(): Promise<string> {
    return (await this.title.first().textContent()) ?? '';
  }
}