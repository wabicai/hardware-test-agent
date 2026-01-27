import type { TestSuite, TestCase, TestContext } from '../types';

/**
 * Base class for all test suites
 */
export abstract class BaseSuite implements TestSuite {
  abstract id: string;
  abstract name: string;
  abstract description: string;

  protected context: TestContext | null = null;

  /**
   * Get all test cases for this suite
   */
  abstract getTestCases(): TestCase[];

  /**
   * Suite-level setup (called before running any test cases)
   */
  async setup(context: TestContext): Promise<void> {
    this.context = context;
    console.log(`[${this.name}] Setup complete`);
  }

  /**
   * Suite-level teardown (called after all test cases complete)
   */
  async teardown(context: TestContext): Promise<void> {
    this.context = null;
    console.log(`[${this.name}] Teardown complete`);
  }

  /**
   * Build params with common automation settings
   */
  protected buildParams(baseParams: Record<string, any>, overrides: Record<string, any> = {}): Record<string, any> {
    return {
      ...baseParams,
      showOnOneKey: false, // Always disable device confirmation for automation
      ...overrides,
    };
  }

  /**
   * Validate address match (case-insensitive)
   */
  protected validateAddress(expected: string, actual: string): boolean {
    return expected.toLowerCase() === actual.toLowerCase();
  }

  /**
   * Validate public key match (case-insensitive)
   */
  protected validatePublicKey(expected: string, actual: string): boolean {
    return expected.toLowerCase() === actual.toLowerCase();
  }
}
