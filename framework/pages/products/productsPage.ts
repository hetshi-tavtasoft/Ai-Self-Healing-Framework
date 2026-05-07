import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class ProductPage extends BasePage {
  readonly sortingField: string;
  readonly sortingDropdown: string;
  readonly price: string;
  readonly title: string;
  readonly cartContainer: string;

  constructor(page: Page) {
    super(page, 'ProductPage');
    this.sortingField = '.product_sort_container';
    this.sortingDropdown = '.product_sort_container';
    this.price = '.inventory_item_price';
    this.title = '.title';
    this.cartContainer = 'a.shopping_cart_link';
  }

  async clickOnSortingContainer(): Promise<void> {
    await this.waitForVisible(this.sortingField, 'sorting field');
    await this.click(this.sortingField, 'sorting field');
  }

  async selectSortingOption(optionText: string): Promise<void> {
    await this.selectOption(this.sortingDropdown, optionText, 'sorting dropdown');
  }

  async getPriceAndClickOnAddToCartButton(): Promise<number> {
    const productItems = this.page.locator('.inventory_item');
    const prices = await productItems.locator('.inventory_item_price').allTextContents();
    let lowestPrice = Infinity;
    let lowestIndex = 0;

    prices.forEach((price, index) => {
      const numPrice = parseFloat(price.replace('$', ''));
      if (numPrice < lowestPrice) {
        lowestPrice = numPrice;
        lowestIndex = index;
      }
    });

    const addToCartButton = productItems.nth(lowestIndex).locator('button');
    await addToCartButton.click();

    return lowestPrice;
  }

  async clickOnCartContainer(): Promise<void> {
    await this.click(this.cartContainer, 'cart container');
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }
}