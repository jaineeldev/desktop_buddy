/** Names are compared the way people read them: same letters, same buddy. */
export function normalizeName(name: string): string {
  return name.normalize('NFC').trim().toLowerCase()
}

const encoder = new TextEncoder()

/**
 * FNV-1a over UTF-8 bytes, finished with murmur3's mixer so keys that differ
 * by a single character still land far apart.
 */
function hash32(input: string): number {
  let h = 0x811c9dc5
  for (const byte of encoder.encode(input)) {
    h ^= byte
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** Returns a stable value in [0, 1) for a named trait. */
export type TraitFn = (key: string) => number

/**
 * Every trait is hashed from its own key instead of being pulled from one
 * random stream, so adding a trait later never reshuffles existing faces.
 */
export function traitsFor(name: string): TraitFn {
  const seed = normalizeName(name)
  return (key) => hash32(`${seed}\u0000${key}`) / 0x100000000
}
