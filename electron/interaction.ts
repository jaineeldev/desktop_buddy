import { BrowserWindow, ipcMain, screen, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'

const DRAG_MS = 1000 / 60

let drag: { win: BrowserWindow; timer: ReturnType<typeof setInterval> } | null = null

const windowOf = (event: IpcMainEvent | IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender)

function stopDrag() {
  if (!drag) return
  clearInterval(drag.timer)
  drag = null
}

/**
 * Window controls the renderer drives: click-through on empty space, dragging
 * by the buddy's body, always-on-top, and where the screen edges are.
 * Registered once; each message acts on the window that sent it.
 */
export function registerWindowControls() {
  ipcMain.on('window:click-through', (event, through: boolean) => {
    // `forward` keeps mouse moves coming while clicks pass through, so the renderer can tell when the cursor reaches the buddy again.
    windowOf(event)?.setIgnoreMouseEvents(through, { forward: true })
  })

  ipcMain.on('window:drag-start', (event) => {
    const win = windowOf(event)
    if (!win) return
    stopDrag()
    const start = screen.getCursorScreenPoint()
    const bounds = win.getBounds()
    const grab = { x: start.x - bounds.x, y: start.y - bounds.y }
    const timer = setInterval(() => {
      if (win.isDestroyed()) return stopDrag()
      const cursor = screen.getCursorScreenPoint()
      // setBounds with a fixed size: setPosition alone can grow the window on scaled Windows displays.
      win.setBounds({ x: cursor.x - grab.x, y: cursor.y - grab.y, width: bounds.width, height: bounds.height })
    }, DRAG_MS)
    drag = { win, timer }
  })

  ipcMain.on('window:drag-end', stopDrag)

  ipcMain.on('window:always-on-top', (event, onTop: boolean) => {
    windowOf(event)?.setAlwaysOnTop(onTop)
  })

  ipcMain.handle('window:screen-space', (event) => {
    const win = windowOf(event)
    if (!win) return null
    const content = win.getContentBounds()
    const { workArea } = screen.getDisplayNearestPoint({
      x: content.x + content.width / 2,
      y: content.y + content.height / 2,
    })
    return {
      left: workArea.x - content.x,
      top: workArea.y - content.y,
      right: workArea.x + workArea.width - content.x,
      bottom: workArea.y + workArea.height - content.y,
    }
  })
}
