import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type UIEvent } from 'react'
import { SiGithub } from 'react-icons/si'
import { projects, type Project } from '../../data/projects'
import { appleEase, fadeUp, stagger } from '../../lib/motion'
import { cn } from '../../lib/cn'
import { Background } from '../layout/Background'
import { Chip } from '../ui/Chip'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

const HEADING = {
  eyebrow: 'Projects',
  title: 'Built to run in production.',
  subtitle:
    'Warehouse inventory, collaborative editing, streaming, real-time and e-commerce platforms with live payments — designed, shipped and debugged end to end.',
}

/* ── Shared card pieces ─────────────────────────────────────────────────── */

function Cover({ p, className }: { p: Project; className?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={cn('relative overflow-hidden rounded-[18px]', className)}
      style={{
        background: `radial-gradient(120% 90% at 15% 10%, ${p.accent}cc, transparent 55%), radial-gradient(90% 90% at 90% 90%, ${p.accent}66, transparent 60%), #1a1a1c`,
      }}
    >
      {p.cover ? (
        <>
          <img
            src={p.cover}
            alt={`${p.name} — live product screenshot`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: p.coverPosition ?? 'top' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" />
        </>
      ) : (
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:32px_32px]" />
      )}
      <div className="absolute right-5 top-5 flex items-center gap-2">
        <span className="glass-dark rounded-full px-3 py-1 text-[12px] text-white/90">{p.kind}</span>
      </div>
      {!p.cover && (
        <span className="absolute bottom-4 right-6 select-none font-display text-[88px] font-semibold leading-none tracking-[-0.04em] text-white/90 mix-blend-overlay sm:text-[120px] md:text-[160px]">
          {p.monogram}
        </span>
      )}
      <div className="absolute bottom-6 left-6 flex flex-wrap gap-3">
        {p.metrics.map((m) => (
          <div key={m.label} className="glass-dark rounded-[11px] px-3 py-2">
            <p className="font-display text-[17px] font-semibold leading-none text-white">{m.value}</p>
            <p className="mt-1 text-[11px] text-white/70">{m.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function Links({ p, size = 'md', className }: { p: Project; size?: 'sm' | 'md'; className?: string }) {
  if (p.links.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {p.links.map((l) => (
        <GlassButton
          key={l.href}
          href={l.href}
          external
          size={size}
          variant={l.kind === 'live' ? 'primary' : 'glassDark'}
          icon={l.kind === 'github' ? <SiGithub size={16} /> : <ExternalLink className="h-4 w-4" />}
          iconRight={<ArrowUpRight className="h-4 w-4" />}
        >
          {l.label}
        </GlassButton>
      ))}
    </div>
  )
}

/* ── Full card: cover + body, stacks on small screens (used by /now too) ─── */

export function ProjectCard({ p, index, className }: { p: Project; index: number; className?: string }) {
  const flip = index % 2 === 1
  return (
    <motion.article variants={fadeUp} className={className} data-index={index}>
      <GlassPanel tone="dark" className="rounded-[24px] p-3 md:p-4">
        <div className={cn('grid gap-6 md:grid-cols-[0.9fr_1.1fr]', flip && 'md:[&>*:first-child]:order-2')}>
          <Cover p={p} className="min-h-[240px] md:min-h-full" />
          <div className="flex flex-col p-3 md:p-5">
            <h3 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-white md:text-[32px]">{p.name}</h3>
            <p className="mt-1 text-[17px] text-muted-dark">{p.subtitle}</p>
            <p className="mt-4 text-[17px] leading-[1.5] text-white/85">{p.description}</p>
            <ul className="mt-5 space-y-2.5">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-[15px] leading-[1.45] text-white/75">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} />
                  {h}
                </li>
              ))}
            </ul>
            <motion.div variants={stagger(0.03)} className="mt-6 flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <Chip key={s} tone="dark">
                  {s}
                </Chip>
              ))}
            </motion.div>
            <Links p={p} className="mt-7" />
          </div>
        </div>
      </GlassPanel>
    </motion.article>
  )
}

