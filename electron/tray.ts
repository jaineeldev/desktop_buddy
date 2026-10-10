import { Tray, Menu, BrowserWindow, app, ipcMain, nativeImage, type MenuItemConstructorOptions } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { Updates } from './updater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** The menu's update line, which follows the updater from checking through to ready. */
function updateItem(updates: Updates): MenuItemConstructorOptions {
  if (!updates.enabled) return { label: 'Check for updates (installed app only)', enabled: false }
  const { state } = updates
  switch (state.status) {
    case 'checking':
      return { label: 'Checking for updates…', enabled: false }
    case 'downloading':
      return { label: `Downloading ${state.version}…`, enabled: false }
    case 'ready':
      return { label: `Restart to update to ${state.version}`, click: () => updates.install() }
    default:
      return { label: 'Check for updates', click: () => updates.check() }
  }
}

export function createTray(win: BrowserWindow, updates: Updates) {
  // Shown for a moment at startup, until the app draws your own buddy for the tray.
  const iconPath = path.join(process.env.VITE_PUBLIC ?? path.join(__dirname, '../public'), 'tray-icon.png')
  const tray = new Tray(nativeImage.createFromPath(iconPath))

  const menu = () =>
    Menu.buildFromTemplate([
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
      {
        label: "What's new",
        click: () => {
          win.show()
          win.focus()
          win.webContents.send('buddy:whats-new')
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
      updateItem(updates),
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])

  tray.setToolTip('DesktopBuddy')
  tray.setContextMenu(menu())
  updates.onChange(() => {
    if (!tray.isDestroyed()) tray.setContextMenu(menu())
  })
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
