// ============ Test Case Types ============

export type VerifyState = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestCase {
  id: string;
  title: string;
  method: string;
  params: Record<string, any>;
  expected: any;
  validator: ResultValidator;
  metadata?: Record<string, any>;

  // Optional lifecycle hooks
  beforeRun?(): Promise<void>;
  afterRun?(): Promise<void>;
}

export type ResultValidator =
  | { type: 'address'; expected: string }
  | { type: 'publicKey'; expected: string }
  | { type: 'success' }
  | { type: 'error'; expectedError?: string }
  | { type: 'custom'; validate: (result: any) => boolean };

// ============ Test Suite Types ============

export interface TestSuite {
  id: string;
  name: string;
  description: string;

  getTestCases(): TestCase[];
  setup?(context: TestContext): Promise<void>;
  teardown?(context: TestContext): Promise<void>;
}

export interface TestContext {
  sdk: any; // CoreApi from @onekeyfe/hd-core
  connectId: string;
  deviceId: string;
  deviceFeatures: any;
  automationEngine: any;
}

// ============ Test Result Types ============

export interface CaseResult {
  caseId: string;
  title: string;
  status: VerifyState;
  duration: number;
  error?: string;
  expected?: any;
  actual?: any;
  metadata?: Record<string, any>;
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

export interface TestReport {
  id: string;
  createdAt: Date;
  duration: number;
  device: DeviceInfo;
  sdkVersion: string;
  summary: TestSummary;
  suites: SuiteResult[];
  failures: FailureDetail[];
}

export interface DeviceInfo {
  connectId: string;
  deviceId: string;
  deviceType: string;
  label: string;
  firmwareVersion: string;
  serialNumber?: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
}

export interface FailureDetail {
  suiteId: string;
  suiteName: string;
  caseId: string;
  caseTitle: string;
  error: string;
  expected?: any;
  actual?: any;
}

// ============ Progress Types ============

export interface TestProgress {
  totalSuites: number;
  completedSuites: number;
  currentSuite: string;
  totalCases: number;
  completedCases: number;
  currentCase: string;
  overallProgress: number; // 0-100
}

// ============ Automation Types ============

export interface AutomationConfig {
  defaultPin: string;
  defaultPassphrase: string;
  responseDelay: number;
  timeout: number;
  onPinRequest?: () => string;
  onPassphraseRequest?: () => string;
}

export interface PassphraseWallet {
  passphrase: string;
  passphraseState: string | undefined;
  isEmptyPassphrase: boolean;
}

// ============ Event Types ============

export type TestEventType =
  | 'suite:start'
  | 'suite:complete'
  | 'case:start'
  | 'case:complete'
  | 'progress'
  | 'error'
  | 'complete';

export interface TestEvent {
  type: TestEventType;
  payload: any;
  timestamp: Date;
}
