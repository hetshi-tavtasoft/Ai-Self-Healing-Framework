import { type Page, type Locator } from '@playwright/test';

export interface UserDetails {
  firstname: string;
  lastname: string;
  zipcode: string;
}

export class CheckoutInformation {
  readonly page: Page;
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly zipcode: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.firstName = page.locator('#first-name');
    this.lastName = page.locator('#last-name');
    this.zipcode = page.locator('#postal-code');
    this.continueButton = page.locator('#continue');
  }

  async getTitleText(): Promise<string> {
    return (await this.title.first().textContent()) ?? '';
  }

  async enterDetails(data: UserDetails): Promise<void> {
    await this.firstName.fill(data.firstname);
    await this.lastName.fill(data.lastname);
    await this.zipcode.fill(data.zipcode);
  }

  async clickOnContinueButton(): Promise<void> {
    await this.continueButton.click();
  }
}