import { Tray, Menu, BrowserWindow, app, ipcMain, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createTray(win: BrowserWindow) {
  // Shown for a moment at startup, until the app draws your own buddy for the tray.
  const iconPath = path.join(process.env.VITE_PUBLIC ?? path.join(__dirname, '../public'), 'tray-icon.png')
  const tray = new Tray(nativeImage.createFromPath(iconPath))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => win.show() },
    { label: 'Hide', click: () => win.hide() },
    { type: 'separator' },
    {
      label: 'Customise…',
      click: () => {
        win.show()
        win.focus()
        win.webContents.send('buddy:open-panel')
      },
    },
    { label: 'New face', click: () => win.webContents.send('buddy:new-face') },
    {
      label: 'Show intro again',
      click: () => {
        win.show()
        win.focus()
        win.webContents.send('buddy:replay-intro')
      },
    },
    { type: 'separator' },
    {
      // Only the installed app can do this; in development it would register the dev copy of Electron.
      label: app.isPackaged ? 'Start with Windows' : 'Start with Windows (installed app only)',
      type: 'checkbox',
      enabled: app.isPackaged,
      checked: app.isPackaged && app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setToolTip('DesktopBuddy')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()))

  // The renderer sends the buddy drawn at 1x and 2x, so it stays crisp on high-DPI screens.
  ipcMain.removeAllListeners('tray:set-icon')
  ipcMain.on('tray:set-icon', (_event, icon: { x1: string; x2: string; tooltip: string }) => {
    if (tray.isDestroyed()) return
    const image = nativeImage.createEmpty()
    image.addRepresentation({ scaleFactor: 1, dataURL: icon.x1 })
    image.addRepresentation({ scaleFactor: 2, dataURL: icon.x2 })
    tray.setImage(image)
    tray.setToolTip(icon.tooltip)
  })

  return tray
}
