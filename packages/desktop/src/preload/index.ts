import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - exposes safe APIs to the renderer process
 *
 * Note: SDK operations are handled directly in the renderer process
 * because WebUSB requires user interaction in the browser context.
 * Only file system operations use IPC.
 */

contextBridge.exposeInMainWorld('electronAPI', {
  // ============ File System API ============
  fs: {
    saveReport: (content: string, defaultName: string) =>
      ipcRenderer.invoke('fs:saveReport', content, defaultName),
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
  },

  // ============ App Info ============
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
  },
});

// TypeScript type declarations for renderer
declare global {
  interface Window {
    electronAPI: {
      fs: {
        saveReport: (
          content: string,
          defaultName: string
        ) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        selectDirectory: () => Promise<{
          success: boolean;
          path?: string;
          canceled?: boolean;
          error?: string;
        }>;
      };
      app: {
        getInfo: () => Promise<{
          version: string;
          electron: string;
          node: string;
          platform: string;
        }>;
      };
    };
  }
}
