import { motion } from 'framer-motion'
import { useRoute } from '../../hooks/useRoute'
import { cn } from '../../lib/cn'
import { spring } from '../../lib/motion'

/**
 * Navbar button for the /now page — same glass pill as the terminal and theme toggles.
 * The mark is a "live" indicator: a ring with a centre dot that pulses on hover / while active.
 */
export function NowToggle({ className }: { className?: string }) {
  const { path, navigate } = useRoute()
  const active = path === '/now'
  return (
    <motion.button
      type="button"
      onClick={() => navigate(active ? '/' : '/now')}
      aria-label={active ? 'Back to home' : 'What I’m doing now'}
      aria-pressed={active}
      title="Now"
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={cn(
        'now-toggle group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border text-ink transition-colors duration-300',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
        active
          ? 'is-active border-transparent bg-ink text-on-ink'
          : 'border-black/[0.06] bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]',
        className,
      )}
    >
      <motion.svg
        variants={{ rest: { scale: 1 }, hover: { scale: 1.08 } }}
        transition={spring}
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        aria-hidden
      >
        {/* outer ring */}
        <circle cx="12" cy="12" r="8.25" />
        {/* pulse ring — expands and fades on hover / active */}
        <circle className="now-toggle-pulse" cx="12" cy="12" r="4.5" strokeWidth="1.2" />
        {/* centre dot */}
        <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      </motion.svg>
    </motion.button>
  )
}
