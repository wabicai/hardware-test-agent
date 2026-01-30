/**
 * Public key test case data types for hardware wallet testing
 */

export type PubkeyCaseData = {
  title: string;
  method: string;
  result: any;
  name?: string;
  params?: any;
};

export type PubkeyTestCaseExtra = {
  passphraseState?: string;
  passphrase?: string;
};

/**
 * Single pubkey test case (one pubkey per call)
 */
export type PubkeyTestCase = {
  id: string;
  name: string;
  description: string;
  data: PubkeyCaseData[];
  extra: PubkeyTestCaseExtra;
};

export type PubkeyBatchCaseData = {
  title: string;
  method: string;
  result: Record<string, any>;
  name?: string;
  params?: any;
};

/**
 * Batch pubkey test case (multiple pubkeys per call)
 */
export type PubkeyBatchTestCase = {
  id: string;
  name: string;
  description: string;
  data: PubkeyBatchCaseData[];
  extra: PubkeyTestCaseExtra;
};
