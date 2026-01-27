import { ipcMain as s, dialog as i, app as o, BrowserWindow as d } from "electron";
import l from "path";
import f from "fs";
let a = null;
function p(r) {
  a = r, s.handle("fs:saveReport", async (e, h, u) => {
    try {
      const t = await i.showSaveDialog(a, {
        defaultPath: u,
        filters: [
          { name: "Markdown", extensions: ["md"] },
          { name: "JSON", extensions: ["json"] },
          { name: "HTML", extensions: ["html"] },
          { name: "All Files", extensions: ["*"] }
        ]
      });
      return t.canceled || !t.filePath ? { success: !1, canceled: !0 } : (f.writeFileSync(t.filePath, h, "utf-8"), { success: !0, path: t.filePath });
    } catch (t) {
      return { success: !1, error: t.message };
    }
  }), s.handle("fs:selectDirectory", async () => {
    try {
      const e = await i.showOpenDialog(a, {
        properties: ["openDirectory", "createDirectory"]
      });
      return e.canceled || !e.filePaths.length ? { success: !1, canceled: !0 } : { success: !0, path: e.filePaths[0] };
    } catch (e) {
      return { success: !1, error: e.message };
    }
  }), s.handle("app:getInfo", async () => ({
    version: "0.1.0",
    electron: process.versions.electron,
    node: process.versions.node,
    platform: process.platform
  })), console.log("[IPC] Handlers registered");
}
try {
  require("electron-squirrel-startup") && o.quit();
} catch {
}
let n = null;
const m = process.env.NODE_ENV === "development" || !o.isPackaged;
function c() {
  n = new d({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: l.join(__dirname, "../preload/index.js"),
      nodeIntegration: !1,
      contextIsolation: !0
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 }
  }), m ? (n.loadURL("http://localhost:5173"), n.webContents.openDevTools()) : n.loadFile(l.join(__dirname, "../renderer/index.html")), n.on("closed", () => {
    n = null;
  }), p(n);
}
o.whenReady().then(() => {
  c(), o.on("activate", () => {
    d.getAllWindows().length === 0 && c();
  });
});
o.on("window-all-closed", () => {
  process.platform !== "darwin" && o.quit();
});
process.on("uncaughtException", (r) => {
  console.error("Uncaught Exception:", r);
});
process.on("unhandledRejection", (r, e) => {
  console.error("Unhandled Rejection at:", e, "reason:", r);
});
