import type { BuddyLook, EyeSpec } from './generate'
import { eyePath, heartPoint, smoothClosedPath, type Pt } from './geometry'

/** The bits of an eye pose the visor reads. Matches EyePose in expressions.ts. */
interface VisorEyePose {
  sx: number
  sy: number
  bend: number
  heart: number
  tilt: number
  lift: number
}

/** Points along each half of the visor's top and bottom edges. */
const VISOR_SAMPLES = 12
/** How far a visor can stretch past its resting length when a mood widens the eyes. */
const VISOR_MAX_STRETCH = 1.15
const NEUTRAL: VisorEyePose = { sx: 1, sy: 1, bend: 0, heart: 0, tilt: 0, lift: 0 }

/**
 * A visor is one continuous bar across the face. The generator stores it as two
 * eye specs (its left and right halves); this draws them as a single shape that
 * bends at the middle instead of splitting: an arc when happy, a V when angry,
 * a kink for a wink, one heart when in love. Always the same number of points,
 * so poses morph smoothly.
 */
export function visorPath(
  left: EyeSpec,
  right: EyeSpec,
  pl: VisorEyePose = NEUTRAL,
  pr: VisorEyePose = NEUTRAL,
  look: { lookX: number; lookY: number } = { lookX: 0, lookY: 0 },
  thickness = 1,
): string {
  const mid = (left.cx + right.cx) / 2
  const reach = right.cx + right.hw - mid
  const hh = left.hh * thickness
  const n = left.n
  const liftAvg = (pl.lift + pr.lift) / 2
  // The joint in the middle carries the shared lift and glance; each half hangs off it.
  const jx = mid + look.lookX * left.hh
  const jy = left.cy + (-liftAvg + look.lookY) * left.hh

  const half = (p: VisorEyePose) => {
    const a = reach * Math.min(Math.max(p.sx, 0.35), VISOR_MAX_STRETCH)
    return {
      a,
      h: Math.max(hh * p.sy, 0.35),
      // Positive tilt raises the outer end, so angry reads as a V and sad as an upside-down one.
      rise: Math.tan((p.tilt * Math.PI) / 180),
      // A lopsided lift (one eye higher, as in curious) kinks the line rather than breaking it.
      kink: (p.lift - liftAvg) * left.hh,
      arc: p.bend * 0.35 * a,
    }
  }
  const sides = { left: half(pl), right: half(pr) }
  // Where the halves meet, both use the average arc and thickness, so the line stays joined.
  const arcAtJoint = (sides.left.arc + sides.right.arc) / 2
  const hAtJoint = (sides.left.h + sides.right.h) / 2

  const at = (x: number) => {
    const s = x < 0 ? sides.left : sides.right
    const u = Math.min(1, Math.abs(x) / s.a)
    const blend = (1 - u) * (1 - u)
    const arc = s.arc * (1 - u * u) + (arcAtJoint - s.arc) * blend
    const y = jy - Math.abs(x) * s.rise - s.kink * u - arc
    const body = s.h + (hAtJoint - s.h) * blend
    // A superellipse profile rounds each end off to a point of zero thickness.
    const h = body * Math.pow(Math.max(0, 1 - Math.pow(u, n)), 1 / n)
    return { y, h }
  }

  const edge = (x: number, dir: 1 | -1): Pt => {
    const { y, h } = at(x)
    const e = 0.01
    const dy = at(x + e).y - at(x - e).y
    const len = Math.hypot(2 * e, dy) || 1
    // Normal to the centre line, pointing up for the top edge and down for the bottom.
    const nx = (dy / len) * dir
    const ny = (-2 * e / len) * dir
    return [jx + x + nx * h, y + ny * h]
  }

  // Out along the top from the left tip to the right tip, then back along the bottom.
  const us = Array.from({ length: VISOR_SAMPLES - 1 }, (_, i) => Math.sin(((i + 1) / VISOR_SAMPLES) * (Math.PI / 2)))
  const xsLeft = us.map((u) => -u * sides.left.a)
  const xsRight = us.map((u) => u * sides.right.a)
  const tipL: Pt = [jx - sides.left.a, at(-sides.left.a).y]
  const tipR: Pt = [jx + sides.right.a, at(sides.right.a).y]
  const pts: Pt[] = [
    tipL,
    ...[...xsLeft].reverse().map((x) => edge(x, 1)),
    edge(0, 1),
    ...xsRight.map((x) => edge(x, 1)),
    tipR,
    ...[...xsRight].reverse().map((x) => edge(x, -1)),
    edge(0, -1),
    ...xsLeft.map((x) => edge(x, -1)),
  ]

  // In love, the whole visor becomes one heart.
  const heart = (pl.heart + pr.heart) / 2
  if (heart > 0) {
    const size = Math.max(reach * 0.5, left.hh * 2) * thickness ** 0.5
    pts.forEach((p, i) => {
      // Start at the heart's left lobe to line up with the visor's left tip, going the same way round.
      const [hx, hy] = heartPoint(Math.PI + (i / pts.length) * Math.PI * 2)
      pts[i] = [p[0] + (jx + hx * size - p[0]) * heart, p[1] + (jy + hy * size - p[1]) * heart]
    })
  }
  return smoothClosedPath(pts)
}

/** The resting eye outlines for a look: one path for a visor, two otherwise. Bigger `boost` suits tiny sizes. */
export function restingEyePaths(look: BuddyLook, boost = 1): string[] {
  const [l, r] = look.eyes
  if (look.eyeStyle === 'visor') return [visorPath(l, r, undefined, undefined, undefined, boost)]
  return look.eyes.map((e) => eyePath(e.cx, e.cy, e.hw * boost, e.hh * boost, e.n, e.flat, 0, e.lean))
}
