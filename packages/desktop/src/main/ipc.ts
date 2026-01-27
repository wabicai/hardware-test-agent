import { ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

export function setupIPC(window: BrowserWindow) {
  mainWindow = window;

  // ============ File System API ============

  ipcMain.handle('fs:saveReport', async (_, content: string, defaultName: string) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow!, {
        defaultPath: defaultName,
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: 'JSON', extensions: ['json'] },
          { name: 'HTML', extensions: ['html'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, path: result.filePath };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:selectDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ['openDirectory', 'createDirectory'],
      });

      if (result.canceled || !result.filePaths.length) {
        return { success: false, canceled: true };
      }

      return { success: true, path: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ============ App Info ============

  ipcMain.handle('app:getInfo', async () => {
    return {
      version: '0.1.0',
      electron: process.versions.electron,
      node: process.versions.node,
      platform: process.platform,
    };
  });

  console.log('[IPC] Handlers registered');
}
