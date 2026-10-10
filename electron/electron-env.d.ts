/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  /** Missing when the renderer runs in a plain browser, such as the face gallery. */
  buddy?: {
    /** Cursor position relative to the window's content area, even when it is outside the window. */
    onCursor(callback: (point: { x: number; y: number }) => void): () => void
    onNewFace(callback: () => void): () => void
    onOpenPanel(callback: () => void): () => void
    /** Fires once per drag when the buddy is shaken back and forth. */
    onShaken(callback: () => void): () => void
    /** How fast the buddy is being carried, in px per second; zero once it's let go. */
    onCarried(callback: (speed: { vx: number; vy: number }) => void): () => void
    onReplayIntro(callback: () => void): () => void
    /** While true, clicks fall through the window to whatever is behind it. */
    setClickThrough(through: boolean): void
    /** The main process moves the window with the cursor between these two calls. */
    dragStart(): void
    dragEnd(): void
    setAlwaysOnTop(onTop: boolean): void
    getScreenSpace(): Promise<import('../src/stores/buddyStore').ScreenSpace>
    /** Your buddy drawn at 16px and 32px as PNG data URLs, plus the tray tooltip. */
    setTrayIcon(icon: { x1: string; x2: string; tooltip: string }): void
  }
}
