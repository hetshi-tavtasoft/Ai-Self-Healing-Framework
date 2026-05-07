import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#user-name');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
    this.title = page.locator('.login_container div.login_logo');
  }

  async navigate(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com/');
    await this.page.waitForLoadState('networkidle');
  }

  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
    await this.page.waitForURL('**/inventory.html');
  }

  async loginToSwagLabs(username: string, password: string): Promise<void> {
    await this.navigate();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async getTitleText(): Promise<string> {
    return (await this.title.first().textContent()) ?? '';
  }
}