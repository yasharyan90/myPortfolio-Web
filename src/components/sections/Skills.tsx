import { AnimatePresence, LayoutGroup, motion, MotionConfig } from 'framer-motion'
import { ArrowUpRight, MousePointerClick } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { competencies, skillGroups } from '../../data/skills'
import { cn } from '../../lib/cn'
import { appleEase, fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { clearPending, pairedWith, PENDING_SKILL_KEY, readPending, SHOW_SKILL_EVENT, showProject, skillEntries, type SkillEntry } from '../../lib/skillUsage'
import { Chip } from '../ui/Chip'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

const ALL = 'All'

/* ── Skill tile ─────────────────────────────────────────────────────────── */

interface TileProps {
  entry: SkillEntry
  selected: boolean
  onPeek: (e: SkillEntry | null) => void
  onPick: (e: SkillEntry) => void
}

function Tile({ entry, selected, onPeek, onPick }: TileProps) {
  const { skill, used } = entry
  const Icon = skill.icon
  const color = skill.color ?? 'currentColor'
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      transition={spring}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => onPeek(entry)}
      onMouseMove={() => onPeek(entry)}
      onMouseLeave={() => onPeek(null)}
      onFocus={() => onPeek(entry)}
      onBlur={() => onPeek(null)}
      onClick={() => onPick(entry)}
      aria-pressed={selected}
      title={skill.name}
      className={cn(
        'glass group flex h-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-shadow duration-300',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-parchment',
      )}
    >
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-ink transition-transform duration-300 group-hover:scale-110"
        style={{ background: skill.color ? `${skill.color}1f` : 'rgba(127,127,127,0.12)', color }}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight tracking-[-0.2px] text-ink">{skill.name}</span>
        <span className="mt-0.5 block truncate text-[12px] tracking-[-0.1px] text-ink-48">
          {used.length > 0 ? `${used.length} project${used.length > 1 ? 's' : ''}` : entry.group}
        </span>
      </span>
    </motion.button>
  )
}

/* ── Detail panel ───────────────────────────────────────────────────────── */

const panelMotion = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: appleEase } },
  exit: { opacity: 0, y: -6, filter: 'blur(4px)', transition: { duration: 0.18 } },
}

function Overview({ shown }: { shown: number }) {
  const total = skillEntries.length
  const powered = new Set(skillEntries.flatMap((e) => e.used.map((p) => p.id))).size
  const stats = [
    { value: shown === total ? total : `${shown}/${total}`, label: 'skills' },
    { value: skillGroups.length, label: 'categories' },
    { value: powered, label: 'projects powered' },
  ]
  return (
    <motion.div key="overview" {...panelMotion}>
      <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.2px] text-primary">
        <MousePointerClick className="h-4 w-4" />
        Hover or tap a skill
      </div>
      <p className="mt-2 text-[17px] leading-[1.45] text-ink">
        Every tile knows which shipped project it powered. Pick one to see where it was used and what it was paired with.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[12px] bg-black/[0.04] px-3 py-3 dark:bg-white/[0.06]">
            <p className="font-display text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink">{s.value}</p>
            <p className="mt-1.5 text-[12px] leading-tight text-ink-48">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function Detail({ entry, onPick }: { entry: SkillEntry; onPick: (e: SkillEntry) => void }) {
  const { skill, group, used } = entry
  const Icon = skill.icon
  const color = skill.color ?? 'currentColor'
  const paired = pairedWith(entry)
  const description = skillGroups.find((g) => g.title === group)?.description
  return (
    <motion.div key={skill.name} {...panelMotion}>
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] text-ink"
          style={{ background: skill.color ? `${skill.color}24` : 'rgba(127,127,127,0.14)', color }}
        >
          <Icon size={30} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">{skill.name}</h3>
          <p className="mt-0.5 text-[13px] tracking-[-0.2px] text-ink-48">
            {group}
            {description && <span className="text-ink-48/70"> · {description}</span>}
          </p>
        </div>
      </div>

      <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">
        {used.length > 0 ? `Used in ${used.length} project${used.length > 1 ? 's' : ''}` : 'Where it fits'}
      </p>
      {used.length > 0 ? (
        <ul className="mt-2 divide-y divide-black/[0.06] dark:divide-white/10">
          {used.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => showProject(p.id)}
                className="group flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
              >
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold tracking-[-0.2px] text-ink group-hover:text-primary">{p.name}</span>
                  <span className="block truncate text-[12px] text-ink-48">{p.subtitle}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-48 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[15px] leading-[1.45] text-ink-80">Part of the everyday toolkit rather than a showcased build.</p>
      )}

      {paired.length > 0 && (
        <>
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">Often paired with</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {paired.map((e) => {
              const PIcon = e.skill.icon
              return (
                <button key={e.skill.name} type="button" onClick={() => onPick(e)} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus">
                  <Chip animated={false} className="gap-1.5 pl-2.5">
                    <span aria-hidden className="grid place-items-center" style={e.skill.color ? { color: e.skill.color } : undefined}>
                      <PIcon size={13} />
                    </span>
                    {e.skill.name}
                  </Chip>
                </button>
              )
            })}
          </div>
        </>
      )}
    </motion.div>
  )
}

/* ── Section ────────────────────────────────────────────────────────────── */

