import { Page } from '@playwright/test';

export interface DomElement {
  tag: string;
  id?: string;
  classes?: string[];
  text?: string;
  attributes?: Record<string, string>;
  xpath?: string;
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
          attributes
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

  private isSimilar(el1: DomElement, el2: DomElement): boolean {
    if (el1.tag === el2.tag) return true;
    if (el1.id && el1.id === el2.id) return true;
    if (el1.classes && el2.classes && el1.classes.some(c => el2.classes?.includes(c))) return true;
    if (el1.text && el2.text && el1.text === el2.text) return true;
    return false;
  }
}
