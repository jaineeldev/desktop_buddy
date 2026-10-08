const SYLLABLES = ['bo', 'mi', 'pu', 'ko', 'ra', 'zu', 'ne', 'ti', 'lo', 'ba', 'fi', 'mo', 'ku', 'pi', 'so', 'ya', 'nu', 'ri', 'go', 'wa']

/** A short, pronounceable name. The name is also what decides the face. */
export function randomBuddyName(random: () => number = Math.random): string {
  const pick = () => SYLLABLES[Math.floor(random() * SYLLABLES.length)]
  return pick() + pick() + (random() < 0.4 ? pick() : '')
}
