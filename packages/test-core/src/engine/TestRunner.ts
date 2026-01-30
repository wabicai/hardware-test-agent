import { EventEmitter } from 'eventemitter3';
import type {
  TestSuite,
  TestCase,
  TestContext,
  TestProgress,
  CaseResult,
  SuiteResult,
  TestReport,
  DeviceInfo,
  FailureDetail,
} from '../types';
import { AutomationEngine } from './AutomationEngine';
import { Reporter } from '../reporter/Reporter';

type RunnerState = 'idle' | 'running' | 'paused' | 'stopped';

interface TestRunnerEvents {
  'suite:start': (suite: TestSuite) => void;
  'suite:complete': (result: SuiteResult) => void;
  'case:start': (testCase: TestCase) => void;
  'case:complete': (result: CaseResult) => void;
  progress: (progress: TestProgress) => void;
  error: (error: Error) => void;
  complete: (report: TestReport) => void;
}

export class TestRunner extends EventEmitter<TestRunnerEvents> {
  private sdk: any;
  private automationEngine: AutomationEngine;
  private reporter: Reporter;

  private state: RunnerState = 'idle';
  private context: TestContext | null = null;

  // Progress tracking
  private totalSuites: number = 0;
  private completedSuites: number = 0;
  private totalCases: number = 0;
  private completedCases: number = 0;
  private currentSuiteName: string = '';
  private currentCaseTitle: string = '';

  // Results
  private suiteResults: SuiteResult[] = [];
  private startTime: number = 0;

  constructor(sdk: any, automationConfig: Partial<any> = {}) {
    super();
    this.sdk = sdk;
    this.automationEngine = new AutomationEngine(sdk, automationConfig);
    this.reporter = new Reporter();
  }

  // ============ Public API ============

  /**
   * Initialize connection to device
   */
  async initialize(connectId: string, deviceId: string): Promise<void> {
    console.log('[TestRunner] Initializing...');

    // Setup automation event handlers
    this.automationEngine.setupEventHandlers();

    // Get device features
    const featuresResult = await this.sdk.getFeatures(connectId, deviceId);
    if (!featuresResult.success) {
      throw new Error(`Failed to get device features: ${featuresResult.payload?.error}`);
    }

    this.context = {
      sdk: this.sdk,
      connectId,
      deviceId,
      deviceFeatures: featuresResult.payload,
      automationEngine: this.automationEngine,
    };

    console.log('[TestRunner] Initialized with device:', deviceId);
  }

  /**
   * Run multiple test suites
   */
  async runSuites(suites: TestSuite[]): Promise<TestReport> {
    if (this.state === 'running') {
      throw new Error('Test runner is already running');
    }

    if (!this.context) {
      throw new Error('TestRunner not initialized. Call initialize() first.');
    }

    this.state = 'running';
    this.startTime = Date.now();
    this.suiteResults = [];

    // Calculate totals
    this.totalSuites = suites.length;
    this.completedSuites = 0;
    this.totalCases = suites.reduce((sum, suite) => sum + suite.getTestCases().length, 0);
    this.completedCases = 0;

    console.log(`[TestRunner] Starting ${this.totalSuites} suites with ${this.totalCases} total cases`);

    try {
      for (const suite of suites) {
        // Check if stopped (state may be changed by stop() method externally)
        if (this.getState() === 'stopped') {
          console.log('[TestRunner] Test stopped by user');
          break;
        }

        // Wait while paused (state may be changed by pause() method externally)
        while (this.getState() === 'paused') {
          await this.delay(100);
        }

        const suiteResult = await this.runSuite(suite);
        this.suiteResults.push(suiteResult);
        this.completedSuites++;

        this.emit('suite:complete', suiteResult);
        this.emitProgress();
      }
    } catch (error) {
      this.emit('error', error as Error);
      console.error('[TestRunner] Error:', error);
    }

    this.state = 'idle';

    // Generate report
    const report = this.generateReport();
    this.emit('complete', report);

    return report;
  }

