import { faker } from '@faker-js/faker';

export const userData = () => ({
  firstname: faker.person.firstName(),
  lastname: faker.person.lastName(),
  zipcode: faker.location.zipCode()
});