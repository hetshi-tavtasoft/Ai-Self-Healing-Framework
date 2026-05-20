import * as dotenv from 'dotenv';
import * as path from 'path';
import OpenAI from 'openai';
import { config } from '../../framework/config/config';
import { Logger } from '../../framework/utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AIHealingSuggestion {
  originalLocator: string;
  suggestedLocator: string;
  confidence: number;
  reasoning: string;
}

export class AIEngine {
  private logger: Logger;
  private openai: OpenAI | null = null;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const apiKey = process.env.OPENAI_API_KEY || config.ai.apiKey;
    
    if (!apiKey) {
      this.logger.warn('OpenAI API key not found. AI Engine will be disabled.');
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.logger.info('OpenAI initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAI', error);
    }
  }

  isEnabled(): boolean {
    return config.ai.enabled && !!this.openai;
  }

  async getHealingSuggestion(
    failedLocator: string,
    domSnapshot: string,
    error: string
  ): Promise<AIHealingSuggestion | null> {
    if (!this.isEnabled() || !this.openai) {
      this.logger.debug('AI Engine is disabled or not initialized');
      return null;
    }

    const models = [
      config.ai.model,
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-3.5-turbo',
    ].filter(Boolean) as string[];

    const prompt = this.buildPrompt(failedLocator, domSnapshot, error);
    const deduplicated = [...new Set(models)];

    for (const model of deduplicated) {
      try {
        this.logger.info(`Requesting AI healing suggestion (model: ${model})...`);

        const response = await this.openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a Playwright locator healing expert. Analyze the failed locator and DOM, then suggest the best alternative locator. Return only the locator string, nothing else.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        });

        const suggestedLocator = response.choices[0]?.message?.content?.trim();

        if (!suggestedLocator) {
          this.logger.warn(`AI model ${model} returned empty suggestion`);
          continue;
        }

        this.logger.info(`AI (${model}) suggested locator: ${suggestedLocator}`);

        return {
          originalLocator: failedLocator,
          suggestedLocator,
          confidence: 0.85,
          reasoning: `AI (${model}) suggested based on DOM analysis`
        };

      } catch (error: any) {
        if (error?.status === 404 || error?.code === 'model_not_found') {
          this.logger.warn(`Model ${model} not available, trying next...`);
          continue;
        }
        this.logger.error(`AI healing request failed with model ${model}`, error);
        return null;
      }
    }

    this.logger.error('All AI models exhausted, none succeeded');
    return null;
  }

  private buildPrompt(failedLocator: string, domSnapshot: string, error: string): string {
    const truncatedDom = domSnapshot.length > 5000 
      ? domSnapshot.substring(0, 5000) + '...[truncated]'
      : domSnapshot;

    return `
Original locator: ${failedLocator}

Error: ${error}

DOM Snapshot (first 5000 chars):
${truncatedDom}

Based on the above, suggest the best Playwright locator that would find the intended element.
Consider:
1. ID attributes
2. Class names
3. Text content
4. Data attributes (data-testid, data-test-id, etc.)
5. Nearby labels or aria labels

Return ONLY the locator string (e.g., '#id', '.class', 'text=...', '[data-testid="..."]').
Do not include "page.locator()" or any explanation.
`.trim();
  }
}
