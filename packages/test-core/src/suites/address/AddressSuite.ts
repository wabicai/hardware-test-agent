import { BaseSuite } from '../BaseSuite';
import type { TestCase, TestContext } from '../../types';

/**
 * Address validation test suite
 * Tests address generation for various blockchain methods
 */
export class AddressSuite extends BaseSuite {
  id = 'address';
  name = '地址测试';
  description = '验证各链地址生成的正确性';

  private testCases: TestCase[] = [];

  async setup(context: TestContext): Promise<void> {
    await super.setup(context);

    // Generate test cases based on available data
    this.testCases = this.generateTestCases();

    console.log(`[${this.name}] Generated ${this.testCases.length} test cases`);
  }

  getTestCases(): TestCase[] {
    return this.testCases;
  }

  private generateTestCases(): TestCase[] {
    // This is a placeholder implementation
    // In production, this would load data from expo-example
    const cases: TestCase[] = [];

    // Example test cases - these would be loaded from data files
    const methods = [
      {
        method: 'btcGetAddress',
        name: 'Bitcoin',
        params: { path: "m/44'/0'/0'/0/0", coin: 'btc' },
      },
      {
        method: 'evmGetAddress',
        name: 'Ethereum',
        params: { path: "m/44'/60'/0'/0/0" },
      },
      {
        method: 'solGetAddress',
        name: 'Solana',
        params: { path: "m/44'/501'/0'" },
      },
    ];

    for (const m of methods) {
      cases.push({
        id: `${this.id}-${m.method}-basic`,
        title: `${m.name} 地址获取`,
        method: m.method,
        params: this.buildParams(m.params),
        expected: null, // Will be validated against actual result
        validator: { type: 'success' }, // Just check if it succeeds
        metadata: {
          chain: m.name,
          variant: 'basic',
        },
      });
    }

    return cases;
  }
}
