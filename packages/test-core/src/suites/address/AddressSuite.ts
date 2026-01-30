import { BaseSuite } from '../BaseSuite';
import type { TestCase, TestContext } from '../../types';
import { testCases as addressTestCases } from '../../data/address';
import type { AddressTestCase, AddressCaseData } from '../../data/address';

/**
 * Address validation test suite
 * Tests address generation for various blockchain methods
 */
export class AddressSuite extends BaseSuite {
  id = 'address';
  name = '地址测试';
  description = '验证各链地址生成的正确性';

  private testCases: TestCase[] = [];

  // Store loaded test data for passphrase handling
  private addressTestData: AddressTestCase[] = [];

  async setup(context: TestContext): Promise<void> {
    await super.setup(context);

    // Load test data from data files
    this.addressTestData = addressTestCases;

    // Convert address test data to TestCase format
    this.testCases = this.generateTestCases();

    console.log(`[${this.name}] Loaded ${this.addressTestData.length} test suites`);
    console.log(`[${this.name}] Generated ${this.testCases.length} test cases`);
  }

  getTestCases(): TestCase[] {
    return this.testCases;
  }

  /**
   * Get all loaded address test data (for passphrase handling)
   */
  getAddressTestData(): AddressTestCase[] {
    return this.addressTestData;
  }

  private generateTestCases(): TestCase[] {
    const cases: TestCase[] = [];

    for (const testSuite of this.addressTestData) {
      // Each testSuite contains data for a specific mnemonic + passphrase combination
      for (const caseData of testSuite.data) {
        const testCase = this.convertToTestCase(testSuite, caseData);
        cases.push(testCase);
      }
    }

    return cases;
  }

  /**
   * Convert AddressCaseData to TestCase format
   */
  private convertToTestCase(
    testSuite: AddressTestCase,
    caseData: AddressCaseData
  ): TestCase {
    const { method, title, params, result } = caseData;
    const { extra } = testSuite;

    return {
      id: `${this.id}-${testSuite.id}-${title.replace(/\s+/g, '-')}`,
      title: `[${testSuite.id}] ${title}`,
      method,
      params: this.buildParams(params || {}),
      expected: result.address,
      validator: { type: 'address', expected: result.address },
      metadata: {
        suiteId: testSuite.id,
        suiteName: testSuite.name,
        passphrase: extra.passphrase,
        passphraseState: extra.passphraseState,
        hasPassphrase: extra.passphrase !== undefined && extra.passphrase !== '',
      },
    };
  }

  /**
   * Get test cases filtered by passphrase state
   * @param withPassphrase - if true, return only passphrase-enabled tests
   */
  getTestCasesByPassphraseState(withPassphrase: boolean): TestCase[] {
    return this.testCases.filter(tc => {
      const hasPassphrase = tc.metadata?.hasPassphrase === true;
      return withPassphrase ? hasPassphrase : !hasPassphrase;
    });
  }

  /**
   * Get test cases for a specific mnemonic/passphrase suite
   */
  getTestCasesBySuiteId(suiteId: string): TestCase[] {
    return this.testCases.filter(tc => tc.metadata?.suiteId === suiteId);
  }

  /**
   * Get unique suite IDs for organizing tests
   */
  getUniqueSuiteIds(): string[] {
    const suiteIds = new Set<string>();
    for (const tc of this.testCases) {
      if (tc.metadata?.suiteId) {
        suiteIds.add(tc.metadata.suiteId);
      }
    }
    return Array.from(suiteIds);
  }
}
