import { useEffect, useState, type CSSProperties } from 'react'

/** How much room a bubble needs above the buddy before it flips underneath instead. */
const BUBBLE_ROOM = 170

/**
 * Where a speech bubble goes: just above the buddy, or underneath when the buddy sits near the top
 * of the screen. Apply `style` to an element with the `bubble-anchor` class.
 */
export function useBubblePlacement(size: number): { style: CSSProperties; tail: 'down' | 'up' } {
  const [below, setBelow] = useState(false)
  useEffect(() => {
    window.buddy?.getScreenSpace().then((space) => {
      if (space) setBelow(window.innerHeight / 2 - size * 0.4 - Math.max(0, space.top) < BUBBLE_ROOM)
    })
  }, [size])

  const reach = size * 0.36 + 10
  return {
    style: below ? { top: `calc(50% + ${reach}px)` } : { bottom: `calc(50% + ${reach}px)` },
    tail: below ? 'up' : 'down',
  }
}
