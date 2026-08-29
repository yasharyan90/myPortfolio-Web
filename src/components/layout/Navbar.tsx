import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion' // framer
import { Download, Menu, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { profile } from '../../data/profile'
import { useActiveSection } from '../../hooks/useActiveSection'
import { Link, useRoute } from '../../hooks/useRoute'
import { cn } from '../../lib/cn'
import { appleEase, spring } from '../../lib/motion'
import { GlassButton } from '../ui/GlassButton'
import { NowToggle } from '../ui/NowToggle'
import { TerminalToggle } from '../ui/TerminalToggle'
import { ThemeToggle } from '../ui/ThemeToggle'

export const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'coding', label: 'Coding' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

export function Navbar() {
  const ids = useMemo(() => ['hero', ...NAV_LINKS.map((l) => l.id)], [])
  const { path } = useRoute()
  const sectionActive = useActiveSection(ids)
  const active = path === '/' ? sectionActive : ''
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24))

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: appleEase, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <motion.nav
        layout
        transition={spring}
        className={cn(
          'glass flex w-full max-w-[1120px] items-center justify-between rounded-full pl-5 pr-2 transition-[height] duration-300',
          scrolled ? 'h-[52px]' : 'h-[60px]',
        )}
      >
        <Link href="/" className="flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-[-0.374px] text-ink">
          <img
            src={profile.avatarSmall}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-[8px] object-cover ring-1 ring-black/10 dark:ring-white/15"
          />
          <span className="hidden sm:inline">{profile.name}</span>
        </Link>

        <ul className="relative hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const isActive = active === l.id
            return (
              <li key={l.id} className="relative">
                <Link
                  href={`/#${l.id}`}
                  className={cn(
                    'relative z-10 block rounded-full px-3.5 py-2 text-[13px] tracking-[-0.12px] transition-colors duration-300',
                    isActive ? 'text-on-ink' : 'text-ink-80 hover:text-ink',
                  )}
                >
                  {l.label}
                </Link>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={spring}
                    className="absolute inset-0 z-0 rounded-full bg-ink"
                  />
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <NowToggle />
          <TerminalToggle />
          <ThemeToggle />
          <div className="hidden sm:block">
            <GlassButton href={profile.resume} size="sm" download icon={<Download className="h-3.5 w-3.5" />} magnetic={false}>
              Résumé
            </GlassButton>
          </div>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: appleEase }}
            className="glass absolute left-4 right-4 top-[84px] rounded-[18px] p-2 md:hidden"
          >
            {NAV_LINKS.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, ease: appleEase }}
              >
                <Link
                  href={`/#${l.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-[11px] px-4 py-3 text-[17px] tracking-[-0.374px]',
                    active === l.id ? 'bg-ink text-on-ink' : 'text-ink hover:bg-white/60 dark:hover:bg-white/10',
                  )}
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            <Link
              href="/now"
              onClick={() => setOpen(false)}
              className={cn(
                'block rounded-[11px] px-4 py-3 text-[17px] tracking-[-0.374px]',
                path === '/now' ? 'bg-ink text-on-ink' : 'text-ink hover:bg-white/60 dark:hover:bg-white/10',
              )}
            >
              Now
            </Link>
            <a
              href={profile.resume}
              download
              className="mt-1 flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-3 text-[17px] text-white"
            >
              <Download className="h-4 w-4" /> Download résumé
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
