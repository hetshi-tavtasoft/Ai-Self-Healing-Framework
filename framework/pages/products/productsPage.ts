import { type Page, type Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly sortingField: Locator;
  readonly sortingDropdown: Locator;
  readonly price: Locator;
  readonly title: Locator;
  readonly cartContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sortingField = page.locator('.product_sort_container');
    this.sortingDropdown = page.locator('.product_sort_container');
    this.price = page.locator('inventory-item-price');
    this.title = page.locator('.title');
    this.cartContainer = page.locator('a[class="shopping_cart_link"]');
  }

  async clickOnSortingContainer(): Promise<void> {
    await this.sortingField.waitFor({ state: 'visible' });
    await this.sortingField.click();
  }

  async selectSortingOption(optionText: string): Promise<void> {
    await this.sortingDropdown.selectOption({ label: optionText });
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
    await this.cartContainer.click();
  }

  async getTitleText(): Promise<string> {
    return (await this.title.first().textContent()) ?? '';
  }
}