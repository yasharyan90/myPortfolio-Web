import { motion } from 'framer-motion'
import { Terminal as TerminalIcon } from 'lucide-react'
import { useTerminal } from '../../hooks/useTerminal'
import { cn } from '../../lib/cn'
import { spring } from '../../lib/motion'

/** Navbar button that opens the terminal — same glass pill as ThemeToggle so the pair reads as one control group. */
export function TerminalToggle({ className }: { className?: string }) {
  const { isOpen, toggle } = useTerminal()
  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? 'Close terminal' : 'Open terminal'}
      aria-pressed={isOpen}
      title="Terminal (⌘K)"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border text-ink transition-colors duration-300',
        'border-black/[0.06] bg-white/60 hover:bg-white',
        'dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
        isOpen && 'bg-ink text-on-ink hover:bg-ink dark:bg-ink dark:hover:bg-ink',
        className,
      )}
    >
      <TerminalIcon className="h-4 w-4" />
    </motion.button>
  )
}
