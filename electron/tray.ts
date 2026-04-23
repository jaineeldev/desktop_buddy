import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createTray(win: BrowserWindow) {
  const iconPath = path.join(process.env.VITE_PUBLIC ?? path.join(__dirname, '../public'), 'tray-icon.png')
  const tray = new Tray(nativeImage.createFromPath(iconPath))

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => win.show() },
    { label: 'Hide', click: () => win.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setToolTip('DesktopBuddy')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()))

  return tray
}
