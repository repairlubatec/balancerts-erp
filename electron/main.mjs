import { app, BrowserWindow, shell, session } from "electron";
import { fileURLToPath } from "node:url";
import { assertAllowedDesktopUrl, canOpenExternalUrl } from "./desktop-security.mjs";

let desktopUrl = process.env.BALANCERTS_DESKTOP_URL;
if (!desktopUrl) {
  try {
    ({ desktopUrl } = await import("./desktop-config.mjs"));
  } catch {
    desktopUrl = undefined;
  }
}
if (!desktopUrl && process.env.NODE_ENV === "development") desktopUrl = "http://127.0.0.1:3000";
if (!desktopUrl) throw new Error("BALANCERTS_DESKTOP_URL não está configurada para esta distribuição desktop.");
assertAllowedDesktopUrl(desktopUrl, process.env);
const isDevelopment = process.env.NODE_ENV === "development";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#eef1f4",
    title: "BALANCERTS.ERP",
    webPreferences: {
      preload: fileURLToPath(new URL("./preload.mjs", import.meta.url)),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDevelopment,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = undefined; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (canOpenExternalUrl(url, process.env)) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(desktopUrl);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

app.on("before-quit", () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.closeDevTools();
});