  /**
   * Run a single test suite
   */
  async runSuite(suite: TestSuite): Promise<SuiteResult> {
    console.log(`[TestRunner] Running suite: ${suite.name}`);

    this.currentSuiteName = suite.name;
    this.emit('suite:start', suite);

    const suiteStartTime = Date.now();
    const caseResults: CaseResult[] = [];
    const testCases = suite.getTestCases();

    // Run suite setup
    if (suite.setup) {
      try {
        await suite.setup(this.context!);
      } catch (error) {
        console.error(`[TestRunner] Suite setup failed: ${error}`);
      }
    }

    // Run each test case
    for (const testCase of testCases) {
      if (this.state === 'stopped') {
        break;
      }

      while (this.state === 'paused') {
        await this.delay(100);
      }

      const result = await this.runCase(testCase);
      caseResults.push(result);
      this.completedCases++;

      this.emit('case:complete', result);
      this.emitProgress();
    }

    // Run suite teardown
    if (suite.teardown) {
      try {
        await suite.teardown(this.context!);
      } catch (error) {
        console.error(`[TestRunner] Suite teardown failed: ${error}`);
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
  async runCase(testCase: TestCase): Promise<CaseResult> {
    console.log(`[TestRunner] Running case: ${testCase.title}`);

    this.currentCaseTitle = testCase.title;
    this.emit('case:start', testCase);

    const startTime = Date.now();

    try {
      // Run beforeRun hook
      if (testCase.beforeRun) {
        await testCase.beforeRun();
      }

      // Build params with showOnOneKey: false for automation
      const params = {
        ...testCase.params,
        showOnOneKey: false,
      };

      // Execute SDK method
      const method = testCase.method as keyof typeof this.sdk;
      const result = await this.sdk[method](
        this.context!.connectId,
        this.context!.deviceId,
        params
      );

      // Run afterRun hook
      if (testCase.afterRun) {
        await testCase.afterRun();
      }

      // Validate result
      const validation = this.validateResult(result, testCase);

      return {
        caseId: testCase.id,
        title: testCase.title,
        status: validation.passed ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        error: validation.error,
        expected: testCase.expected,
        actual: result.success ? result.payload : result.payload?.error,
        metadata: testCase.metadata,
      };
    } catch (error) {
      return {
        caseId: testCase.id,
        title: testCase.title,
        status: 'failed',
        duration: Date.now() - startTime,
        error: (error as Error).message,
        expected: testCase.expected,
        metadata: testCase.metadata,
      };
    }
  }

  /**
   * Pause test execution
   */
  pause(): void {
    if (this.state === 'running') {
      this.state = 'paused';
      console.log('[TestRunner] Paused');
    }
  }

  /**
   * Resume test execution
   */
  resume(): void {
    if (this.state === 'paused') {
      this.state = 'running';
      console.log('[TestRunner] Resumed');
    }
  }

  /**
   * Stop test execution
   */
  stop(): void {
    this.state = 'stopped';
    console.log('[TestRunner] Stopped');
  }

  /**
   * Get current state
   */
  getState(): RunnerState {
    return this.state;
  }

  /**
   * Get automation engine
   */
  getAutomationEngine(): AutomationEngine {
    return this.automationEngine;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.automationEngine.removeEventHandlers();
    this.context = null;
    console.log('[TestRunner] Cleaned up');
  }

  // ============ Private Methods ============

  private validateResult(
    result: any,
    testCase: TestCase
  ): { passed: boolean; error?: string } {
    if (!result.success) {
      if (testCase.validator.type === 'error') {
        // Expected error
        if (testCase.validator.expectedError) {
          const passed = result.payload?.error?.includes(testCase.validator.expectedError);
          return { passed, error: passed ? undefined : `Unexpected error: ${result.payload?.error}` };
        }
        return { passed: true };
      }
      return { passed: false, error: result.payload?.error || 'Unknown error' };
    }

    switch (testCase.validator.type) {
      case 'address': {
        const actualAddress = result.payload?.address?.toLowerCase();
        const expectedAddress = testCase.validator.expected.toLowerCase();
        const passed = actualAddress === expectedAddress;
        return {
          passed,
          error: passed ? undefined : `Address mismatch: expected ${expectedAddress}, got ${actualAddress}`,
        };
      }

      case 'publicKey': {
        const actualKey = result.payload?.publicKey?.toLowerCase();
        const expectedKey = testCase.validator.expected.toLowerCase();
        const passed = actualKey === expectedKey;
        return {
          passed,
          error: passed ? undefined : `PublicKey mismatch: expected ${expectedKey}, got ${actualKey}`,
        };
      }

      case 'success':
        return { passed: true };

      case 'custom':
        const passed = testCase.validator.validate(result);
        return { passed, error: passed ? undefined : 'Custom validation failed' };

      default:
        return { passed: true };
    }
  }

  private emitProgress(): void {
    const progress: TestProgress = {
      totalSuites: this.totalSuites,
      completedSuites: this.completedSuites,
      currentSuite: this.currentSuiteName,
      totalCases: this.totalCases,
      completedCases: this.completedCases,
      currentCase: this.currentCaseTitle,
      overallProgress: Math.round((this.completedCases / this.totalCases) * 100),
    };
    this.emit('progress', progress);
  }

  private generateReport(): TestReport {
    const failures: FailureDetail[] = [];

    for (const suite of this.suiteResults) {
      for (const caseResult of suite.cases) {
        if (caseResult.status === 'failed') {
          failures.push({
            suiteId: suite.suiteId,
            suiteName: suite.name,
            caseId: caseResult.caseId,
            caseTitle: caseResult.title,
            error: caseResult.error || 'Unknown error',
            expected: caseResult.expected,
            actual: caseResult.actual,
          });
        }
      }
    }

    const total = this.suiteResults.reduce((sum, s) => sum + s.cases.length, 0);
    const passed = this.suiteResults.reduce((sum, s) => sum + s.passed, 0);
    const failed = this.suiteResults.reduce((sum, s) => sum + s.failed, 0);
    const skipped = this.suiteResults.reduce((sum, s) => sum + s.skipped, 0);

    const deviceInfo: DeviceInfo = this.context?.deviceFeatures
      ? {
          connectId: this.context.connectId,
          deviceId: this.context.deviceId,
          deviceType: this.context.deviceFeatures.model || 'Unknown',
          label: this.context.deviceFeatures.label || 'Unknown',
          firmwareVersion: this.context.deviceFeatures.firmware_version || 'Unknown',
          serialNumber: this.context.deviceFeatures.serial_no,
        }
      : {
          connectId: '',
          deviceId: '',
          deviceType: 'Unknown',
          label: 'Unknown',
          firmwareVersion: 'Unknown',
        };

    return {
      id: `report-${Date.now()}`,
      createdAt: new Date(),
      duration: Date.now() - this.startTime,
      device: deviceInfo,
      sdkVersion: '1.0.0', // TODO: Get from SDK
      summary: {
        total,
        passed,
        failed,
        skipped,
        passRate: total > 0 ? Math.round((passed / total) * 100 * 10) / 10 : 0,
      },
      suites: this.suiteResults,
      failures,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
