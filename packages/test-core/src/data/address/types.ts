/**
 * Address test case data types for hardware wallet testing
 */

export type AddressCaseData = {
  title: string;
  method: string;
  result: {
    address: string;
  };
  name?: string;
  params?: any;
};

export type AddressTestCaseExtra = {
  passphraseState?: string;
  passphrase?: string;
};

/**
 * Single address test case (one address per call)
 */
export type AddressTestCase = {
  id: string;
  name: string;
  description: string;
  data: AddressCaseData[];
  extra: AddressTestCaseExtra;
};

export type AddressBatchCaseData = {
  title: string;
  method: string;
  result: Record<
    string,
    {
      address: string;
    }
  >;
  name?: string;
  params?: any;
};

/**
 * Batch address test case (multiple addresses per call)
 */
export type AddressBatchTestCase = {
  id: string;
  name: string;
  description: string;
  data: AddressBatchCaseData[];
  extra: AddressTestCaseExtra;
};
