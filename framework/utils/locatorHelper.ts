import { Page, Locator } from '@playwright/test';

export class LocatorHelper {
  constructor(private page: Page) {}

  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async getElementText(selector: string): Promise<string | null> {
    const element = this.getLocator(selector);
    return await element.textContent();
  }

  async isElementPresent(selector: string, timeout = 5000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  buildSelector(type: 'id' | 'class' | 'text' | 'css' | 'xpath', value: string): string {
    switch (type) {
      case 'id':
        return `#${value}`;
      case 'class':
        return `.${value}`;
      case 'text':
        return `text="${value}"`;
      case 'css':
        return value;
      case 'xpath':
        return value;
      default:
        return value;
    }
  }
}
