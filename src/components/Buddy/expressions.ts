import type { BuddyState } from './BuddyStates'

/**
 * How one eye departs from its resting shape. Values are mirrored per side,
 * so `tilt` and `inward` mean the same thing on both eyes.
 */
export interface EyePose {
  /** Width and height multipliers. */
  sx: number
  sy: number
  /** 0 is straight, 1 bends the eye into a closed, upturned arc. */
  bend: number
  /** Degrees. Positive drops the inner ends, as in a frown. */
  tilt: number
  /** Shift toward the middle of the face, in eye heights. */
  inward: number
  /** Shift upward, in eye heights. */
  lift: number
  /** 0–1, how much of the eye's own resting lean is cancelled. */
  lock: number
}

/**
 * A pose only moves parts the buddy already has (eye shape, tilt and offset,
 * a body shift, a tremor and a tint) and never adds a mark.
 */
export interface Pose {
  left: EyePose
  right: EyePose
  /** Whole-face glance, in eye heights. */
  lookX: number
  lookY: number
  /** Body shift in viewBox units. Positive sinks. */
  bodyY: number
  /** Positive is wider and shorter, anchored at the ground. */
  squash: number
  /** Tremor amplitude. */
  shake: number
  /** 0–1 toward `tintHue`. */
  tint: number
  tintHue: number
  /** How much the eyes follow the cursor. */
  gaze: number
}

export interface Expression {
  pose: Pose
  /** Multiplier on idle loop durations: above 1 is slower. */
  rate: number
  blink: boolean
}

const EYE: EyePose = { sx: 1, sy: 1, bend: 0, tilt: 0, inward: 0, lift: 0, lock: 0 }

const REST: Pose = {
  left: EYE,
  right: EYE,
  lookX: 0,
  lookY: 0,
  bodyY: 0,
  squash: 0,
  shake: 0,
  tint: 0,
  tintHue: 28,
  gaze: 1,
}

function pose(eye: Partial<EyePose>, rest: Partial<Omit<Pose, 'left' | 'right'>> = {}): Pose {
  const e = { ...EYE, ...eye }
  return { ...REST, ...rest, left: e, right: e }
}

export const EXPRESSIONS: Record<BuddyState, Expression> = {
  idle: { pose: REST, rate: 1, blink: true },

  // Closed, upturned arcs and a small hop. No other pose uses this shape.
  happy: {
    pose: pose({ sx: 2.1, sy: 0.42, bend: 1, lift: 0.2, lock: 1 }, { bodyY: -1.6, squash: -0.03, gaze: 0.3 }),
    rate: 0.75,
    blink: false,
  },

  // Level lids, low, over a sunk and spread body.
  sleepy: {
    pose: pose({ sx: 1.6, sy: 0.16, lift: -0.3, lock: 1 }, { bodyY: 1.8, squash: 0.06, gaze: 0.05 }),
    rate: 1.9,
    blink: false,
  },

  // Small, drawn together and shivering.
  stressed: {
    pose: pose({ sx: 0.72, sy: 0.6, inward: 0.45, lift: 0.12, lock: 1 }, { shake: 1, squash: -0.02, gaze: 0.5 }),
    rate: 0.55,
    blink: true,
  },

  // Wide flat bars in a \ /, warm-tinted and trembling.
  angry: {
    pose: pose({ sx: 2, sy: 0.4, tilt: 20, inward: 0.15, lock: 1 }, { shake: 0.55, tint: 0.65, squash: 0.03, gaze: 0.6 }),
    rate: 0.7,
    blink: false,
  },

  // Half-lidded and looking off to one side.
  bored: {
    pose: pose({ sx: 1.35, sy: 0.45, lift: -0.12, lock: 1 }, { lookX: 0.6, lookY: 0.2, gaze: 0.15 }),
    rate: 1.4,
    blink: true,
  },
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t

function lerpEye(a: EyePose, b: EyePose, t: number): EyePose {
  return {
    sx: mix(a.sx, b.sx, t),
    sy: mix(a.sy, b.sy, t),
    bend: mix(a.bend, b.bend, t),
    tilt: mix(a.tilt, b.tilt, t),
    inward: mix(a.inward, b.inward, t),
    lift: mix(a.lift, b.lift, t),
    lock: mix(a.lock, b.lock, t),
  }
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    left: lerpEye(a.left, b.left, t),
    right: lerpEye(a.right, b.right, t),
    lookX: mix(a.lookX, b.lookX, t),
    lookY: mix(a.lookY, b.lookY, t),
    bodyY: mix(a.bodyY, b.bodyY, t),
    squash: mix(a.squash, b.squash, t),
    shake: mix(a.shake, b.shake, t),
    tint: mix(a.tint, b.tint, t),
    tintHue: mix(a.tintHue, b.tintHue, t),
    gaze: mix(a.gaze, b.gaze, t),
  }
}
