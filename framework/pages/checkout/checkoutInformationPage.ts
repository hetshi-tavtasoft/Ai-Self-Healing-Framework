import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export interface UserDetails {
  firstname: string;
  lastname: string;
  zipcode: string;
}

export class CheckoutInformation extends BasePage {
  readonly title: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly zipcode: string;
  readonly continueButton: string;

  constructor(page: Page) {
    super(page, 'CheckoutInformationPage');
    this.title = '.title';
    this.firstName = '#first-name';
    this.lastName = '#last-name';
    this.zipcode = '#postal-code';
    this.continueButton = '#continue';
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }

  async enterDetails(data: UserDetails): Promise<void> {
    await this.fill(this.firstName, data.firstname, 'first name');
    await this.fill(this.lastName, data.lastname, 'last name');
    await this.fill(this.zipcode, data.zipcode, 'zip code');
  }

  async clickOnContinueButton(): Promise<void> {
    await this.click(this.continueButton, 'continue button');
  }
}