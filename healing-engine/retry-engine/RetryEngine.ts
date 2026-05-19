import { Page, Locator } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { LocatorAnalyzer } from '../locator-analyzer/LocatorAnalyzer';
import { DomParser } from '../dom-parser/DomParser';
import { SimilarityEngine } from '../similarity-engine/SimilarityEngine';
import { AIEngine } from '../ai-engine/AIEngine';
import { HealingValidator } from '../healing-validator/HealingValidator';
import { HealingPersistence } from '../persistence/HealingPersistence';
import { config } from '../../framework/config/config';
import { Logger } from '../../framework/utils/logger';

export class RetryEngine {
  private analyzer: LocatorAnalyzer;
  private domParser: DomParser;
  private similarityEngine: SimilarityEngine;
  private aiEngine: AIEngine;
  private validator: HealingValidator;
  private persistence: HealingPersistence;
  private logger: Logger;
  private pageName: string = 'unknown';

  constructor(private page: Page, pageName?: string) {
    this.analyzer = new LocatorAnalyzer(page);
    this.domParser = new DomParser(page);
    this.similarityEngine = new SimilarityEngine();
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
    pageName?: string,
    postActionCheck?: () => Promise<boolean>
  ): Promise<boolean> {
    const maxRetries = config.healing.maxRetries;
    const effectivePageName = pageName || this.pageName;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const locator = this.page.locator(originalLocator);
        await locator.first().waitFor({ timeout: 2000 });
        await action(locator);

        if (postActionCheck) {
          const passed = await postActionCheck();
          if (!passed) {
            this.logger.warn(`Action succeeded but post-check failed for: ${originalLocator}`);
      if (config.healing.enabled) {
            const healed = await this.attemptHealingWithCheck(
              originalLocator, action, postActionCheck, effectivePageName
            );
            if (healed) return true;
          }
          this.logger.error(`No healing candidate passed post-check for: ${originalLocator}`);
          await this.saveRecord(originalLocator, '', effectivePageName, 'similarity', 'failed', 0);
          return false;
          }
          await this.saveRecord(originalLocator, originalLocator, effectivePageName, 'direct', 'success', 1.0);
        }
        return true;
      } catch (error) {
        if (postActionCheck && attempt < maxRetries - 1) {
          this.logger.warn(`Locator failed (attempt ${attempt + 1}/${maxRetries}): ${originalLocator}`);
        }
        if (postActionCheck && attempt === maxRetries - 1) {
          if (config.healing.enabled) {
            const healed = await this.attemptHealingWithCheck(
              originalLocator, action, postActionCheck, effectivePageName
            );
            if (healed) return true;
          }
          await this.handleLocatorFailure(originalLocator, error as Error, effectivePageName);
          return false;
        }
        if (!postActionCheck) {
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
        }
      }
    }

    return false;
  }

  private async attemptHealingWithCheck(
    originalLocator: string,
    action: (locator: Locator) => Promise<void>,
    postActionCheck: () => Promise<boolean>,
    pageName: string
  ): Promise<string | null> {
    this.logger.info(`Attempting post-action healing for: ${originalLocator}`);

    try {
      const domSnapshot = await this.analyzer.getPageDomSnapshot();
      const allElements = await this.domParser.parseDomSnapshot(domSnapshot);

      const clickableTags = ['button', 'a', 'input', 'select', 'label'];
      const actionElements = allElements.filter(el =>
        clickableTags.includes(el.tag) ||
        (el.attributes && el.attributes['role'] === 'button')
      );

      const deduplicated = new Set<string>();
      const candidates = actionElements
        .map(el => ({ el, locator: this.domParser.buildLocator(el) }))
        .filter(({ locator }) => locator && !deduplicated.has(locator) && deduplicated.add(locator));

      const scored = candidates.map(({ el, locator }) => ({
        locator: locator!,
        score: this.similarityEngine.calculateSimilarity(originalLocator, locator!)
      }));
      scored.sort((a, b) => b.score - a.score);

      for (const candidate of scored) {
        const validationResult = await this.validator.validate(
          candidate.locator,
          undefined,
          { requireVisible: true, requireClickable: false, requireUnique: true }
        );

        if (!validationResult.isValid) {
          this.logger.debug(`Skipping invalid candidate: ${candidate.locator}`);
          continue;
        }

        try {
          const loc = this.page.locator(candidate.locator);
          await loc.first().waitFor({ timeout: 3000 });
          await action(loc);

          if (await postActionCheck()) {
            this.logger.info(`Post-action healing succeeded with: ${candidate.locator} (score: ${candidate.score})`);
            this.autoFixSourceFile(originalLocator, candidate.locator, pageName);
            await this.saveRecord(originalLocator, candidate.locator, pageName, 'similarity', 'success', candidate.score);
            return candidate.locator;
          }
        } catch {
          continue;
        }
      }

      if (!this.aiEngine.isEnabled()) return null;

      const suggestion = await this.aiEngine.getHealingSuggestion(
        originalLocator,
        domSnapshot,
        `Action succeeded on wrong element with locator: ${originalLocator}`
      );

      if (suggestion && suggestion.confidence >= config.healing.similarityThreshold) {
        const validationResult = await this.validator.validate(
          suggestion.suggestedLocator,
          undefined,
          { requireVisible: true, requireClickable: false, requireUnique: true }
        );

        if (validationResult.isValid) {
          try {
            const loc = this.page.locator(suggestion.suggestedLocator);
            await loc.first().waitFor({ timeout: 3000 });
            await action(loc);

            if (await postActionCheck()) {
              this.logger.info(`AI post-action healing succeeded with: ${suggestion.suggestedLocator}`);
              this.autoFixSourceFile(originalLocator, suggestion.suggestedLocator, pageName);
              await this.saveRecord(originalLocator, suggestion.suggestedLocator, pageName, 'ai', 'success', suggestion.confidence);
              return suggestion.suggestedLocator;
            }
          } catch {
            // AI candidate failed
          }
        }
      }
    } catch (error) {
      this.logger.error('Error during post-action healing', error);
    }

    return null;
  }

  private async handleLocatorFailure(locator: string, error: Error, pageName: string): Promise<void> {
    const failure = await this.analyzer.captureFailure(locator, error.message);
    this.logger.error(`Locator failed permanently: ${locator}`, failure);
    await this.saveRecord(locator, '', pageName, 'similarity', 'failed', 0);
  }

  private async attemptHealing(originalLocator: string, pageName: string): Promise<string | null> {
    if (!config.healing.enabled) return null;

    this.logger.info(`Attempting to heal locator: ${originalLocator}`);

    try {
      const domSnapshot = await this.analyzer.getPageDomSnapshot();

      const failedElement = await this.domParser.getElementBySelector(originalLocator);

      let similaritySucceeded = false;

      if (failedElement) {
        const candidateLocators = await this.domParser.getCandidateLocators(failedElement);
        if (candidateLocators.length > 0) {
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

              similaritySucceeded = true;
              this.autoFixSourceFile(originalLocator, scoredCandidate.locator, pageName);
              await this.saveRecord(originalLocator, scoredCandidate.locator, pageName, scoredCandidate.score >= 0.8 ? 'similarity' : 'unknown', 'success', scoredCandidate.score);
              return scoredCandidate.locator;
            } else {
              this.logger.warn(`Similarity candidate failed validation: ${scoredCandidate.locator} - ${validationResult.reason}`);
            }
          }
        } else {
          this.logger.warn('No similar elements found via similarity engine');
        }
      } else {
        this.logger.warn('Could not find failed element - trying locator string similarity');
        const allElements = await this.domParser.parseDomSnapshot(domSnapshot);
        const candidateLocators: string[] = [];
        for (const el of allElements) {
          const loc = this.domParser.buildLocator(el);
          if (loc && !candidateLocators.includes(loc)) {
            candidateLocators.push(loc);
          }
        }
        const bestMatch = this.similarityEngine.findBestMatch(originalLocator, candidateLocators, config.healing.similarityThreshold);
        if (bestMatch) {
          this.logger.info(`Found healed locator via string similarity: ${bestMatch}`);
          const validationResult = await this.validator.validate(
            bestMatch,
            undefined,
            { requireVisible: true, requireClickable: false, requireUnique: true }
          );
          if (validationResult.isValid) {
            this.autoFixSourceFile(originalLocator, bestMatch, pageName);
            await this.saveRecord(originalLocator, bestMatch, pageName, 'similarity', 'success', 0.8);
            return bestMatch;
          }
        }
      }

      if (!similaritySucceeded && this.aiEngine.isEnabled()) {
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

            this.autoFixSourceFile(originalLocator, suggestion.suggestedLocator, pageName);
            await this.saveRecord(originalLocator, suggestion.suggestedLocator, pageName, 'ai', 'success', suggestion.confidence);
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

  private async saveRecord(
    originalLocator: string, healedLocator: string, pageName: string,
    method: 'similarity' | 'ai' | 'unknown' | 'direct', status: 'success' | 'failed', score: number
  ): Promise<void> {
    await this.persistence.saveHealingRecord({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      testName: pageName || 'unknown',
      pageName,
      originalLocator,
      healedLocator,
      confidenceScore: score,
      healingMethod: method,
      status,
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      successCount: status === 'success' ? 1 : 0,
      lastUsed: new Date().toISOString()
    });
  }

  private autoFixSourceFile(originalLocator: string, healedLocator: string, pageName: string): void {
    if (!config.healing.autoFixSource) return;
    const pagesDir = path.resolve(__dirname, '../../framework/pages');
    if (!fs.existsSync(pagesDir)) return;
    this.replaceInFiles(pagesDir, originalLocator, healedLocator, pageName);
  }

  private replaceInFiles(dir: string, original: string, healed: string, pageName: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.replaceInFiles(fullPath, original, healed, pageName);
      } else if (entry.name.endsWith('.ts')) {
        try {
          let content = fs.readFileSync(fullPath, 'utf-8');
          if (content.includes(original)) {
            const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(escaped, 'g');
            const newContent = content.replace(re, healed);
            fs.writeFileSync(fullPath, newContent, 'utf-8');
            this.logger.info(`Auto-fixed source file: ${fullPath} -- replaced "${original}" with "${healed}"`);
          }
        } catch {
          // skip files that can't be read
        }
      }
    }
  }
}
