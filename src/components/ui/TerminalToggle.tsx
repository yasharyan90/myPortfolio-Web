import { motion } from 'framer-motion'
import { useTerminal } from '../../hooks/useTerminal'
import { cn } from '../../lib/cn'
import { spring } from '../../lib/motion'

/**
 * Navbar button that opens the terminal — same glass pill as ThemeToggle so the pair reads as one control group.
 * The mark is a simplified macOS Terminal window: rounded frame, prompt chevron, cursor that blinks on hover.
 */
export function TerminalToggle({ className }: { className?: string }) {
  const { isOpen, toggle } = useTerminal()
  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? 'Close terminal' : 'Open terminal'}
      aria-pressed={isOpen}
      title="Terminal (⌘K)"
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={cn(
        'term-toggle group relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border text-ink transition-colors duration-300',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
        isOpen
          ? 'is-open border-transparent bg-ink text-on-ink'
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
        strokeLinejoin="round"
        aria-hidden
      >
        {/* window frame */}
        <rect x="3" y="4.5" width="18" height="15" rx="4.5" />
        {/* prompt chevron — nudges right on hover, like a cursor advancing */}
        <motion.path
          d="M7.5 9.75l3 2.25-3 2.25"
          variants={{ rest: { x: 0 }, hover: { x: 0.75 } }}
          transition={spring}
        />
        {/* cursor underscore — blinks on hover */}
        <line className="term-toggle-cursor" x1="12.25" y1="15.5" x2="16.5" y2="15.5" strokeWidth="1.6" />
      </motion.svg>
    </motion.button>
  )
}
