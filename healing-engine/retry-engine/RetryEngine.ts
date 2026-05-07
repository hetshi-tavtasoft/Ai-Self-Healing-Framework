import { Page, Locator } from '@playwright/test';
import { LocatorAnalyzer, LocatorFailure } from '../locator-analyzer/LocatorAnalyzer';
import { DomParser } from '../dom-parser/DomParser';
import { SimilarityEngine } from '../similarity-engine/SimilarityEngine';
import { config } from '../../framework/config/config';
import { Logger } from '../../framework/utils/logger';

export class RetryEngine {
  private analyzer: LocatorAnalyzer;
  private domParser: DomParser;
  private similarityEngine: SimilarityEngine;
  private logger: Logger;

  constructor(private page: Page) {
    this.analyzer = new LocatorAnalyzer(page);
    this.domParser = new DomParser(page);
    this.similarityEngine = new SimilarityEngine();
    this.logger = Logger.getInstance();
  }

  async findElementWithRetry(
    originalLocator: string,
    action: (locator: Locator) => Promise<void>
  ): Promise<boolean> {
    const maxRetries = config.healing.maxRetries;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const locator = this.page.locator(originalLocator);
        await locator.first().waitFor({ timeout: 5000 });
        await action(locator);
        return true;
      } catch (error) {
        this.logger.warn(`Locator failed (attempt ${attempt + 1}/${maxRetries}): ${originalLocator}`);
        
        if (attempt === maxRetries - 1) {
          await this.handleLocatorFailure(originalLocator, error as Error);
          return false;
        }
        
        await this.attemptHealing(originalLocator);
        await this.page.waitForTimeout(1000);
      }
    }
    
    return false;
  }

  private async handleLocatorFailure(locator: string, error: Error): Promise<void> {
    const failure = await this.analyzer.captureFailure(locator, error.message);
    this.logger.error(`Locator failed permanently: ${locator}`, failure);
  }

  private async attemptHealing(locator: string): Promise<void> {
    this.logger.info(`Attempting to heal locator: ${locator}`);
  }
}
