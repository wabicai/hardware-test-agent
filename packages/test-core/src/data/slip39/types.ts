/**
 * SLIP39 test case data types for hardware wallet testing
 */

export type SLIP39TestCaseData = {
  id: string;
  name: string;
  description: string;
  shares: string[];
  passphrase?: string;
  passphraseState?: string;
  data: {
    method: string;
    name?: string;
    params?: any;
    expectedAddress: Record<string, string>;
  }[];
};

export type SLIP39TestCaseExtra = {
  shares: string[];
  passphraseState?: string;
  passphrase?: string;
};

/**
 * Single SLIP39 address test case
 */
export type SLIP39AddressTestCase = {
  id: string;
  name: string;
  description: string;
  data: SLIP39CaseData[];
  extra: SLIP39TestCaseExtra;
};

export type SLIP39CaseData = {
  title: string;
  method: string;
  result: {
    address: string;
  };
  name?: string;
  params?: any;
};

/**
 * Batch SLIP39 address test case
 */
export type SLIP39BatchTestCase = {
  id: string;
  name: string;
  description: string;
  data: SLIP39BatchCaseData[];
  extra: SLIP39TestCaseExtra;
};

export type SLIP39BatchCaseData = {
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
