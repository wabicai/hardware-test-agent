/**
 * Test Suites Definition
 *
 * Imports test suites from @hardware-test/test-core and adapts them for desktop use.
 * Also provides simplified suites for quick testing.
 */

import type { TestSuite, TestCase, TestContext } from './testRunner';
import {
  AddressSuite as CoreAddressSuite,
  allSuites as coreAllSuites,
} from '@hardware-test/test-core';

// ============ Adapted Address Suite from test-core ============

/**
 * AddressSuite that uses real test data from test-core
 * Contains thousands of test cases with expected address values
 */
class AddressSuite implements TestSuite {
  id = 'address';
  name = '地址测试 (完整数据)';
  description = '使用完整测试数据验证各链地址生成的正确性';

  private coreSuite = new CoreAddressSuite();
  private initialized = false;

  async setup(context: TestContext): Promise<void> {
    // Adapt context for core suite
    const coreContext = {
      sdk: context.sdk,
      connectId: context.connectId,
      deviceId: context.deviceId,
      deviceFeatures: context.device,
      automationEngine: null,
    };
    await this.coreSuite.setup(coreContext as any);
    this.initialized = true;
    console.log(`[AddressSuite] Loaded ${this.getTestCases().length} test cases from test-core`);
  }

  getTestCases(): TestCase[] {
    const coreCases = this.coreSuite.getTestCases();
    // Adapt core test cases to desktop format
    return coreCases.map((tc) => ({
      ...tc,
      expected: tc.expected ?? null,
    }));
  }
}

// ============ Quick Address Suite (simplified for fast testing) ============

class QuickAddressSuite implements TestSuite {
  id = 'address-quick';
  name = '地址快速测试';
  description = '快速验证主要链的地址生成（无预期值验证）';

  private testCases: TestCase[] = [];

  async setup(context: TestContext): Promise<void> {
    this.testCases = this.generateTestCases();
    console.log(`[QuickAddressSuite] Generated ${this.testCases.length} test cases`);
  }

  getTestCases(): TestCase[] {
    return this.testCases.length > 0 ? this.testCases : this.generateTestCases();
  }

  private generateTestCases(): TestCase[] {
    const chains = [
      { method: 'btcGetAddress', name: 'Bitcoin', params: { path: "m/44'/0'/0'/0/0", coin: 'btc' } },
      { method: 'evmGetAddress', name: 'Ethereum', params: { path: "m/44'/60'/0'/0/0" } },
      { method: 'solGetAddress', name: 'Solana', params: { path: "m/44'/501'/0'" } },
      { method: 'cosmosGetAddress', name: 'Cosmos', params: { path: "m/44'/118'/0'/0/0" } },
      { method: 'aptosGetAddress', name: 'Aptos', params: { path: "m/44'/637'/0'/0'/0'" } },
      { method: 'suiGetAddress', name: 'Sui', params: { path: "m/44'/784'/0'/0'/0'" } },
      { method: 'tonGetAddress', name: 'TON', params: { path: "m/44'/607'/0'" } },
    ];

    return chains.map((chain) => ({
      id: `${this.id}-${chain.method}`,
      title: `${chain.name} 地址获取`,
      method: chain.method,
      params: chain.params,
      validator: { type: 'success' as const },
      metadata: { chain: chain.name },
    }));
  }
}

// ============ Passphrase Test Suite ============

class PassphraseSuite implements TestSuite {
  id = 'passphrase';
  name = 'Passphrase 测试';
  description = '测试多钱包切换和 Passphrase 状态管理';

  getTestCases(): TestCase[] {
    const passphrases = ['', 'test123', 'secure-wallet-phrase'];

    return passphrases.flatMap((passphrase, index) => [
      {
        id: `${this.id}-btc-${index}`,
        title: `BTC 地址 (passphrase: ${passphrase || '空'})`,
        method: 'btcGetAddress',
        params: { path: "m/44'/0'/0'/0/0", coin: 'btc' },
        passphrase,
        validator: { type: 'success' as const },
        metadata: { passphrase },
      },
      {
        id: `${this.id}-evm-${index}`,
        title: `EVM 地址 (passphrase: ${passphrase || '空'})`,
        method: 'evmGetAddress',
        params: { path: "m/44'/60'/0'/0/0" },
        passphrase,
        validator: { type: 'success' as const },
        metadata: { passphrase },
      },
    ]);
  }
}

// ============ Chain Method Batch Test Suite ============

class ChainMethodSuite implements TestSuite {
  id = 'chain-method';
  name = '链方法批量测试';
  description = '批量测试各链的地址、公钥获取方法';

