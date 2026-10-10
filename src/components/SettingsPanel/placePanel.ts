import type { ScreenSpace } from '../../stores/buddyStore'

/** Space between the buddy and a panel, and between a panel and the screen edge. */
const GAP = 18
const MARGIN = 10
/** Panels never get shorter than this, even on a cramped screen. */
const MIN_HEIGHT = 200

export type Side = 'left' | 'right'

/**
 * Puts a panel of the given width beside the buddy, on whichever side has room (unless told), as
 * tall as `maxHeight` allows and kept inside the screen. Used by the customise panel and what's new.
 */
export function placePanel(size: number, space: ScreenSpace | null, width: number, maxHeight: number, forceSide?: Side) {
  const w = window.innerWidth
  const h = window.innerHeight
  const cx = w / 2
  const cy = h / 2
  // Decorations like petals reach about 0.4 of the buddy's box from its centre.
  const reach = size * 0.4
  const left = Math.max(0, space?.left ?? 0) + MARGIN
  const right = Math.min(w, space?.right ?? w) - MARGIN
  const top = Math.max(0, space?.top ?? 0) + MARGIN
  const bottom = Math.min(h, space?.bottom ?? h) - MARGIN

  const rightX = cx + reach + GAP
  const leftX = cx - reach - GAP - width
  const fitsRight = rightX + width <= right
  const fitsLeft = leftX >= left
  const side: Side = forceSide ?? (fitsRight || (!fitsLeft && right - rightX >= leftX + width - left) ? 'right' : 'left')

  const height = Math.max(MIN_HEIGHT, Math.min(maxHeight, bottom - top))
  const y = Math.min(Math.max(cy - height / 2, top), bottom - height)
  return { side, x: side === 'right' ? rightX : leftX, y, height }
}
