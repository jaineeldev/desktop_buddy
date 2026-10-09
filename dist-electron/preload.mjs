"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
function subscribe(channel, callback) {
  const listener = (_event, payload) => callback(payload);
  electron.ipcRenderer.on(channel, listener);
  return () => {
    electron.ipcRenderer.off(channel, listener);
  };
}
electron.contextBridge.exposeInMainWorld("buddy", {
  onCursor: (callback) => subscribe("cursor:move", callback),
  onNewFace: (callback) => subscribe("buddy:new-face", callback),
  onOpenPanel: (callback) => subscribe("buddy:open-panel", callback),
  onShaken: (callback) => subscribe("buddy:shaken", callback),
  onReplayIntro: (callback) => subscribe("buddy:replay-intro", callback),
  setClickThrough: (through) => electron.ipcRenderer.send("window:click-through", through),
  dragStart: () => electron.ipcRenderer.send("window:drag-start"),
  dragEnd: () => electron.ipcRenderer.send("window:drag-end"),
  setAlwaysOnTop: (onTop) => electron.ipcRenderer.send("window:always-on-top", onTop),
  getScreenSpace: () => electron.ipcRenderer.invoke("window:screen-space"),
  setTrayIcon: (icon) => electron.ipcRenderer.send("tray:set-icon", icon)
});
