import { test, expect } from '../fixtures/pageFixtures';
import { testData } from '../utils/testData/testData';
import { constantData } from '../fixtures/constant';
import { userData } from '../utils/dataFactory/userData';

test.describe('e2e Flow', () => {

  test('Completed e2e flow which contains login to order shipped', async ({ loginPage, productPage, yourCartPage, checkoutInformationPage, checkoutOverviewPage, checkoutCompletePage }) => {

    console.log("Navigate and Verify that user is navigated to Swag labs dashboard");
    await loginPage.navigate();
    const headerText = await loginPage.getTitleText();
    await expect(headerText).toContain(constantData.data.dashboardTitle);

    console.log("Login to Swag labs with valid username and password");
    await loginPage.loginToSwagLabs(
      testData.user.username,
      testData.user.password
    );

    console.log("Verify that user is navigated to productes page");
    const productTitle = await productPage.getTitleText();
    await expect(productTitle).toContain(constantData.data.productTitle);

    console.log("Click on sorting container and click on High to low priority button and Add the cheapest product in cart");
    await productPage.clickOnSortingContainer();
    await productPage.selectSortingOption(constantData.data.sortHighToLowOption);
    const cheapestPrice = await productPage.getPriceAndClickOnAddToCartButton();

    console.log('Click on Cart container and verify that user is navigated to Your Cart page');
    await productPage.clickOnCartContainer();
    const yourCartTitle = await yourCartPage.getTitleText();
    await expect(yourCartTitle).toContain(constantData.data.yourCartTitle);

    console.log('Get cart price and verify that cheapest prise is added');
    const cartPrice = await yourCartPage.getPrice();
    await expect(cheapestPrice).toEqual(cartPrice);

    console.log('Click on Checkout button and verify that user is navigated to Checkout page');
    await yourCartPage.clickOnCheckoutButton();
    const checkoutInformationTitle = await checkoutInformationPage.getTitleText();
    await expect(checkoutInformationTitle).toContain(constantData.data.checkoutInformationTitle);

    console.log('Enter details and click on continue button and verify that user is navigated to Checkout overview page');
    await checkoutInformationPage.enterDetails(userData());
    await checkoutInformationPage.clickOnContinueButton();
    const checkoutOverviewTitle = await checkoutOverviewPage.getTitleText();
    await expect(checkoutOverviewTitle).toContain(constantData.data.checkoutOverviewTitle);

    console.log('Verify product details and click on Finish button');
    const currentProductPrice = await checkoutOverviewPage.getProductPrice();
    await expect(cheapestPrice).toEqual(currentProductPrice);
    await checkoutOverviewPage.clickOnFinishButton();

    console.log('Verify success header');
    const successHeader = await checkoutCompletePage.getTitleText();
    await expect(successHeader).toEqual(constantData.data.checkoutSuccessHeader);
  });

});