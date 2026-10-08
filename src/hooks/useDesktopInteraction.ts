import { useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'

/** Movement under this many px is still a click; past it the press becomes a drag. */
const DRAG_THRESHOLD = 4

/** Anything inside a `data-hit` element is solid; everything else lets clicks through to the desktop. */
const isHit = (target: EventTarget | null) => target instanceof Element && target.closest('[data-hit]') !== null

interface Options {
  /** A left-click that didn't turn into a drag. */
  onClick: () => void
  onMenu: () => void
}

/**
 * Desktop-pet mouse handling. Empty parts of the window are click-through,
 * while the buddy can be clicked, dragged around the screen and right-clicked.
 * Spread the returned handlers onto the element that wraps the buddy.
 */
export function useDesktopInteraction({ onClick, onMenu }: Options) {
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(null)

  useEffect(() => {
    const bridge = window.buddy
    if (!bridge) return

    // The main process starts the window click-through.
    let through = true
    // While a button is held (dragging the buddy or a slider) the cursor can slip off
    // the solid area for a moment, and dropping the click then would break the drag.
    let held = false

    const update = (x: number, y: number) => {
      if (held) return
      const next = !isHit(document.elementFromPoint(x, y))
      if (next === through) return
      through = next
      bridge.setClickThrough(through)
    }

    const onMove = (e: globalThis.MouseEvent) => {
      if (e.buttons === 0) held = false
      update(e.clientX, e.clientY)
    }
    const onDown = () => {
      held = true
    }
    const onUp = () => {
      held = false
    }

    // Forwarded mouse moves give instant updates; the cursor feed covers the cursor leaving the window.
    window.addEventListener('mousemove', onMove)
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
    const offCursor = bridge.onCursor((p) => update(p.x, p.y))

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
      offCursor()
    }
  }, [])

  const endDrag = () => {
    delete document.documentElement.dataset.dragging
    window.buddy?.dragEnd()
  }

  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (e.button !== 0 || !isHit(e.target)) return
      e.currentTarget.setPointerCapture(e.pointerId)
      press.current = { x: e.screenX, y: e.screenY, dragging: false }
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const p = press.current
      if (!p || p.dragging) return
      if (Math.hypot(e.screenX - p.x, e.screenY - p.y) < DRAG_THRESHOLD) return
      p.dragging = true
      document.documentElement.dataset.dragging = ''
      window.buddy?.dragStart()
    },
    onPointerUp() {
      const p = press.current
      press.current = null
      if (!p) return
      if (p.dragging) endDrag()
      else onClick()
    },
    onLostPointerCapture() {
      // Capture can vanish without a pointerup, for example when another window steals focus.
      if (press.current?.dragging) endDrag()
      press.current = null
    },
    onContextMenu(e: MouseEvent<HTMLElement>) {
      e.preventDefault()
      if (isHit(e.target)) onMenu()
    },
  }
}
