import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowDown, ChevronDown, FileText, MapPin, RotateCcw, Terminal as TerminalIcon } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { profile } from '../../data/profile'
import { socials } from '../../data/socials'
import { Link, useRoute } from '../../hooks/useRoute'
import { useTerminal } from '../../hooks/useTerminal'
import { cn } from '../../lib/cn'
import { appleEase, fadeUp, spring, stagger } from '../../lib/motion'
import { showProject, showSkill } from '../../lib/skillUsage'
import { CountUp } from '../ui/CountUp'
import { GitHubContributions } from '../ui/GitHubContributions'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SocialButton } from '../ui/SocialButton'
import { Tooltip } from '../ui/Tooltip'

/** Floating chips around the portrait — each opens its skill in the Skills section. */
const floatingChips = [
  { text: 'Go · Fiber', skill: 'Go (Fiber)', x: '-8%', y: '22%', delay: 0 },
  { text: 'React 19', skill: 'React.js', x: '78%', y: '6%', delay: 0.6 },
  { text: 'PostgreSQL', skill: 'PostgreSQL', x: '-12%', y: '68%', delay: 1.2 },
  { text: 'Redis Pub/Sub', skill: 'Redis Pub/Sub', x: '72%', y: '80%', delay: 1.8 },
]

/** Lines the subtitle cycles through — all lifted from the profile data. */
const ROLES = [
  profile.role,
  profile.facts.find((f) => f.label === 'Focus')?.value ?? '',
  profile.facts.find((f) => f.label === 'Studying')?.value ?? '',
].filter(Boolean)

/** Where each stat tile leads when clicked, matched on its label. */
function statTarget(label: string): { href?: string; project?: string; hint: string } {
  if (/DSA/i.test(label)) return { href: '/#coding', hint: 'See the live profiles' }
  if (/CGPA/i.test(label)) return { href: '/#education', hint: 'Open the timeline' }
  if (/VIT Live/i.test(label)) return { project: 'vit-live', hint: 'Jump to the project' }
  return { href: '/#projects', hint: 'Browse the projects' }
}

