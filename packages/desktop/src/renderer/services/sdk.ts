/**
 * SDK Service - WebUSB based hardware wallet SDK integration
 *
 * Uses @onekeyfe/hd-common-connect-sdk with WebUSB transport
 * Must be used in renderer process due to WebUSB user interaction requirements
 */

import type { CoreApi, ConnectSettings, Features } from '@onekeyfe/hd-common-connect-sdk';

// Event types from SDK
export const UI_EVENT = 'UI_EVENT';
export const DEVICE_EVENT = 'DEVICE_EVENT';

export const UI_REQUEST = {
  REQUEST_PIN: 'ui-request_pin',
  REQUEST_PASSPHRASE: 'ui-request_passphrase',
  REQUEST_PASSPHRASE_ON_DEVICE: 'ui-request_passphrase_on_device',
  REQUEST_BUTTON: 'ui-request_button',
  CLOSE_UI_WINDOW: 'ui-close_window',
  RECEIVE_PIN: 'ui-receive_pin',
  RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
};

export interface DeviceInfo {
  connectId: string;
  deviceId: string;
  deviceType: string;
  label: string;
  firmwareVersion: string;
  serialNumber?: string;
  features?: Features;
}

class SDKService {
  private sdk: CoreApi | null = null;
  private initialized = false;
  private currentDevice: DeviceInfo | null = null;

  // Event callbacks
  private onDeviceConnect?: (device: DeviceInfo) => void;
  private onDeviceDisconnect?: () => void;

  /**
   * Initialize the SDK with WebUSB transport
   */
  async init(): Promise<void> {
    if (this.initialized) {
      console.log('[SDKService] Already initialized');
      return;
    }

    console.log('[SDKService] Initializing SDK...');

    try {
      // Dynamic import to avoid issues with SSR/preload
      const sdkModule = await import('@onekeyfe/hd-common-connect-sdk');
      this.sdk = sdkModule.default;

      const settings: Partial<ConnectSettings> = {
        debug: true,
        fetchConfig: true,
        env: 'webusb', // Use WebUSB transport
      };

      await this.sdk.init(settings);
      this.initialized = true;

      // Setup device event listeners
      this.setupEventListeners();

      console.log('[SDKService] SDK initialized successfully');
    } catch (error) {
      console.error('[SDKService] Failed to initialize SDK:', error);
      throw error;
    }
  }

  /**
   * Setup SDK event listeners
   */
  private setupEventListeners(): void {
    if (!this.sdk) return;

    this.sdk.on(DEVICE_EVENT, (event: any) => {
      console.log('[SDKService] Device event:', event.type);

      switch (event.type) {
        case 'device-connect':
          // Device connected, but we need to get features to fully identify it
          break;
        case 'device-disconnect':
          this.currentDevice = null;
          this.onDeviceDisconnect?.();
          break;
      }
    });
  }

  /**
   * Prompt user to select a WebUSB device
   * Must be called from a user gesture (click handler)
   */
  async promptDeviceAccess(): Promise<DeviceInfo | null> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    console.log('[SDKService] Prompting for device access...');

    try {
      // This will open the browser's USB device picker
      const result = await this.sdk.promptWebDeviceAccess();

      if (!result.success) {
        console.log('[SDKService] User cancelled device selection or error:', result.payload);
        return null;
      }

      console.log('[SDKService] Device selected, searching...');

      // Search for the device
      const searchResult = await this.sdk.searchDevices();

      if (!searchResult.success || !searchResult.payload?.length) {
        console.log('[SDKService] No devices found after selection');
        return null;
      }

      const device = searchResult.payload[0];
      console.log('[SDKService] Device found:', device);

      // Get device features
      const featuresResult = await this.sdk.getFeatures(device.connectId, device.deviceId);

      if (featuresResult.success) {
        this.currentDevice = {
          connectId: device.connectId,
          deviceId: device.deviceId,
          deviceType: featuresResult.payload.model || 'Unknown',
          label: featuresResult.payload.label || 'OneKey Device',
          firmwareVersion: `${featuresResult.payload.major_version}.${featuresResult.payload.minor_version}.${featuresResult.payload.patch_version}`,
          serialNumber: featuresResult.payload.serial_no,
          features: featuresResult.payload,
        };

        this.onDeviceConnect?.(this.currentDevice);
        return this.currentDevice;
      }

      return null;
    } catch (error) {
      console.error('[SDKService] Error during device access:', error);
      throw error;
    }
  }

  /**
   * Search for already connected devices
   */
  async searchDevices(): Promise<DeviceInfo[]> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    const result = await this.sdk.searchDevices();

    if (!result.success || !result.payload) {
      return [];
    }

    const devices: DeviceInfo[] = [];

    for (const device of result.payload) {
      try {
        const featuresResult = await this.sdk.getFeatures(device.connectId, device.deviceId);
        if (featuresResult.success) {
          devices.push({
            connectId: device.connectId,
            deviceId: device.deviceId,
            deviceType: featuresResult.payload.model || 'Unknown',
            label: featuresResult.payload.label || 'OneKey Device',
            firmwareVersion: `${featuresResult.payload.major_version}.${featuresResult.payload.minor_version}.${featuresResult.payload.patch_version}`,
            serialNumber: featuresResult.payload.serial_no,
            features: featuresResult.payload,
          });
        }
      } catch (e) {
        console.warn('[SDKService] Error getting device features:', e);
      }
    }

    return devices;
  }

  /**
   * Get SDK instance for direct API calls
   */
  getSDK(): CoreApi {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    return this.sdk;
  }

  /**
   * Get current connected device
   */
  getCurrentDevice(): DeviceInfo | null {
    return this.currentDevice;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Set device connection callbacks
   */
  setCallbacks(callbacks: {
    onConnect?: (device: DeviceInfo) => void;
    onDisconnect?: () => void;
  }): void {
    this.onDeviceConnect = callbacks.onConnect;
    this.onDeviceDisconnect = callbacks.onDisconnect;
  }

  /**
   * Respond to UI request (PIN, Passphrase, etc.)
   */
  uiResponse(response: { type: string; payload: any }): void {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    this.sdk.uiResponse(response);
  }

  /**
   * Register UI event listener
   */
  onUIEvent(callback: (event: any) => void): () => void {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }
    this.sdk.on(UI_EVENT, callback);
    return () => this.sdk?.off(UI_EVENT, callback);
  }

  /**
   * Dispose SDK
   */
  dispose(): void {
    if (this.sdk) {
      this.sdk.dispose();
      this.sdk = null;
      this.initialized = false;
      this.currentDevice = null;
    }
  }
}

// Singleton instance
export const sdkService = new SDKService();
