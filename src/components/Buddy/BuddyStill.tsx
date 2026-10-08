import { toHex } from './blob/color'
import type { BuddyLook } from './blob/generate'
import { eyePath } from './blob/geometry'

/** A resting buddy with no motion, for previews where dozens may be on screen at once. */
export function BuddyStill({ look, size }: { look: BuddyLook; size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g fill={toHex(look.body)}>
        {look.parts.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={toHex(look.eye)}>
        {look.eyes.map((e, i) => (
          <path key={i} d={eyePath(e.cx, e.cy, e.hw, e.hh, e.n, e.flat, 0, e.lean)} />
        ))}
      </g>
    </svg>
  )
}
