import { Tray, nativeImage, Menu, app, screen, ipcMain, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$2 = path.dirname(fileURLToPath(import.meta.url));
function createTray(win2) {
  const iconPath = path.join(process.env.VITE_PUBLIC ?? path.join(__dirname$2, "../public"), "tray-icon.png");
  const tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", click: () => win2.show() },
    { label: "Hide", click: () => win2.hide() },
    { type: "separator" },
    {
      label: "Customise…",
      click: () => {
        win2.show();
        win2.focus();
        win2.webContents.send("buddy:open-panel");
      }
    },
    { label: "New face", click: () => win2.webContents.send("buddy:new-face") },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]);
  tray.setToolTip("DesktopBuddy");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => win2.isVisible() ? win2.hide() : win2.show());
  return tray;
}
const POLL_MS = 1e3 / 30;
function startCursorFeed(win2) {
  let last = "";
  const timer = setInterval(() => {
    if (win2.isDestroyed() || !win2.isVisible()) return;
    const cursor = screen.getCursorScreenPoint();
    const bounds = win2.getContentBounds();
    const point = { x: cursor.x - bounds.x, y: cursor.y - bounds.y };
    const key = `${point.x},${point.y}`;
    if (key === last) return;
    last = key;
    win2.webContents.send("cursor:move", point);
  }, POLL_MS);
  win2.on("closed", () => clearInterval(timer));
}
const DRAG_MS = 1e3 / 60;
let drag = null;
const windowOf = (event) => BrowserWindow.fromWebContents(event.sender);
function stopDrag() {
  if (!drag) return;
  clearInterval(drag.timer);
  drag = null;
}
function registerWindowControls() {
  ipcMain.on("window:click-through", (event, through) => {
    var _a;
    (_a = windowOf(event)) == null ? void 0 : _a.setIgnoreMouseEvents(through, { forward: true });
  });
  ipcMain.on("window:drag-start", (event) => {
    const win2 = windowOf(event);
    if (!win2) return;
    stopDrag();
    const start = screen.getCursorScreenPoint();
    const bounds = win2.getBounds();
    const grab = { x: start.x - bounds.x, y: start.y - bounds.y };
    const timer = setInterval(() => {
      if (win2.isDestroyed()) return stopDrag();
      const cursor = screen.getCursorScreenPoint();
      win2.setBounds({ x: cursor.x - grab.x, y: cursor.y - grab.y, width: bounds.width, height: bounds.height });
    }, DRAG_MS);
    drag = { win: win2, timer };
  });
  ipcMain.on("window:drag-end", stopDrag);
  ipcMain.on("window:always-on-top", (event, onTop) => {
    var _a;
    (_a = windowOf(event)) == null ? void 0 : _a.setAlwaysOnTop(onTop);
  });
  ipcMain.handle("window:screen-space", (event) => {
    const win2 = windowOf(event);
    if (!win2) return null;
    const content = win2.getContentBounds();
    const { workArea } = screen.getDisplayNearestPoint({
      x: content.x + content.width / 2,
      y: content.y + content.height / 2
    });
    return {
      left: workArea.x - content.x,
      top: workArea.y - content.y,
      right: workArea.x + workArea.width - content.x,
      bottom: workArea.y + workArea.height - content.y
    };
  });
}
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    frame: false,
    // Room for the buddy in the middle and the settings panel on either side.
    // Empty space is click-through, so the extra size never gets in the way.
    width: 860,
    height: 620,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  createTray(win);
  startCursorFeed(win);
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  registerWindowControls();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
