import type { Variants } from 'framer-motion'

export const buddyVariants: Variants = {
  idle: {
    scale: 1,
    y: [0, -4, 0],
    rotate: 0,
    filter: 'hue-rotate(0deg)',
    transition: {
      y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
  },
  happy: {
    scale: [1, 1.25, 1.15],
    y: [0, -12, 0],
    rotate: [0, -6, 6, 0],
    filter: 'hue-rotate(0deg)',
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  sleepy: {
    scale: 0.85,
    y: 6,
    rotate: -8,
    filter: 'brightness(0.8)',
    transition: {
      duration: 1.2,
      ease: 'easeOut',
    },
  },
  stressed: {
    scale: 1.05,
    x: [0, -3, 3, -3, 3, 0],
    rotate: [0, -2, 2, -2, 2, 0],
    filter: 'hue-rotate(0deg)',
    transition: {
      duration: 0.3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  angry: {
    scale: 1.15,
    rotate: [0, -3, 3, 0],
    filter: 'hue-rotate(-40deg) saturate(1.6)',
    transition: {
      duration: 0.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  bored: {
    scale: [1, 0.95, 1],
    opacity: [1, 0.7, 1],
    rotate: 0,
    filter: 'saturate(0.6)',
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}
