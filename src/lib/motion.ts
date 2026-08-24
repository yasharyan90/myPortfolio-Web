import type { Transition, Variants } from 'framer-motion'

/** Apple-style deceleration curve */
export const appleEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export const spring: Transition = { type: 'spring', stiffness: 260, damping: 24, mass: 0.7 }
export const softSpring: Transition = { type: 'spring', stiffness: 140, damping: 20, mass: 0.6 }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: appleEase } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: appleEase } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: appleEase } },
}

export const stagger = (staggerChildren = 0.08, delayChildren = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

export const viewport = { once: true, amount: 0.2 } as const