  getTestCases(): TestCase[] {
    const methods = [
      // BTC
      { method: 'btcGetAddress', title: 'BTC GetAddress', params: { path: "m/44'/0'/0'/0/0", coin: 'btc' } },
      { method: 'btcGetPublicKey', title: 'BTC GetPublicKey', params: { path: "m/44'/0'/0'" } },

      // EVM
      { method: 'evmGetAddress', title: 'EVM GetAddress', params: { path: "m/44'/60'/0'/0/0" } },
      { method: 'evmGetPublicKey', title: 'EVM GetPublicKey', params: { path: "m/44'/60'/0'/0/0" } },

      // Solana
      { method: 'solGetAddress', title: 'Solana GetAddress', params: { path: "m/44'/501'/0'" } },

      // Cosmos
      { method: 'cosmosGetAddress', title: 'Cosmos GetAddress', params: { path: "m/44'/118'/0'/0/0" } },
      { method: 'cosmosGetPublicKey', title: 'Cosmos GetPublicKey', params: { path: "m/44'/118'/0'/0/0" } },

      // Aptos
      { method: 'aptosGetAddress', title: 'Aptos GetAddress', params: { path: "m/44'/637'/0'/0'/0'" } },
      { method: 'aptosGetPublicKey', title: 'Aptos GetPublicKey', params: { path: "m/44'/637'/0'/0'/0'" } },

      // Sui
      { method: 'suiGetAddress', title: 'Sui GetAddress', params: { path: "m/44'/784'/0'/0'/0'" } },
      { method: 'suiGetPublicKey', title: 'Sui GetPublicKey', params: { path: "m/44'/784'/0'/0'/0'" } },

      // Polkadot
      { method: 'polkadotGetAddress', title: 'Polkadot GetAddress', params: { path: "m/44'/354'/0'/0'/0'", prefix: '0', network: 'polkadot' } },

      // Cardano
      { method: 'cardanoGetAddress', title: 'Cardano GetAddress', params: {
        addressParameters: {
          addressType: 0,
          path: "m/1852'/1815'/0'/0/0",
          stakingPath: "m/1852'/1815'/0'/2/0",
        }
      }},
      { method: 'cardanoGetPublicKey', title: 'Cardano GetPublicKey', params: { path: "m/1852'/1815'/0'" } },

      // TON
      { method: 'tonGetAddress', title: 'TON GetAddress', params: { path: "m/44'/607'/0'" } },

      // XRP
      { method: 'xrpGetAddress', title: 'XRP GetAddress', params: { path: "m/44'/144'/0'/0/0" } },

      // Stellar
      { method: 'stellarGetAddress', title: 'Stellar GetAddress', params: { path: "m/44'/148'/0'" } },

      // Near
      { method: 'nearGetAddress', title: 'Near GetAddress', params: { path: "m/44'/397'/0'" } },

      // Tron
      { method: 'tronGetAddress', title: 'Tron GetAddress', params: { path: "m/44'/195'/0'/0/0" } },

      // Algorand
      { method: 'algoGetAddress', title: 'Algorand GetAddress', params: { path: "m/44'/283'/0'/0'/0'" } },
    ];

    return methods.map((m) => ({
      id: `${this.id}-${m.method}`,
      title: m.title,
      method: m.method,
      params: m.params,
      validator: { type: 'success' as const },
    }));
  }
}

// ============ Functional Test Suite ============

class FunctionalSuite implements TestSuite {
  id = 'functional';
  name = '功能测试';
  description = '测试设备基础功能（获取特性、锁定等）';

  getTestCases(): TestCase[] {
    return [
      {
        id: `${this.id}-getFeatures`,
        title: '获取设备特性',
        method: 'getFeatures',
        params: {},
        validator: { type: 'success' as const },
      },
      {
        id: `${this.id}-getOnekeyFeatures`,
        title: '获取 OneKey 特性',
        method: 'getOnekeyFeatures',
        params: {},
        validator: { type: 'success' as const },
      },
    ];
  }
}

// ============ Batch Address Test Suite ============

class BatchAddressSuite implements TestSuite {
  id = 'batch-address';
  name = '批量地址测试';
  description = '测试批量获取地址功能';

  getTestCases(): TestCase[] {
    return [
      {
        id: `${this.id}-btc-batch`,
        title: 'BTC 批量地址 (10个)',
        method: 'btcGetAddress',
        params: {
          bundle: Array.from({ length: 10 }, (_, i) => ({
            path: `m/44'/0'/0'/0/${i}`,
            coin: 'btc',
            showOnOneKey: false,
          })),
        },
        validator: { type: 'success' as const },
      },
      {
        id: `${this.id}-evm-batch`,
        title: 'EVM 批量地址 (10个)',
        method: 'evmGetAddress',
        params: {
          bundle: Array.from({ length: 10 }, (_, i) => ({
            path: `m/44'/60'/0'/0/${i}`,
            showOnOneKey: false,
          })),
        },
        validator: { type: 'success' as const },
      },
    ];
  }
}

// ============ Export All Suites ============

export const allSuites: TestSuite[] = [
  new AddressSuite(),        // Full address tests with expected values from test-core
  new QuickAddressSuite(),   // Quick address tests without expected value validation
  new PassphraseSuite(),
  new ChainMethodSuite(),
  new FunctionalSuite(),
  new BatchAddressSuite(),
];

export function getSuiteById(id: string): TestSuite | undefined {
  return allSuites.find((s) => s.id === id);
}

export function getSuitesByIds(ids: string[]): TestSuite[] {
  return allSuites.filter((s) => ids.includes(s.id));
}

// Suite info for UI display
export interface SuiteInfo {
  id: string;
  name: string;
  description: string;
  caseCount: number;
}

export function getSuiteInfos(): SuiteInfo[] {
  return allSuites.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    caseCount: s.getTestCases().length,
  }));
}
