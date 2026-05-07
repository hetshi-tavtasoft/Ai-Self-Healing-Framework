import { Page, Locator } from '@playwright/test';
import { LocatorAnalyzer, LocatorFailure } from '../locator-analyzer/LocatorAnalyzer';
import { DomParser, DomElement } from '../dom-parser/DomParser';
import { SimilarityEngine, ScoredCandidate } from '../similarity-engine/SimilarityEngine';
import { HealingStorage, HealedLocator } from '../healing-storage/HealingStorage';
import { AIEngine } from '../ai-engine/AIEngine';
import { HealingValidator, ValidationResult } from '../healing-validator/HealingValidator';
import { HealingPersistence } from '../persistence/HealingPersistence';
import { config } from '../../framework/config/config';
import { Logger } from '../../framework/utils/logger';

export class RetryEngine {
  private analyzer: LocatorAnalyzer;
  private domParser: DomParser;
  private similarityEngine: SimilarityEngine;
  private storage: HealingStorage;
  private aiEngine: AIEngine;
  private validator: HealingValidator;
  private persistence: HealingPersistence;
  private logger: Logger;
  private pageName: string = 'unknown';

  constructor(private page: Page, pageName?: string) {
    this.analyzer = new LocatorAnalyzer(page);
    this.domParser = new DomParser(page);
    this.similarityEngine = new SimilarityEngine();
    this.storage = new HealingStorage();
    this.aiEngine = new AIEngine();
    this.validator = new HealingValidator(page);
    this.persistence = new HealingPersistence();
    this.logger = Logger.getInstance();
    if (pageName) {
      this.pageName = pageName;
    }
  }

  setPageName(name: string): void {
    this.pageName = name;
  }

  async findElementWithRetry(
    originalLocator: string,
    action: (locator: Locator) => Promise<void>,
    pageName?: string
  ): Promise<boolean> {
    const maxRetries = config.healing.maxRetries;
    const effectivePageName = pageName || this.pageName;

    if (config.healing.enabled) {
      const healed = this.storage.findHealedLocator(originalLocator, effectivePageName);
      if (healed) {
        try {
          const locator = this.page.locator(healed.healedLocator);
          await locator.first().waitFor({ timeout: config.timeout.action || 5000 });
          await action(locator);
          this.storage.incrementSuccessCount(originalLocator, effectivePageName);
          this.logger.info(`Used healed locator: ${healed.healedLocator}`);
          return true;
        } catch (error) {
          this.logger.warn(`Healed locator failed, trying to re-heal: ${healed.healedLocator}`);
        }
      }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const locator = this.page.locator(originalLocator);
        await locator.first().waitFor({ timeout: config.timeout.action || 5000 });
        await action(locator);
        return true;
      } catch (error) {
        this.logger.warn(`Locator failed (attempt ${attempt + 1}/${maxRetries}): ${originalLocator}`);

        if (attempt === maxRetries - 1) {
          if (config.healing.enabled) {
            const healed = await this.attemptHealing(originalLocator, effectivePageName);
            if (healed) {
              try {
                await action(this.page.locator(healed));
                return true;
              } catch {
                // Healing failed
              }
            }
          }
          await this.handleLocatorFailure(originalLocator, error as Error, effectivePageName);
          return false;
        }

        await this.page.waitForTimeout(1000);
      }
    }

    return false;
  }

  private async handleLocatorFailure(locator: string, error: Error, pageName: string): Promise<void> {
    const failure = await this.analyzer.captureFailure(locator, error.message);
    this.logger.error(`Locator failed permanently: ${locator}`, failure);
    this.storage.saveFailedLocator({ ...failure, pageName });
  }

  private async attemptHealing(originalLocator: string, pageName: string): Promise<string | null> {
    if (!config.healing.enabled) return null;

    this.logger.info(`Attempting to heal locator: ${originalLocator}`);

    try {
      const domSnapshot = await this.analyzer.getPageDomSnapshot();
      this.storage.saveDomSnapshot(pageName, domSnapshot);

      const failedElement = await this.domParser.getElementBySelector(originalLocator);
      if (!failedElement) {
        this.logger.warn('Could not parse failed element');
        return null;
      }

      const candidateLocators = await this.domParser.getCandidateLocators(failedElement);
      if (candidateLocators.length === 0) {
        this.logger.warn('No similar elements found');
        return null;
      }

      const scoredCandidate = this.similarityEngine.findBestMatchWithDetails(
        failedElement,
        await this.domParser.parseDomSnapshot(domSnapshot),
        config.healing.similarityThreshold
      );

      if (scoredCandidate) {
        this.logger.info(`Found healed locator: ${scoredCandidate.locator} (score: ${scoredCandidate.score})`);
        
        const validationResult = await this.validator.validate(
          scoredCandidate.locator,
          undefined,
          { requireVisible: true, requireClickable: false, requireUnique: true }
        );
        
        if (validationResult.isValid) {
          this.logger.info(`Healed locator validated: ${scoredCandidate.locator}`);
          const healedEntry: HealedLocator = {
            originalLocator,
            healedLocator: scoredCandidate.locator,
            url: this.page.url(),
            pageName,
            timestamp: new Date().toISOString(),
            successCount: 0
          };
          this.storage.saveHealedLocator(healedEntry);
          
          await this.persistence.saveHealingRecord({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            testName: pageName || 'unknown',
            pageName,
            originalLocator,
            healedLocator: scoredCandidate.locator,
            confidenceScore: scoredCandidate.score,
            healingMethod: 'similarity',
            status: 'success',
            timestamp: new Date().toISOString(),
            url: this.page.url(),
            successCount: 0,
            lastUsed: new Date().toISOString()
          });

          return scoredCandidate.locator;
        } else {
          this.logger.warn(`Similarity candidate failed validation: ${scoredCandidate.locator} - ${validationResult.reason}`);
        }
      }

      if (this.aiEngine.isEnabled()) {
        const suggestion = await this.aiEngine.getHealingSuggestion(
          originalLocator,
          domSnapshot,
          `Failed to find element with locator: ${originalLocator}`
        );
        if (suggestion && suggestion.confidence >= config.healing.similarityThreshold) {
          this.logger.info(`AI suggested locator: ${suggestion.suggestedLocator}`);
          
          const validationResult = await this.validator.validate(
            suggestion.suggestedLocator,
            undefined,
            { requireVisible: true, requireClickable: false, requireUnique: true }
          );
          
          if (validationResult.isValid) {
            this.logger.info(`AI locator validated: ${suggestion.suggestedLocator}`);
            const healedEntry: HealedLocator = {
              originalLocator,
              healedLocator: suggestion.suggestedLocator,
              url: this.page.url(),
              pageName,
              timestamp: new Date().toISOString(),
              successCount: 0
            };
            this.storage.saveHealedLocator(healedEntry);
            
            await this.persistence.saveHealingRecord({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              testName: pageName || 'unknown',
              pageName,
              originalLocator,
              healedLocator: suggestion.suggestedLocator,
              confidenceScore: suggestion.confidence,
              healingMethod: 'ai',
              status: 'success',
              timestamp: new Date().toISOString(),
              url: this.page.url(),
              successCount: 0,
              lastUsed: new Date().toISOString()
            });

            return suggestion.suggestedLocator;
          } else {
            this.logger.warn(`AI suggested locator failed validation: ${suggestion.suggestedLocator} - ${validationResult.reason}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error during healing attempt', error);
    }

    return null;
  }
}