export function Skills() {
  const [filter, setFilter] = useState(ALL)
  const [pinned, setPinned] = useState<SkillEntry | null>(null)
  const [peek, setPeek] = useState<SkillEntry | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  // after a programmatic jump the tile that lands under a still cursor must not steal the panel
  const peekLocked = useRef(false)
  const peekIfFree = (e: SkillEntry | null) => {
    if (peekLocked.current) return
    setPeek(e)
  }

  const shown = useMemo(() => (filter === ALL ? skillEntries : skillEntries.filter((e) => e.group === filter)), [filter])

  // other sections (About's linked keywords) can ask for a skill to be pinned and brought into view
  useEffect(() => {
    const onShow = (e: Event) => {
      const entry = skillEntries.find((x) => x.skill.name === (e as CustomEvent<string>).detail)
      if (!entry) return
      setFilter(ALL)
      setPeek(null)
      setPinned(entry)
      peekLocked.current = true
      window.addEventListener('mousemove', () => (peekLocked.current = false), { once: true })
      document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener(SHOW_SKILL_EVENT, onShow)
    // a request made from another route (e.g. /now) before this section existed
    // (read now, clear when acted on — dev-mode effect double-runs would otherwise swallow it)
    const pending = readPending(PENDING_SKILL_KEY)
    const t = pending
      ? window.setTimeout(() => {
          clearPending(PENDING_SKILL_KEY)
          onShow(new CustomEvent(SHOW_SKILL_EVENT, { detail: pending }))
        }, 350)
      : 0
    return () => {
      window.removeEventListener(SHOW_SKILL_EVENT, onShow)
      window.clearTimeout(t)
    }
  }, [])
  const current = peek ?? pinned

  const tabs = [
    { title: ALL, count: skillEntries.length },
    ...skillGroups.map((g) => ({ title: g.title, count: g.items.length })),
  ]

  const pick = (e: SkillEntry) => {
    const unpin = pinned?.skill.name === e.skill.name
    setPinned(unpin ? null : e)
    if (unpin) setPeek(null) // tapping the pinned tile again returns the panel to the overview
    // a pick made from the "paired with" chips should also surface its tile
    if (filter !== ALL && e.group !== filter) setFilter(ALL)
    // below lg the panel sits above the grid — bring it back into view if a tap pushed it off-screen
    const panel = panelRef.current
    if (panel && !window.matchMedia('(min-width: 1024px)').matches) {
      const r = panel.getBoundingClientRect()
      if (r.top < 72 || r.bottom > window.innerHeight) panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <MotionConfig reducedMotion="user">
    <section id="skills" className="section relative">
      <div className="container-apple">
        <SectionHeading
          eyebrow="Skills"
          title="A full-stack toolkit, end to end."
          subtitle="From Go services and Postgres schemas to React interfaces and Docker deployments."
        />

        {/* category filter */}
        <LayoutGroup id="skill-tabs">
          <motion.div
            role="tablist"
            aria-label="Skill categories"
            variants={stagger(0.04)}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="no-scrollbar -mx-6 mt-10 flex gap-2 overflow-x-auto px-6 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:px-0"
          >
            {tabs.map((t) => {
              const active = t.title === filter
              return (
                <motion.button
                  key={t.title}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  variants={fadeUp}
                  onClick={() => setFilter(t.title)}
                  className={cn(
                    'relative shrink-0 rounded-full px-4 py-2 text-[14px] tracking-[-0.224px] transition-colors duration-300',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
                    active ? 'text-on-ink' : 'text-ink-80 hover:text-ink',
                  )}
                >
                  {active && (
                    <motion.span layoutId="skill-tab-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" aria-hidden />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {t.title}
                    <span className={cn('text-[12px] tabular-nums', active ? 'text-on-ink/60' : 'text-ink-48')}>{t.count}</span>
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        </LayoutGroup>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* tiles */}
          <motion.div
            layout
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease: appleEase }}
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((e) => (
                <Tile key={e.skill.name} entry={e} selected={pinned?.skill.name === e.skill.name} onPeek={peekIfFree} onPick={pick} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* detail panel — above the grid on small screens, sticky beside it on large */}
          <motion.aside
            ref={panelRef}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="order-first scroll-mt-24 lg:order-none lg:sticky lg:top-24"
            aria-label="Selected skill details"
          >
            <GlassPanel className="rounded-[18px] p-6 lg:min-h-[360px]">
              <AnimatePresence mode="wait" initial={false}>
                {current ? <Detail key={current.skill.name} entry={current} onPick={pick} /> : <Overview key="overview" shown={shown.length} />}
              </AnimatePresence>
            </GlassPanel>
          </motion.aside>
        </div>

        <motion.div
          variants={stagger(0.05, 0.2)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-10 flex flex-wrap items-center gap-2"
        >
          <motion.span variants={fadeUp} className="mr-2 text-[14px] font-semibold tracking-[-0.224px] text-ink-48">
            Core competencies
          </motion.span>
          {competencies.map((c) => (
            <Chip key={c} className="border-transparent bg-ink text-on-ink hover:border-transparent hover:bg-ink hover:text-on-ink dark:bg-ink dark:text-on-ink dark:hover:bg-ink">
              {c}
            </Chip>
          ))}
        </motion.div>
      </div>
    </section>
    </MotionConfig>
  )
}
