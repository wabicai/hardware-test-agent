import type { AutomationConfig } from '../types';

// UI Request types from @onekeyfe/hd-core
const UI_REQUEST = {
  REQUEST_PIN: 'ui-request_pin',
  REQUEST_PASSPHRASE: 'ui-request_passphrase',
  REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
  REQUEST_BUTTON: 'ui-request_button',
  CLOSE_UI_WINDOW: 'ui-close_window',
  RECEIVE_PIN: 'ui-receive_pin',
  RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
};

const UI_EVENT = 'UI_EVENT';
const DEVICE_EVENT = 'DEVICE_EVENT';

export class AutomationEngine {
  private sdk: any; // CoreApi
  private config: AutomationConfig;

  // Current test context
  private currentPassphrase: string = '';
  private currentPassphraseState: string | undefined;

  // Event handlers (for cleanup)
  private uiEventHandler: ((event: any) => void) | null = null;
  private deviceEventHandler: ((event: any) => void) | null = null;

  constructor(sdk: any, config: Partial<AutomationConfig> = {}) {
    this.sdk = sdk;
    this.config = {
      defaultPin: '123456',
      defaultPassphrase: '',
      responseDelay: 100,
      timeout: 30000,
      ...config,
    };
  }

  // ============ Event Handlers Setup ============

  setupEventHandlers(): void {
    this.uiEventHandler = this.handleUIEvent.bind(this);
    this.deviceEventHandler = this.handleDeviceEvent.bind(this);

    this.sdk.on(UI_EVENT, this.uiEventHandler);
    this.sdk.on(DEVICE_EVENT, this.deviceEventHandler);

    console.log('[AutomationEngine] Event handlers setup complete');
  }

  removeEventHandlers(): void {
    if (this.uiEventHandler) {
      this.sdk.off(UI_EVENT, this.uiEventHandler);
      this.uiEventHandler = null;
    }
    if (this.deviceEventHandler) {
      this.sdk.off(DEVICE_EVENT, this.deviceEventHandler);
      this.deviceEventHandler = null;
    }

    console.log('[AutomationEngine] Event handlers removed');
  }

  // ============ UI Event Handling ============

  private async handleUIEvent(event: any): Promise<void> {
    const { type, payload } = event;

    console.log(`[AutomationEngine] UI Event: ${type}`);

    switch (type) {
      case UI_REQUEST.REQUEST_PIN:
        await this.handlePinRequest(payload);
        break;

      case UI_REQUEST.REQUEST_PASSPHRASE:
        await this.handlePassphraseRequest(payload);
        break;

      case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
        await this.handlePassphraseOnDevice(payload);
        break;

      case UI_REQUEST.REQUEST_BUTTON:
        // With showOnOneKey: false, this shouldn't trigger
        // If it does, it's a required physical confirmation
        console.warn('[AutomationEngine] Physical button confirmation required');
        break;

      case UI_REQUEST.CLOSE_UI_WINDOW:
        // UI close request, usually no action needed
        break;

      default:
        console.log(`[AutomationEngine] Unhandled UI event: ${type}`);
    }
  }

  private async handlePinRequest(payload: any): Promise<void> {
    await this.delay(this.config.responseDelay);

    const pin = this.config.onPinRequest?.() ?? this.config.defaultPin;

    console.log('[AutomationEngine] Responding to PIN request');

    this.sdk.uiResponse({
      type: UI_REQUEST.RECEIVE_PIN,
      payload: pin,
    });
  }

  private async handlePassphraseRequest(payload: any): Promise<void> {
    await this.delay(this.config.responseDelay);

    // Use current test passphrase if set, otherwise use default
    const passphrase =
      this.currentPassphrase ||
      this.config.onPassphraseRequest?.() ||
      this.config.defaultPassphrase;

    console.log(`[AutomationEngine] Responding to passphrase request: "${passphrase}"`);

    this.sdk.uiResponse({
      type: UI_REQUEST.RECEIVE_PASSPHRASE,
      payload: {
        value: passphrase,
        passphraseOnDevice: false,
        save: false,
      },
    });
  }

  private async handlePassphraseOnDevice(payload: any): Promise<void> {
    // Device-side passphrase input mode
    this.sdk.uiResponse({
      type: UI_REQUEST.RECEIVE_PASSPHRASE,
      payload: {
        value: '',
        passphraseOnDevice: true,
        save: false,
      },
    });
  }

  // ============ Device Event Handling ============

  private handleDeviceEvent(event: any): void {
    const { type, payload } = event;

    switch (type) {
      case 'device-connect':
        console.log('[AutomationEngine] Device connected:', payload?.deviceId);
        break;

      case 'device-disconnect':
        console.log('[AutomationEngine] Device disconnected:', payload?.deviceId);
        break;

      case 'device-acquired':
        console.log('[AutomationEngine] Device acquired:', payload?.deviceId);
        break;

      case 'device-released':
        console.log('[AutomationEngine] Device released:', payload?.deviceId);
        break;

      default:
        console.log(`[AutomationEngine] Device event: ${type}`);
    }
  }

  // ============ Public Methods ============

  /**
   * Set the passphrase for the current test
   */
  setCurrentPassphrase(passphrase: string): void {
    this.currentPassphrase = passphrase;
    console.log(`[AutomationEngine] Current passphrase set to: "${passphrase}"`);
  }

  /**
   * Set the passphrase state for the current test
   */
  setCurrentPassphraseState(state: string | undefined): void {
    this.currentPassphraseState = state;
  }

  /**
   * Get current passphrase
   */
  getCurrentPassphrase(): string {
    return this.currentPassphrase;
  }

  /**
   * Get current passphrase state
   */
  getCurrentPassphraseState(): string | undefined {
    return this.currentPassphraseState;
  }

  /**
   * Get passphrase state for a wallet (used for multi-wallet tests)
   */
  async getPassphraseState(
    connectId: string,
    deviceId: string,
    passphrase: string
  ): Promise<string | undefined> {
    // Temporarily set passphrase
    const previousPassphrase = this.currentPassphrase;
    this.setCurrentPassphrase(passphrase);

    try {
      const result = await this.sdk.getPassphraseState(connectId, deviceId, {
        initSession: true,
        useEmptyPassphrase: passphrase === '',
      });

      if (result.success) {
        return result.payload.state;
      }
      throw new Error(result.payload?.error || 'Failed to get passphrase state');
    } finally {
      // Restore previous passphrase
      this.setCurrentPassphrase(previousPassphrase);
    }
  }

  /**
   * Update automation config
   */
  updateConfig(config: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current config
   */
  getConfig(): AutomationConfig {
    return { ...this.config };
  }

  // ============ Utility Methods ============

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
