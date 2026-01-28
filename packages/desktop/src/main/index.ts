import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { setupIPC } from './ipc';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch {
  // electron-squirrel-startup is optional (only needed for Windows installer)
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
  });

  // ============ WebUSB Permission Handlers ============
  // These handlers allow the SDK to access USB devices (hardware wallets)

  // Permission check handler - allow USB permission requests
  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      console.log('[WebUSB] Permission check:', permission, details);
      if (permission === 'usb') {
        return true;
      }
      return true; // Allow other permissions too
    }
  );

  // Device permission handler - auto-approve USB devices
  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    console.log('[WebUSB] Device permission request:', details.deviceType);
    if (details.deviceType === 'usb') {
      return true;
    }
    return false;
  });

  // USB protected classes handler - exclude audio classes
  mainWindow.webContents.session.setUSBProtectedClassesHandler((details) =>
    details.protectedClasses.filter(
      (usbClass) => usbClass.indexOf('audio') === -1
    )
  );

  // USB device selection handler - auto-select first device or show picker
  mainWindow.webContents.session.on('select-usb-device', (event, details, callback) => {
    console.log('[WebUSB] select-usb-device event');
    console.log('[WebUSB] Available devices:', details.deviceList.length);

    // Don't prevent default - let the browser show its native picker
    // This allows the user to select which device to connect

    if (details.deviceList && details.deviceList.length > 0) {
      // If there's only one device, auto-select it
      if (details.deviceList.length === 1) {
        console.log('[WebUSB] Auto-selecting single device');
        callback(details.deviceList[0].deviceId);
        return;
      }
      // For multiple devices, let the user choose (don't call callback yet)
      // The default behavior will show a picker
      console.log('[WebUSB] Multiple devices available, showing picker');
    } else {
      console.log('[WebUSB] No devices available');
      callback(); // No device selected
    }
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Setup IPC handlers
  setupIPC(mainWindow);
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
