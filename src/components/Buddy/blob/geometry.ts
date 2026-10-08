export type Pt = readonly [number, number]

const fmt = (n: number) => String(Math.round(n * 100) / 100)
const xy = ([x, y]: Pt) => `${fmt(x)} ${fmt(y)}`

function place([x, y]: Pt, cx: number, cy: number, rotDeg: number): Pt {
  const r = (rotDeg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return [cx + x * c - y * s, cy + x * s + y * c]
}

/**
 * Control-point offset for one quadrant of |x/a|^n + |y/b|^n = 1, solved so
 * the cubic passes exactly through the 45° point. n = 2 gives 0.5523, the
 * usual circle constant; n ≈ 4 is a squircle.
 */
function superellipseK(n: number): number {
  return (8 * 2 ** (-1 / n) - 4) / 3
}

/** A superellipse as four cubic Béziers. */
export function superellipsePath(cx: number, cy: number, a: number, b: number, n: number, rotDeg = 0): string {
  const k = superellipseK(n)
  const p = (
    [
      [a, 0], [a, k * b], [k * a, b], [0, b],
      [-k * a, b], [-a, k * b], [-a, 0],
      [-a, -k * b], [-k * a, -b], [0, -b],
      [k * a, -b], [a, -k * b], [a, 0],
    ] as const
  ).map((pt) => place(pt, cx, cy, rotDeg))
  let d = `M${xy(p[0])}`
  for (let i = 1; i < p.length; i += 3) d += `C${xy(p[i])} ${xy(p[i + 1])} ${xy(p[i + 2])}`
  return `${d}Z`
}

/** A closed Catmull-Rom spline through every point, written as cubic Béziers. */
export function smoothClosedPath(pts: readonly Pt[]): string {
  const n = pts.length
  let d = `M${xy(pts[0])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${xy(c1)} ${xy(c2)} ${xy(p2)}`
  }
  return `${d}Z`
}

/** A polygon whose corners are replaced by quadratic curves eating `round` (0–0.5) of each edge. */
export function roundedPolygonPath(verts: readonly Pt[], round: number): string {
  const n = verts.length
  const toward = (from: Pt, to: Pt): Pt => [from[0] + (to[0] - from[0]) * round, from[1] + (to[1] - from[1]) * round]
  let d = ''
  for (let i = 0; i < n; i++) {
    const v = verts[i]
    const a = toward(v, verts[(i - 1 + n) % n])
    const b = toward(v, verts[(i + 1) % n])
    d += `${i === 0 ? 'M' : 'L'}${xy(a)}Q${xy(v)} ${xy(b)}`
  }
  return `${d}Z`
}

/** A horizontal pill: half-width `hw`, half-height `hh`. */
export function stadiumPath(cx: number, cy: number, hw: number, hh: number): string {
  const x0 = cx - hw + hh
  const x1 = cx + hw - hh
  const r = fmt(hh)
  return `M${xy([x0, cy - hh])}H${fmt(x1)}A${r} ${r} 0 0 1 ${xy([x1, cy + hh])}H${fmt(x0)}A${r} ${r} 0 0 1 ${xy([x0, cy - hh])}Z`
}

/** A round body drawn up into a point at the top. */
export function dropletPath(cx: number, cy: number, r: number, tip: number): string {
  const k = 0.5523 * r
  const top = cy - r - tip
  return (
    `M${xy([cx, top])}` +
    `C${xy([cx + r * 0.42, top + tip * 0.55])} ${xy([cx + r, cy - r * 0.62])} ${xy([cx + r, cy])}` +
    `C${xy([cx + r, cy + k])} ${xy([cx + k, cy + r])} ${xy([cx, cy + r])}` +
    `C${xy([cx - k, cy + r])} ${xy([cx - r, cy + k])} ${xy([cx - r, cy])}` +
    `C${xy([cx - r, cy - r * 0.62])} ${xy([cx - r * 0.42, top + tip * 0.55])} ${xy([cx, top])}Z`
  )
}

const EYE_SAMPLES = 28

/**
 * An eye outline that can morph smoothly: always the same number of points,
 * so any two eyes interpolate cleanly. `flat` (0–1) squashes the lower half
 * onto the centre line, making a dome. `bend` lifts the middle and leaves the
 * ends, turning a flat bar into a closed, happy arc.
 */
export function eyePath(
  cx: number,
  cy: number,
  a: number,
  b: number,
  n: number,
  flat: number,
  bend: number,
  rotDeg: number,
): string {
  const pts: Pt[] = []
  for (let i = 0; i < EYE_SAMPLES; i++) {
    const t = (i / EYE_SAMPLES) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const x = a * Math.sign(c) * Math.abs(c) ** (2 / n)
    let y = b * Math.sign(s) * Math.abs(s) ** (2 / n)
    if (y > 0) y *= 1 - flat
    y -= bend * a * 0.75 * (1 - (x / a) ** 2)
    pts.push(place([x, y], cx, cy, rotDeg))
  }
  return smoothClosedPath(pts)
}

/**
 * Returns a formatter for hand-drawn outlines: points are given in body radii
 * around the centre and come back as path coordinates.
 */
export function bodyPoints(cx: number, cy: number, sx: number, sy: number) {
  return (x: number, y: number) => xy([cx + x * sx, cy + y * sy])
}
