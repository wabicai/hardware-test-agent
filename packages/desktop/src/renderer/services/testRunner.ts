/**
 * Test Runner Service - Runs test suites in the renderer process
 *
 * Uses SDK from SDKContext for device communication
 */

import type { CoreApi } from '@onekeyfe/hd-common-connect-sdk';
import { EventEmitter } from 'eventemitter3';

// ============ Types ============

export type VerifyState = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestCase {
  id: string;
  title: string;
  method: string;
  params: Record<string, any>;
  expected?: any;
  validator: ResultValidator;
  passphrase?: string; // Passphrase to use for this test case
  metadata?: Record<string, any>;
}

export type ResultValidator =
  | { type: 'address'; expected: string }
  | { type: 'publicKey'; expected: string }
  | { type: 'success' }
  | { type: 'error'; expectedError?: string }
  | { type: 'custom'; validate: (result: any) => boolean };

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  getTestCases(): TestCase[];
  setup?(context: TestContext): Promise<void>;
  teardown?(context: TestContext): Promise<void>;
}

export interface TestContext {
  sdk: CoreApi;
  connectId: string;
  deviceId: string;
  setCurrentPassphrase: (passphrase: string) => void;
  device: {
    deviceType: string;
    label: string;
    firmwareVersion: string;
  };
}

export interface CaseResult {
  caseId: string;
  title: string;
  status: VerifyState;
  duration: number;
  error?: string;
  expected?: any;
  actual?: any;
}

export interface SuiteResult {
  suiteId: string;
  name: string;
  status: VerifyState;
  duration: number;
  cases: CaseResult[];
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestProgress {
  totalSuites: number;
  completedSuites: number;
  currentSuite: string;
  totalCases: number;
  completedCases: number;
  currentCase: string;
  overallProgress: number;
}

export interface TestReport {
  id: string;
  createdAt: Date;
  duration: number;
  device: {
    deviceType: string;
    label: string;
    firmwareVersion: string;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  suites: SuiteResult[];
}

// ============ Events ============

interface TestRunnerEvents {
  'suite:start': (suite: TestSuite) => void;
  'suite:complete': (result: SuiteResult) => void;
  'case:start': (testCase: TestCase) => void;
  'case:complete': (result: CaseResult) => void;
  progress: (progress: TestProgress) => void;
  error: (error: Error) => void;
  complete: (report: TestReport) => void;
}

type RunnerState = 'idle' | 'running' | 'paused' | 'stopped';

// ============ Test Runner ============

export class TestRunnerService extends EventEmitter<TestRunnerEvents> {
  private state: RunnerState = 'idle';
  private context: TestContext | null = null;

  // Progress tracking
  private totalSuites = 0;
  private completedSuites = 0;
  private totalCases = 0;
  private completedCases = 0;
  private currentSuiteName = '';
  private currentCaseTitle = '';

  // Results
  private suiteResults: SuiteResult[] = [];
  private startTime = 0;

  /**
   * Initialize the test runner with SDK context
   */
  initialize(context: TestContext): void {
    this.context = context;
    console.log('[TestRunnerService] Initialized');
  }

  /**
   * Run multiple test suites
   */
  async runSuites(suites: TestSuite[]): Promise<TestReport> {
    if (this.state === 'running') {
      throw new Error('Test runner is already running');
    }

    if (!this.context) {
      throw new Error('Test runner not initialized');
    }

    this.state = 'running';
    this.startTime = Date.now();
    this.suiteResults = [];

    // Calculate totals
    this.totalSuites = suites.length;
    this.completedSuites = 0;
    this.totalCases = suites.reduce((sum, suite) => sum + suite.getTestCases().length, 0);
    this.completedCases = 0;

    console.log(`[TestRunnerService] Starting ${this.totalSuites} suites with ${this.totalCases} cases`);

    try {
      for (const suite of suites) {
        // Check if stopped (state may be changed by stop() method externally)
        if (this.getState() === 'stopped') {
          break;
        }

        // Wait while paused (state may be changed by pause() method externally)
        while (this.getState() === 'paused') {
          await this.delay(100);
        }

        const result = await this.runSuite(suite);
        this.suiteResults.push(result);
        this.completedSuites++;

        this.emit('suite:complete', result);
        this.emitProgress();
      }
    } catch (error) {
      this.emit('error', error as Error);
    }

    this.state = 'idle';

    const report = this.generateReport();
    this.emit('complete', report);

    return report;
  }

