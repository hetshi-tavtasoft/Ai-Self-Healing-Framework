import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: string;
  readonly passwordInput: string;
  readonly loginButton: string;
  readonly title: string;

  constructor(page: Page) {
    super(page, 'LoginPage');
    this.usernameInput = '#user-name';
    this.passwordInput = '#password';
    this.loginButton = '#login-button';
    this.title = '.login_container div.login_logo';
  }

  async navigate(): Promise<void> {
    await this.page.goto('https://www.saucedemo.com/');
    await this.page.waitForLoadState('networkidle');
  }

  async enterUsername(username: string): Promise<void> {
    await this.fill(this.usernameInput, username, 'username');
  }

  async enterPassword(password: string): Promise<void> {
    await this.fill(this.passwordInput, password, 'password');
  }

  async clickLogin(): Promise<void> {
    await this.click(this.loginButton, 'login button');
    await this.page.waitForURL('**/inventory.html');
  }

  async loginToSwagLabs(username: string, password: string): Promise<void> {
    await this.navigate();
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async getTitleText(): Promise<string> {
    return await this.getText(this.title, 'title');
  }
}