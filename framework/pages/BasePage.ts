import { Page, Locator, expect } from '@playwright/test';
import { RetryEngine } from '@healing/retry-engine/RetryEngine';
import { Logger } from '../utils/logger';

export abstract class BasePage {
  protected page: Page;
  protected retryEngine: RetryEngine;
  protected logger: Logger;
  protected pageName: string;

  constructor(page: Page, pageName: string) {
    this.page = page;
    this.pageName = pageName;
    this.retryEngine = new RetryEngine(page, pageName);
    this.logger = Logger.getInstance();
  }

  protected async click(locator: string, description?: string): Promise<void> {
    this.logger.debug(`Clicking: ${description || locator}`);
    await this.retryEngine.findElementWithRetry(locator, async (loc) => {
      await loc.click();
    }, this.pageName);
  }

  protected async fill(locator: string, value: string, description?: string): Promise<void> {
    this.logger.debug(`Filling ${description || locator} with: ${value}`);
    await this.retryEngine.findElementWithRetry(locator, async (loc) => {
      await loc.fill(value);
    }, this.pageName);
  }

  protected async getText(locator: string, description?: string): Promise<string> {
    this.logger.debug(`Getting text from: ${description || locator}`);
    let text = '';
    await this.retryEngine.findElementWithRetry(locator, async (loc) => {
      text = (await loc.textContent()) || '';
    }, this.pageName);
    return text;
  }

  protected async waitForVisible(locator: string, description?: string): Promise<void> {
    this.logger.debug(`Waiting for visible: ${description || locator}`);
    await this.retryEngine.findElementWithRetry(locator, async (loc) => {
      await loc.waitFor({ state: 'visible' });
    }, this.pageName);
  }

  protected async selectOption(locator: string, option: string, description?: string): Promise<void> {
    this.logger.debug(`Selecting option "${option}" from: ${description || locator}`);
    await this.retryEngine.findElementWithRetry(locator, async (loc) => {
      await loc.selectOption({ label: option });
    }, this.pageName);
  }

  protected getLocator(locator: string): Locator {
    return this.page.locator(locator);
  }

  async navigate(url: string): Promise<void> {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async getTitleText(locator: string): Promise<string> {
    return await this.getText(locator, 'title');
  }
}
