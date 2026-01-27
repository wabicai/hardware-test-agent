// Export all test suites
export * from './BaseSuite';
export * from './address/AddressSuite';
// export * from './passphrase/PassphraseSuite';
// export * from './slip39/SLIP39Suite';
// export * from './security/SecuritySuite';
// export * from './functional/FunctionalSuite';
// export * from './attachToPin/AttachToPinSuite';
// export * from './chainMethod/ChainMethodSuite';

// Suite registry for easy access
import { AddressSuite } from './address/AddressSuite';

export const allSuites = [
  new AddressSuite(),
  // Add more suites here as they are implemented
];

export function getSuiteById(id: string) {
  return allSuites.find((suite) => suite.id === id);
}

export function getSuitesByIds(ids: string[]) {
  return allSuites.filter((suite) => ids.includes(suite.id));
}
