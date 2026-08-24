import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/cn'
import { appleEase, spring } from '../../lib/motion'

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useTheme()
  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border text-ink transition-colors duration-300',
        'border-black/[0.06] bg-white/60 hover:bg-white',
        'dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.28, ease: appleEase }}
          className="grid place-items-center"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