function RotatingRole() {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (reduce || paused || ROLES.length < 2) return
    const id = window.setInterval(() => setI((v) => (v + 1) % ROLES.length), 3200)
    return () => window.clearInterval(id)
  }, [reduce, paused])
  return (
    <span
      className="relative mt-1 grid text-ink-48"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="off"
    >
      {/* invisible sizers: every variant occupies the same grid cell, so the slot is as tall as the longest one */}
      {ROLES.map((r) => (
        <span key={r} className="invisible col-start-1 row-start-1 block" aria-hidden>
          {r}.
        </span>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ROLES[i]}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: appleEase }}
          className="col-start-1 row-start-1 block self-start"
        >
          {ROLES[i]}.
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function Hero() {
  const frameRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { open: openTerminal } = useTerminal()
  const { navigate } = useRoute()
  const [flipped, setFlipped] = useState(false)

  // portrait tilt toward the cursor
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 140, damping: 18 })
  const sry = useSpring(ry, { stiffness: 140, damping: 18 })
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !frameRef.current) return
    const r = frameRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 16)
    rx.set(-py * 16)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
  }

  // the copy drifts and fades a little as the reader scrolls away; the scroll cue disappears first
  const { scrollY } = useScroll()
  const driftY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : 60])
  const driftOpacity = useTransform(scrollY, [0, 520], [1, 0.3])
  const cueOpacity = useTransform(scrollY, [0, 140], [1, 0])

  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28 pb-12 md:pt-32">
      <motion.div style={{ y: driftY, opacity: driftOpacity }} className="container-apple grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr] md:gap-10">
        {/* copy */}
        <motion.div variants={stagger(0.1, 0.3)} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="inline-flex">
            <Link href="/#contact" className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] tracking-[-0.2px] text-ink-80 transition-colors hover:text-ink">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {profile.availability}
            </Link>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px] md:text-[64px] lg:text-[72px]"
          >
            {profile.name}.
            <RotatingRole />
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-[560px] text-[19px] font-light leading-[1.45] text-ink-80 sm:text-[21px]">
            {profile.tagline}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <GlassButton href="#projects" iconRight={<ArrowDown className="h-4 w-4" />}>
              View projects
            </GlassButton>
            <GlassButton onClick={() => navigate(profile.resume)} variant="glass" icon={<FileText className="h-4 w-4" />}>
              View résumé
            </GlassButton>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-2">
            {socials.slice(0, 5).map((s) => (
              <SocialButton key={s.id} social={s} variant="pill" />
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] tracking-[-0.224px] text-ink-48">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {profile.location}
            </span>
            <button
              type="button"
              onClick={openTerminal}
              className="group inline-flex items-center gap-2 rounded-full transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
            >
              <TerminalIcon className="h-3.5 w-3.5" />
              Prefer a terminal?
              <kbd className="rounded-[5px] border border-black/10 bg-white/60 px-1.5 py-0.5 font-mono text-[11px] text-ink-80 transition-colors group-hover:border-primary/40 dark:border-white/15 dark:bg-white/10 dark:text-white/80">
                ⌘K
              </kbd>
            </button>
          </motion.div>
        </motion.div>

        {/* portrait — tilts toward the cursor, flips on click to quick facts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: appleEase, delay: 0.5 }}
          className="relative mx-auto w-full max-w-[420px] [perspective:1200px]"
          onMouseMove={onMove}
          onMouseLeave={reset}
        >
          <motion.div ref={frameRef} style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }} className="relative">
            <motion.button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              aria-pressed={flipped}
              aria-label={flipped ? 'Show portrait' : 'Show quick facts'}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.7, ease: appleEase }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-focus rounded-[32px]"
            >
              {/* front */}
              <div className="[backface-visibility:hidden]">
                <GlassPanel className="rounded-[32px] p-3">
                  <div className="relative overflow-hidden rounded-[24px]">
                    <img
                      src={profile.avatar}
                      alt={`${profile.name} portrait`}
                      className="aspect-square w-full object-cover"
                      style={{ boxShadow: '3px 5px 30px 0 rgba(0,0,0,0.22)' }}
                      loading="eager"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <p className="font-display text-[21px] font-semibold leading-tight">{profile.name}</p>
                        <p className="text-[13px] text-white/80">VIT Bhopal · Class of 2028</p>
                      </div>
                      <span className="glass-dark rounded-full px-2.5 py-1 text-[12px]">CGPA 8.5</span>
                    </div>
                    <span className="glass-dark absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] text-white/85">
                      <RotateCcw className="h-3 w-3" /> Tap to flip
                    </span>
                  </div>
                </GlassPanel>
              </div>
              {/* back */}
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!flipped}>
                <GlassPanel className="flex h-full flex-col rounded-[32px] p-7">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">Quick facts</p>
                  <ul className="mt-4 flex-1 divide-y divide-black/[0.06] dark:divide-white/10">
                    {profile.facts.map((f) => (
                      <li key={f.label} className="py-3 first:pt-0">
                        <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-48">{f.label}</p>
                        <p className="mt-0.5 text-[16px] leading-snug text-ink">{f.value}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink-48">
                    <RotateCcw className="h-3 w-3" /> Tap to flip back
                  </p>
                </GlassPanel>
              </div>
            </motion.button>

            {floatingChips.map((c) => (
              <motion.span
                key={c.text}
                className={cn('absolute hidden sm:block', flipped && 'pointer-events-none')}
                style={{ left: c.x, top: c.y, z: 60 }}
                animate={{ opacity: flipped ? 0 : 1, ...(reduce ? {} : { y: [0, -10, 0] }) }}
                transition={{ opacity: { duration: 0.3 }, y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: c.delay } }}
              >
                <Tooltip label="Open in Skills">
                  <motion.button
                    type="button"
                    onClick={() => showSkill(c.skill)}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={spring}
                    className="glass rounded-full px-3 py-1.5 text-[13px] font-semibold tracking-[-0.2px] text-ink-80 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
                  >
                    {c.text}
                  </motion.button>
                </Tooltip>
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* live GitHub heatmap — sits under the location line, above About */}
      <motion.div
        id="contributions"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: appleEase, delay: 0.9 }}
        className="container-apple mt-12 scroll-mt-28 md:mt-14"
      >
        <GitHubContributions />
      </motion.div>

      {/* stats — each tile leads to where the number comes from */}
      <motion.div variants={stagger(0.1, 1)} initial="hidden" animate="show" className="container-apple mt-6 hidden lg:block">
        <GlassPanel spotlight={false} className="rounded-[18px]">
          <div className="grid grid-cols-4 divide-x divide-black/[0.06] dark:divide-white/10">
          {profile.stats.map((s) => {
            const t = statTarget(s.label)
            const inner = (
              <>
                <p className="font-display text-[28px] font-semibold leading-none tracking-[-0.01em] text-ink">
                  <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </p>
                <p className="mt-1.5 text-[13px] tracking-[-0.2px] text-ink-48">{s.label}</p>
                <span className="pointer-events-none absolute right-4 top-3 text-[11.5px] text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {t.hint} →
                </span>
              </>
            )
            const cls = cn(
              'group relative block w-full px-6 py-4 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
              'first:rounded-l-[18px] last:rounded-r-[18px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-focus',
            )
            return (
              <motion.div key={s.label} variants={fadeUp}>
                {t.project ? (
                  <button type="button" onClick={() => showProject(t.project!)} className={cls}>
                    {inner}
                  </button>
                ) : (
                  <Link href={t.href!} className={cls}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            )
          })}
          </div>
        </GlassPanel>
      </motion.div>

      {/* scroll cue */}
      <motion.a
        href="#about"
        style={{ opacity: cueOpacity }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-ink-48 transition-colors hover:text-ink md:flex"
        aria-label="Scroll to About"
      >
        Scroll
        <motion.span animate={reduce ? undefined : { y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.a>
    </section>
  )
}