  /**
   * Run a single suite
   */
  private async runSuite(suite: TestSuite): Promise<SuiteResult> {
    console.log(`[TestRunnerService] Running suite: ${suite.name}`);

    this.currentSuiteName = suite.name;
    this.emit('suite:start', suite);

    const suiteStartTime = Date.now();
    const caseResults: CaseResult[] = [];
    const testCases = suite.getTestCases();

    // Setup
    if (suite.setup && this.context) {
      try {
        await suite.setup(this.context);
      } catch (error) {
        console.error(`[TestRunnerService] Suite setup failed:`, error);
      }
    }

    // Run cases
    for (const testCase of testCases) {
      if (this.state === 'stopped') break;

      while (this.state === 'paused') {
        await this.delay(100);
      }

      const result = await this.runCase(testCase);
      caseResults.push(result);
      this.completedCases++;

      this.emit('case:complete', result);
      this.emitProgress();
    }

    // Teardown
    if (suite.teardown && this.context) {
      try {
        await suite.teardown(this.context);
      } catch (error) {
        console.error(`[TestRunnerService] Suite teardown failed:`, error);
      }
    }

    const passed = caseResults.filter((r) => r.status === 'passed').length;
    const failed = caseResults.filter((r) => r.status === 'failed').length;
    const skipped = caseResults.filter((r) => r.status === 'skipped').length;

    return {
      suiteId: suite.id,
      name: suite.name,
      status: failed > 0 ? 'failed' : 'passed',
      duration: Date.now() - suiteStartTime,
      cases: caseResults,
      passed,
      failed,
      skipped,
    };
  }

  /**
   * Run a single test case
   */
  private async runCase(testCase: TestCase): Promise<CaseResult> {
    console.log(`[TestRunnerService] Running case: ${testCase.title}`);

    this.currentCaseTitle = testCase.title;
    this.emit('case:start', testCase);

    const startTime = Date.now();

    // Set passphrase if specified
    if (testCase.passphrase !== undefined && this.context) {
      this.context.setCurrentPassphrase(testCase.passphrase);
    }

    try {
      const sdk = this.context!.sdk;
      const { connectId, deviceId } = this.context!;

      // Build params with showOnOneKey: false
      const params = {
        ...testCase.params,
        showOnOneKey: false,
      };

      // Call SDK method
      const method = testCase.method as keyof CoreApi;
      const result = await (sdk[method] as Function)(connectId, deviceId, params);

      // Validate
      const validation = this.validateResult(result, testCase);

      return {
        caseId: testCase.id,
        title: testCase.title,
        status: validation.passed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        error: validation.error,
        expected: testCase.expected,
        actual: result.success ? result.payload : result.payload?.error,
      };
    } catch (error) {
      return {
        caseId: testCase.id,
        title: testCase.title,
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message,
        expected: testCase.expected,
      };
    }
  }

  /**
   * Validate test result
   */
  private validateResult(result: any, testCase: TestCase): { passed: boolean; error?: string } {
    if (!result.success) {
      if (testCase.validator.type === 'error') {
        return { passed: true };
      }
      return { passed: false, error: result.payload?.error || 'Unknown error' };
    }

    switch (testCase.validator.type) {
      case 'address': {
        const actual = result.payload?.address?.toLowerCase();
        const expected = testCase.validator.expected.toLowerCase();
        return {
          passed: actual === expected,
          error: actual === expected ? undefined : `Address mismatch: ${actual} !== ${expected}`,
        };
      }

      case 'publicKey': {
        const actual = result.payload?.publicKey?.toLowerCase();
        const expected = testCase.validator.expected.toLowerCase();
        return {
          passed: actual === expected,
          error: actual === expected ? undefined : `PublicKey mismatch`,
        };
      }

      case 'success':
        return { passed: true };

      case 'custom':
        return {
          passed: testCase.validator.validate(result),
          error: 'Custom validation failed',
        };

      default:
        return { passed: true };
    }
  }

  pause(): void {
    if (this.state === 'running') {
      this.state = 'paused';
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  stop(): void {
    this.state = 'stopped';
  }

  getState(): RunnerState {
    return this.state;
  }

  private emitProgress(): void {
    this.emit('progress', {
      totalSuites: this.totalSuites,
      completedSuites: this.completedSuites,
      currentSuite: this.currentSuiteName,
      totalCases: this.totalCases,
      completedCases: this.completedCases,
      currentCase: this.currentCaseTitle,
      overallProgress: Math.round((this.completedCases / this.totalCases) * 100),
    });
  }

  private generateReport(): TestReport {
    const total = this.suiteResults.reduce((sum, s) => sum + s.cases.length, 0);
    const passed = this.suiteResults.reduce((sum, s) => sum + s.passed, 0);
    const failed = this.suiteResults.reduce((sum, s) => sum + s.failed, 0);
    const skipped = this.suiteResults.reduce((sum, s) => sum + s.skipped, 0);

    return {
      id: `report-${Date.now()}`,
      createdAt: new Date(),
      duration: Date.now() - this.startTime,
      device: this.context?.device || {
        deviceType: 'Unknown',
        label: 'Unknown',
        firmwareVersion: 'Unknown',
      },
      summary: {
        total,
        passed,
        failed,
        skipped,
        passRate: total > 0 ? Math.round((passed / total) * 100 * 10) / 10 : 0,
      },
      suites: this.suiteResults,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton
export const testRunnerService = new TestRunnerService();
