import { type Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class LoginPage extends BasePage {
  static locators = {
    usernameInput: '#user-name',
    passwordInput: '#password',
    loginButton: '#login-button',
    title: '.login_logo',
  } as const;

  readonly usernameInput: string;
  readonly passwordInput: string;
  readonly loginButton: string;
  readonly title: string;

  constructor(page: Page) {
    super(page, 'LoginPage');
    this.usernameInput = LoginPage.locators.usernameInput;
    this.passwordInput = LoginPage.locators.passwordInput;
    this.loginButton = LoginPage.locators.loginButton;
    this.title = LoginPage.locators.title;
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
    await this.click(this.loginButton, 'login button', async () => {
      try {
        await this.page.waitForURL('**/inventory.html', { timeout: 3000 });
        return true;
      } catch {
        return false;
      }
    });
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