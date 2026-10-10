import { toHex } from './blob/color'
import { restingEyePaths } from './blob/eyes'
import type { BuddyLook } from './blob/generate'

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
        {restingEyePaths(look).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}
