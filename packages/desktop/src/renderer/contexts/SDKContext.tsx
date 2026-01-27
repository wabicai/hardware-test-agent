import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { sdkService, DeviceInfo, UI_REQUEST, UI_EVENT } from '../services/sdk';
import type { CoreApi } from '@onekeyfe/hd-common-connect-sdk';

interface AutomationConfig {
  defaultPin: string;
  defaultPassphrase: string;
  autoRespond: boolean;
}

interface SDKContextValue {
  // State
  initialized: boolean;
  device: DeviceInfo | null;
  connecting: boolean;
  error: string | null;

  // Automation
  automationConfig: AutomationConfig;
  currentPassphrase: string;
  setCurrentPassphrase: (passphrase: string) => void;
  setAutomationConfig: (config: Partial<AutomationConfig>) => void;

  // Actions
  connectDevice: () => Promise<DeviceInfo | null>;
  searchDevices: () => Promise<DeviceInfo[]>;
  getSDK: () => CoreApi;
}

const defaultAutomationConfig: AutomationConfig = {
  defaultPin: '123456',
  defaultPassphrase: '',
  autoRespond: true,
};

const SDKContext = createContext<SDKContextValue | null>(null);

export function SDKProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [automationConfig, setAutomationConfigState] = useState<AutomationConfig>(defaultAutomationConfig);
  const [currentPassphrase, setCurrentPassphrase] = useState('');

  // Use ref for automation config to avoid stale closures in event handlers
  const automationConfigRef = useRef(automationConfig);
  const currentPassphraseRef = useRef(currentPassphrase);

  useEffect(() => {
    automationConfigRef.current = automationConfig;
  }, [automationConfig]);

  useEffect(() => {
    currentPassphraseRef.current = currentPassphrase;
  }, [currentPassphrase]);

  // Initialize SDK on mount
  useEffect(() => {
    let mounted = true;

    const initSDK = async () => {
      try {
        await sdkService.init();
        if (mounted) {
          setInitialized(true);

          // Setup device callbacks
          sdkService.setCallbacks({
            onConnect: (d) => setDevice(d),
            onDisconnect: () => setDevice(null),
          });

          // Search for already connected devices
          const devices = await sdkService.searchDevices();
          if (devices.length > 0 && mounted) {
            setDevice(devices[0]);
          }
        }
      } catch (e) {
        if (mounted) {
          setError((e as Error).message);
        }
      }
    };

    initSDK();

    return () => {
      mounted = false;
    };
  }, []);

  // Setup UI event handler for automation
  useEffect(() => {
    if (!initialized) return;

    const handleUIEvent = (event: any) => {
      const { type } = event;
      const config = automationConfigRef.current;

      if (!config.autoRespond) {
        console.log('[SDKContext] Auto-respond disabled, ignoring UI event:', type);
        return;
      }

      console.log('[SDKContext] Handling UI event:', type);

      switch (type) {
        case UI_REQUEST.REQUEST_PIN:
          console.log('[SDKContext] Auto-responding to PIN request');
          sdkService.uiResponse({
            type: UI_REQUEST.RECEIVE_PIN,
            payload: config.defaultPin,
          });
          break;

        case UI_REQUEST.REQUEST_PASSPHRASE:
          const passphrase = currentPassphraseRef.current || config.defaultPassphrase;
          console.log(`[SDKContext] Auto-responding to passphrase request: "${passphrase}"`);
          sdkService.uiResponse({
            type: UI_REQUEST.RECEIVE_PASSPHRASE,
            payload: {
              value: passphrase,
              passphraseOnDevice: false,
              save: false,
            },
          });
          break;

        case UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE:
          sdkService.uiResponse({
            type: UI_REQUEST.RECEIVE_PASSPHRASE,
            payload: {
              value: '',
              passphraseOnDevice: true,
              save: false,
            },
          });
          break;

        case UI_REQUEST.REQUEST_BUTTON:
          console.log('[SDKContext] Button confirmation required on device');
          // Can't auto-respond to physical button requests
          break;
      }
    };

    const cleanup = sdkService.onUIEvent(handleUIEvent);
    return cleanup;
  }, [initialized]);

  const connectDevice = useCallback(async (): Promise<DeviceInfo | null> => {
    setConnecting(true);
    setError(null);

    try {
      const deviceInfo = await sdkService.promptDeviceAccess();
      if (deviceInfo) {
        setDevice(deviceInfo);
      }
      return deviceInfo;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const searchDevices = useCallback(async (): Promise<DeviceInfo[]> => {
    try {
      return await sdkService.searchDevices();
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, []);

  const getSDK = useCallback((): CoreApi => {
    return sdkService.getSDK();
  }, []);

  const setAutomationConfig = useCallback((config: Partial<AutomationConfig>) => {
    setAutomationConfigState((prev) => ({ ...prev, ...config }));
  }, []);

  const value: SDKContextValue = {
    initialized,
    device,
    connecting,
    error,
    automationConfig,
    currentPassphrase,
    setCurrentPassphrase,
    setAutomationConfig,
    connectDevice,
    searchDevices,
    getSDK,
  };

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
}

export function useSDK(): SDKContextValue {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within SDKProvider');
  }
  return context;
}