/* ── Stage card: one viewport tall, three columns; highlights scroll inside ─ */

const MAX_CHIPS = 8

function StageCard({ p, index }: { p: Project; index: number }) {
  const extra = p.stack.length - MAX_CHIPS
  const chips = extra > 1 ? p.stack.slice(0, MAX_CHIPS) : p.stack
  return (
    <motion.article variants={fadeUp} className="h-full" data-index={index}>
      <GlassPanel tone="dark" className="h-full rounded-[24px] p-4">
        <div className="grid h-full min-h-0 gap-5 grid-cols-[minmax(0,34fr)_minmax(0,33fr)_minmax(0,33fr)]">
          <Cover p={p} className="min-h-0" />

          {/* summary */}
          <div className="flex min-h-0 flex-col py-2 pr-1">
            <h3 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.01em] text-white xl:text-[30px]">{p.name}</h3>
            <p className="mt-1 text-[15px] text-muted-dark">{p.subtitle}</p>
            <p className="mt-3 text-[15px] leading-[1.5] text-white/85">{p.description}</p>
            <motion.div variants={stagger(0.03)} className="mt-4 flex flex-wrap gap-2">
              {chips.map((s) => (
                <Chip key={s} tone="dark">
                  {s}
                </Chip>
              ))}
              {extra > 1 && (
                <Chip tone="dark" className="text-white/60" animated={false}>
                  +{extra} more
                </Chip>
              )}
            </motion.div>
            <Links p={p} size="sm" className="mt-auto pt-5" />
          </div>

          {/* highlights — the long part, scrolls within the card */}
          <div className="flex min-h-0 flex-col py-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45">Highlights</p>
            <ul
              className="term-scroll mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-10 pr-3 [mask-image:linear-gradient(to_bottom,black_calc(100%-44px),transparent)]"
              tabIndex={0}
              aria-label={`${p.name} highlights`}
            >
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-[14px] leading-[1.45] text-white/75">
                  <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.accent }} />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassPanel>
    </motion.article>
  )
}

/* ── Controls: 01 / 06 counter, hairline progress and arrows ─────────────── */

function pad(n: number) {
  return String(n).padStart(2, '0')
}

interface ControlsProps {
  active: number
  total: number
  progress: MotionValue<number> | null
  onPrev: () => void
  onNext: () => void
}

