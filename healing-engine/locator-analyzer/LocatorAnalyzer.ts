import { Page } from '@playwright/test';

export interface LocatorFailure {
  originalLocator: string;
  locatorType: 'id' | 'class' | 'text' | 'css' | 'xpath';
  url: string;
  timestamp: Date;
  error: string;
}

export class LocatorAnalyzer {
  constructor(private page: Page) {}

  async captureFailure(locator: string, error: string): Promise<LocatorFailure> {
    return {
      originalLocator: locator,
      locatorType: this.determineLocatorType(locator),
      url: this.page.url(),
      timestamp: new Date(),
      error
    };
  }

  determineLocatorType(locator: string): 'id' | 'class' | 'text' | 'css' | 'xpath' {
    if (locator.startsWith('#')) return 'id';
    if (locator.startsWith('.')) return 'class';
    if (locator.startsWith('//') || locator.startsWith('xpath=')) return 'xpath';
    if (locator.startsWith('text=')) return 'text';
    return 'css';
  }

  async getPageDomSnapshot(): Promise<string> {
    return await this.page.content();
  }
}
