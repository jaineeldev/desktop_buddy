import { BrowserWindow, screen } from 'electron'

const POLL_MS = 1000 / 30

/**
 * The renderer only sees pointer events over its own window, so the main
 * process polls the cursor and sends its position relative to the window's
 * content area. Coordinates go negative or past the window size when the
 * cursor is elsewhere on the desktop, which is what lets the eyes follow it.
 */
export function startCursorFeed(win: BrowserWindow) {
  let last = ''
  const timer = setInterval(() => {
    if (win.isDestroyed() || !win.isVisible()) return
    const cursor = screen.getCursorScreenPoint()
    const bounds = win.getContentBounds()
    const point = { x: cursor.x - bounds.x, y: cursor.y - bounds.y }
    const key = `${point.x},${point.y}`
    if (key === last) return
    last = key
    win.webContents.send('cursor:move', point)
  }, POLL_MS)

  win.on('closed', () => clearInterval(timer))
}
