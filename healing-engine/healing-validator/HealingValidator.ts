import { Page, Locator } from '@playwright/test';
import { Logger } from '../../framework/utils/logger';

export interface ValidationResult {
  isValid: boolean;
  locator: string;
  reason: string;
  details?: {
    count: number;
    isVisible: boolean;
    isClickable: boolean;
    hasText: boolean;
    text?: string;
  };
}

export class HealingValidator {
  private page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = Logger.getInstance();
  }

  async validate(
    locatorString: string,
    expectedText?: string,
    options?: {
      requireVisible?: boolean;
      requireClickable?: boolean;
      requireUnique?: boolean;
    }
  ): Promise<ValidationResult> {
    const opts = {
      requireVisible: true,
      requireClickable: false,
      requireUnique: true,
      ...options
    };

    this.logger.info(`Validating healed locator: ${locatorString}`);

    try {
      const locator = this.page.locator(locatorString);
      const count = await locator.count();

      const details: ValidationResult['details'] = {
        count,
        isVisible: false,
        isClickable: false,
        hasText: false
      };

      if (count === 0) {
        return {
          isValid: false,
          locator: locatorString,
          reason: 'Element not found (count = 0)',
          details
        };
      }

      if (opts.requireUnique && count > 1) {
        this.logger.warn(`Locator matches ${count} elements, not unique`);
        return {
          isValid: false,
          locator: locatorString,
          reason: `Locator matches ${count} elements (not unique)`,
          details: { ...details, count }
        };
      }

      const firstElement = locator.first();

      if (opts.requireVisible) {
        const isVisible = await firstElement.isVisible().catch(() => false);
        details.isVisible = isVisible;
        
        if (!isVisible) {
          return {
            isValid: false,
            locator: locatorString,
            reason: 'Element is not visible',
            details
          };
        }
      }

      if (opts.requireClickable) {
        const isClickable = await this.isClickable(firstElement);
        details.isClickable = isClickable;
        
        if (!isClickable) {
          return {
            isValid: false,
            locator: locatorString,
            reason: 'Element is not clickable',
            details
          };
        }
      }

      if (expectedText) {
        const text = await firstElement.textContent().catch(() => null);
        details.text = text || undefined;
        details.hasText = text ? text.includes(expectedText) : false;
        
        if (!details.hasText) {
          return {
            isValid: false,
            locator: locatorString,
            reason: `Text mismatch: expected "${expectedText}", got "${text || 'null'}"`,
            details
          };
        }
      }

      return {
        isValid: true,
        locator: locatorString,
        reason: 'All validation checks passed',
        details
      };

    } catch (error: any) {
      return {
        isValid: false,
        locator: locatorString,
        reason: `Validation error: ${error.message}`
      };
    }
  }

  private async isClickable(locator: Locator): Promise<boolean> {
    try {
      const isEnabled = await locator.isEnabled().catch(() => false);
      const isVisible = await locator.isVisible().catch(() => false);
      return isEnabled && isVisible;
    } catch {
      return false;
    }
  }

  async validateMultiple(
    locators: string[],
    expectedText?: string,
    options?: {
      requireVisible?: boolean;
      requireClickable?: boolean;
      requireUnique?: boolean;
    }
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const locator of locators) {
      const result = await this.validate(locator, expectedText, options);
      results.push(result);
    }

    return results;
  }

  getBestValidLocator(results: ValidationResult[]): string | null {
    const validResults = results.filter(r => r.isValid);
    
    if (validResults.length === 0) {
      return null;
    }

    if (validResults.length === 1) {
      return validResults[0].locator;
    }

    const uniqueResults = validResults.filter(r => r.details?.count === 1);
    if (uniqueResults.length > 0) {
      return uniqueResults[0].locator;
    }

    return validResults[0].locator;
  }
}
