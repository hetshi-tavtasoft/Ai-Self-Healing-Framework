import { Page } from '@playwright/test';
import * as cheerio from 'cheerio';

export interface DomElement {
  tag: string;
  id?: string;
  classes?: string[];
  text?: string;
  attributes?: Record<string, string>;
  xpath?: string;
  innerHTML?: string;
  children?: DomElement[];
}

export class DomParser {
  constructor(private page: Page) {}

  async getElementBySelector(selector: string): Promise<DomElement | null> {
    try {
      const element = await this.page.$(selector);
      if (!element) return null;
      
      return await element.evaluate((el) => {
        const attributes: Record<string, string> = {};
        for (const attr of el.attributes) {
          attributes[attr.name] = attr.value;
        }
        
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          classes: el.className ? el.className.split(' ') : [],
          text: el.textContent?.trim().substring(0, 100),
          attributes,
          innerHTML: el.innerHTML?.substring(0, 500)
        };
      });
    } catch {
      return null;
    }
  }

  async findSimilarElements(failedElement: DomElement): Promise<DomElement[]> {
    const similarElements: DomElement[] = [];
    
    const candidates = await this.page.$$('*');
    for (const candidate of candidates) {
      const elementData = await candidate.evaluate((el) => {
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          classes: el.className ? el.className.split(' ') : [],
          text: el.textContent?.trim().substring(0, 100)
        };
      });
      
      if (this.isSimilar(failedElement, elementData)) {
        similarElements.push(elementData);
      }
    }
    
    return similarElements;
  }

  async parseDomSnapshot(html: string): Promise<DomElement[]> {
    const $ = cheerio.load(html);
    const elements: DomElement[] = [];

    $('*').each((_, el) => {
      const $el = $(el);
      const attributes: Record<string, string> = {};
      
      const element = el as any;
      Object.keys(element.attribs || {}).forEach(key => {
        attributes[key] = element.attribs[key];
      });

      elements.push({
        tag: element.name || 'unknown',
        id: $el.attr('id'),
        classes: $el.attr('class')?.split(' ') || [],
        text: $el.text().trim().substring(0, 100),
        attributes
      });
    });

    return elements;
  }

  async getCandidateLocators(failedElement: DomElement): Promise<string[]> {
    const html = await this.page.content();
    const allElements = await this.parseDomSnapshot(html);
    const candidates: string[] = [];

    for (const element of allElements) {
      if (this.isSimilar(failedElement, element)) {
        const locator = this.buildLocator(element);
        if (locator && !candidates.includes(locator)) {
          candidates.push(locator);
        }
      }
    }

    return candidates;
  }

  private isSimilar(el1: DomElement, el2: DomElement): boolean {
    if (el1.tag === el2.tag) return true;
    if (el1.id && el1.id === el2.id) return true;
    if (el1.classes && el2.classes && el1.classes.some(c => el2.classes?.includes(c))) return true;
    if (el1.text && el2.text && el1.text === el2.text) return true;
    return false;
  }

  private buildLocator(element: DomElement): string | null {
    if (element.id) {
      return `#${element.id}`;
    }
    if (element.classes && element.classes.length > 0) {
      return `.${element.classes.join('.')}`;
    }
    if (element.text) {
      return `text=${element.text.substring(0, 50)}`;
    }
    if (element.attributes && element.attributes['data-testid']) {
      return `[data-testid="${element.attributes['data-testid']}"]`;
    }
    return null;
  }
}