function Controls({ active, total, progress, onPrev, onNext }: ControlsProps) {
  const btn =
    'glass-dark grid h-11 w-11 place-items-center rounded-full text-white transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky disabled:cursor-default disabled:opacity-30'
  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-3">
        <span className="font-display text-[15px] font-semibold tabular-nums tracking-[-0.01em] text-white">{pad(active + 1)}</span>
        <div className="relative h-px w-24 overflow-hidden rounded-full bg-white/15">
          {progress ? (
            <motion.div className="absolute inset-y-0 left-0 w-full origin-left bg-sky" style={{ scaleX: progress }} />
          ) : (
            <motion.div
              className="absolute inset-y-0 left-0 w-full origin-left bg-sky"
              animate={{ scaleX: total > 1 ? active / (total - 1) : 1 }}
              transition={{ duration: 0.4, ease: appleEase }}
            />
          )}
        </div>
        <span className="font-display text-[15px] tabular-nums tracking-[-0.01em] text-white/50">{pad(total)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous project" className={btn} onClick={onPrev} disabled={active === 0}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Next project" className={btn} onClick={onNext} disabled={active === total - 1}>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/* ── Desktop: pinned section, vertical scroll drives the track sideways ──── */

const GAP = 24
const MAX_CARD = 1056 // .container-apple (1120) minus its 2rem gutters

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

function PinnedProjects() {
  const n = projects.length
  const wrapRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const [paneW, setPaneW] = useState(0)
  const [active, setActive] = useState(0)

  // geometry follows the pane width so the cards line up with .container-apple
  useLayoutEffect(() => {
    const el = paneRef.current
    if (!el) return
    const measure = () => setPaneW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const gutter = Math.max(0, (paneW - 1120) / 2) + 32
  const cardW = Math.max(0, Math.min(paneW - gutter * 2, MAX_CARD))
  const shift = (n - 1) * (cardW + GAP)

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, (v) => -v * shift)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const i = Math.min(n - 1, Math.max(0, Math.round(v * (n - 1))))
    setActive((prev) => (prev === i ? prev : i))
  })

  const goTo = (i: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const target = Math.max(0, Math.min(n - 1, i))
    const top = window.scrollY + wrap.getBoundingClientRect().top
    const range = wrap.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + (n > 1 ? target / (n - 1) : 0) * range, behavior: 'smooth' })
  }

  // keyboard users tabbing into an off-stage card: bring it on
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-index]')
    if (!card) return
    const i = Number(card.dataset.index)
    if (i !== active) goTo(i)
  }

  const controls = (
    <Controls active={active} total={n} progress={scrollYProgress} onPrev={() => goTo(active - 1)} onNext={() => goTo(active + 1)} />
  )

  return (
    <div ref={wrapRef} style={{ height: `${n * 80}vh` }}>
      <div ref={paneRef} className="sticky top-0 flex h-[100dvh] flex-col overflow-clip">
        <Background tone="dark" mode="absolute" />

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="container-apple relative z-10 flex items-end justify-between gap-8 pt-24"
        >
          <div className="max-w-[720px]">
            <motion.p variants={fadeUp} className="text-[14px] font-semibold tracking-[-0.224px] text-sky">
              {HEADING.eyebrow}
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-2 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.01em] text-white lg:text-[40px]">
              {HEADING.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-[17px] font-light leading-[1.4] text-muted-dark [@media(max-height:799px)]:hidden">
              {HEADING.subtitle}
            </motion.p>
          </div>
          <motion.div variants={fadeUp} className="shrink-0 pb-1">
            {controls}
          </motion.div>
        </motion.div>

        <div className="relative flex min-h-0 flex-1 items-center py-6">
          <motion.div
            style={{ x, paddingLeft: gutter, paddingRight: gutter, gap: GAP }}
            className="flex h-full max-h-[640px] w-max items-stretch will-change-transform"
            onFocusCapture={onFocus}
          >
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                style={{ width: cardW }}
                className="h-full shrink-0"
              >
                <StageCard p={p} index={i} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ── Mobile / reduced motion: native swipe carousel with snap points ─────── */

function SwipeProjects() {
  const n = projects.length
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const first = el.querySelector<HTMLElement>('[data-slide]')
    if (!first) return
    const step = first.offsetWidth + GAP
    const i = Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / step)))
    setActive((prev) => (prev === i ? prev : i))
  }

  const goTo = (i: number) => {
    const el = trackRef.current
    const slide = el?.querySelectorAll<HTMLElement>('[data-slide]')[Math.max(0, Math.min(n - 1, i))]
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div className="section relative">
      <Background tone="dark" mode="absolute" />
      <div className="container-apple relative">
        <SectionHeading tone="dark" {...HEADING} />
      </div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar relative mt-10 flex snap-x snap-mandatory items-start gap-6 overflow-x-auto overscroll-x-contain px-6 pb-2 sm:px-8"
        style={{ scrollPaddingInline: '1.5rem' }}
      >
        {projects.map((p, i) => (
          <motion.div
            key={p.id}
            data-slide
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="w-[min(82vw,720px)] shrink-0 snap-center"
          >
            <ProjectCard p={p} index={i} />
          </motion.div>
        ))}
        {/* trailing gutter so the last card can centre */}
        <div aria-hidden className="w-px shrink-0" />
      </div>
      <div className="container-apple relative mt-8 flex justify-end">
        <Controls active={active} total={n} progress={null} onPrev={() => goTo(active - 1)} onNext={() => goTo(active + 1)} />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */

export function Projects() {
  const reduce = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const pinned = desktop && !reduce
  return (
    <section id="projects" className="relative bg-tile-1 text-white">
      {pinned ? <PinnedProjects /> : <SwipeProjects />}
    </section>
  )
}
