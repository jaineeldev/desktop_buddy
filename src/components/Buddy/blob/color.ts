/** An OKLab colour. Mixing in OKLab keeps tints clean where sRGB mixing goes muddy. */
export type Lab = readonly [number, number, number]

function labToLinear([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const inGamut = (rgb: number[]) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4)
const clamp01 = (c: number) => Math.min(1, Math.max(0, c))

/** OKLCH to OKLab, pulling chroma in until the colour fits inside sRGB. */
export function oklch(l: number, c: number, hueDeg: number): Lab {
  const h = (hueDeg * Math.PI) / 180
  const at = (chroma: number): Lab => [l, chroma * Math.cos(h), chroma * Math.sin(h)]
  if (inGamut(labToLinear(at(c)))) return at(c)
  let lo = 0
  let hi = c
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(labToLinear(at(mid)))) lo = mid
    else hi = mid
  }
  return at(lo)
}

export function mixLab(a: Lab, b: Lab, t: number): Lab {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function toByte(linear: number): string {
  const c = clamp01(linear)
  const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.round(encoded * 255).toString(16).padStart(2, '0')
}

export function toHex(lab: Lab): string {
  return `#${labToLinear(lab).map(toByte).join('')}`
}

function luminance(lab: Lab): number {
  const [r, g, b] = labToLinear(lab).map(clamp01)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a: Lab, b: Lab): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
