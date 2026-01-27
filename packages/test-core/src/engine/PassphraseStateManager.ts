import type { PassphraseWallet } from '../types';
import type { AutomationEngine } from './AutomationEngine';

export class PassphraseStateManager {
  private wallets: Map<string, PassphraseWallet> = new Map();
  private automationEngine: AutomationEngine;

  constructor(automationEngine: AutomationEngine) {
    this.automationEngine = automationEngine;
  }

  /**
   * Initialize multiple wallets with their passphrase states
   */
  async initWallets(
    connectId: string,
    deviceId: string,
    passphrases: string[]
  ): Promise<void> {
    console.log(`[PassphraseStateManager] Initializing ${passphrases.length} wallets`);

    for (const passphrase of passphrases) {
      try {
        const state = await this.automationEngine.getPassphraseState(
          connectId,
          deviceId,
          passphrase
        );

        this.wallets.set(passphrase, {
          passphrase,
          passphraseState: state,
          isEmptyPassphrase: passphrase === '',
        });

        console.log(
          `[PassphraseStateManager] Wallet initialized: passphrase="${passphrase}", state=${state}`
        );
      } catch (error) {
        console.error(
          `[PassphraseStateManager] Failed to init wallet with passphrase "${passphrase}":`,
          error
        );
        throw error;
      }
    }
  }

  /**
   * Get wallet by passphrase
   */
  getWallet(passphrase: string): PassphraseWallet | undefined {
    return this.wallets.get(passphrase);
  }

  /**
   * Switch to a specific wallet (sets current passphrase and state in automation engine)
   */
  switchToWallet(passphrase: string): void {
    const wallet = this.wallets.get(passphrase);
    if (!wallet) {
      throw new Error(`Wallet with passphrase "${passphrase}" not found`);
    }

    this.automationEngine.setCurrentPassphrase(wallet.passphrase);
    this.automationEngine.setCurrentPassphraseState(wallet.passphraseState);

    console.log(`[PassphraseStateManager] Switched to wallet: passphrase="${passphrase}"`);
  }

  /**
   * Get all initialized wallets
   */
  getAllWallets(): PassphraseWallet[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Check if a wallet exists
   */
  hasWallet(passphrase: string): boolean {
    return this.wallets.has(passphrase);
  }

  /**
   * Clear all wallets
   */
  clear(): void {
    this.wallets.clear();
    console.log('[PassphraseStateManager] All wallets cleared');
  }

  /**
   * Get wallet count
   */
  getWalletCount(): number {
    return this.wallets.size;
  }
}
