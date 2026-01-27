import { contextBridge as t, ipcRenderer as e } from "electron";
t.exposeInMainWorld("electronAPI", {
  // ============ File System API ============
  fs: {
    saveReport: (o, r) => e.invoke("fs:saveReport", o, r),
    selectDirectory: () => e.invoke("fs:selectDirectory")
  },
  // ============ App Info ============
  app: {
    getInfo: () => e.invoke("app:getInfo")
  }
});
