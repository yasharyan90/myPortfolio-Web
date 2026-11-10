import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  CircleDot,
  Clock,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  GitCommit,
  GitPullRequest,
  MapPin,
  Moon,
  RefreshCw,
  Sparkles,
  Star,
  Sun,
  Tag,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SiGithub } from 'react-icons/si'
import { now, workingOn } from '../../data/now'
import { profile } from '../../data/profile'
import type { Project } from '../../data/projects'
import { bySocialId } from '../../data/socials'
import { Link } from '../../hooks/useRoute'
import { cn } from '../../lib/cn'
import { appleEase, fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { Background } from '../layout/Background'
import { ProjectCard } from '../sections/Projects'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { LinkedProse } from '../ui/LinkedProse'
import { SectionHeading } from '../ui/SectionHeading'
import { Tooltip } from '../ui/Tooltip'

/* ── time helpers ────────────────────────────────────────────────────── */

function useTick(ms: number) {
  const [t, setT] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setT(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return t
}

const clock = (timeZone: string, at: number) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(at)
const dayLabel = (timeZone: string, at: number) => new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' }).format(at)
const hourIn = (timeZone: string, at: number) => Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(at)) % 24

/** "5h 30m ahead of you" between my zone and the visitor's */
function gapLabel(timeZone: string, at: number) {
  const d = new Date(at)
  const mine = Math.round((new Date(d.toLocaleString('en-US', { timeZone })).getTime() - at) / 60000)
  const yours = Math.round((new Date(d.toLocaleString('en-US')).getTime() - at) / 60000)
  const diff = mine - yours
  if (Math.abs(diff) < 15) return 'same time zone as you'
  const h = Math.floor(Math.abs(diff) / 60)
  const m = Math.abs(diff) % 60
  return `${h}h${m ? ` ${m}m` : ''} ${diff > 0 ? 'ahead of' : 'behind'} you`
}

function timeAgo(iso: string, at = Date.now()) {
  const s = Math.max(1, Math.floor((at - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}w ago`
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

/* ── weather (open-meteo, no key) ────────────────────────────────────── */

interface Weather {
  temp: number
  humidity: number
  code: number
  isDay: boolean
}

function describeWeather(code: number, isDay: boolean): { label: string; icon: ReactNode } {
  const I = (C: typeof Cloud) => <C className="h-5 w-5" />
  if (code === 0) return { label: isDay ? 'Clear sky' : 'Clear night', icon: isDay ? I(Sun) : I(Moon) }
  if (code <= 2) return { label: 'Partly cloudy', icon: I(Cloud) }
  if (code === 3) return { label: 'Overcast', icon: I(Cloud) }
  if (code <= 48) return { label: 'Fog', icon: I(CloudFog) }
  if (code <= 57) return { label: 'Drizzle', icon: I(CloudDrizzle) }
  if (code <= 67) return { label: 'Rain', icon: I(CloudRain) }
  if (code <= 77) return { label: 'Snow', icon: I(CloudSnow) }
  if (code <= 82) return { label: 'Showers', icon: I(CloudRain) }
  if (code <= 86) return { label: 'Snow showers', icon: I(CloudSnow) }
  return { label: 'Thunderstorm', icon: I(CloudLightning) }
}

function useWeather(lat: number, lon: number, timeZone: string) {
  const [w, setW] = useState<Weather | null | 'error'>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m&timezone=${encodeURIComponent(timeZone)}`
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { current: { temperature_2m: number; weather_code: number; is_day: number; relative_humidity_2m: number } }) =>
        setW({ temp: Math.round(j.current.temperature_2m), humidity: j.current.relative_humidity_2m, code: j.current.weather_code, isDay: j.current.is_day === 1 }),
      )
      .catch(() => !ctrl.signal.aborted && setW('error'))
    return () => ctrl.abort()
  }, [lat, lon, timeZone])
  return w
}

/* ── GitHub: repo summaries for the working-on cards ─────────────────── */

interface RepoInfo {
  pushedAt: string
  stars: number
  openIssues: number
  language: string | null
  branch: string
}

function repoSlug(p: Project): string | null {
  const gh = p.links.find((l) => l.kind === 'github')?.href
  const m = gh?.match(/github\.com\/([^/]+\/[^/#?]+)/)
  return m ? m[1].replace(/\.git$/, '') : null
}

function useRepo(slug: string | null) {
  const [info, setInfo] = useState<RepoInfo | null | 'error'>(null)
  useEffect(() => {
    if (!slug) return
    const ctrl = new AbortController()
    fetch(`https://api.github.com/repos/${slug}`, { headers: { accept: 'application/vnd.github+json' }, signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { pushed_at: string; stargazers_count: number; open_issues_count: number; language: string | null; default_branch: string }) =>
        setInfo({ pushedAt: j.pushed_at, stars: j.stargazers_count, openIssues: j.open_issues_count, language: j.language, branch: j.default_branch }),
      )
      .catch(() => !ctrl.signal.aborted && setInfo('error'))
    return () => ctrl.abort()
  }, [slug])
  return info
}

/** Thin live strip above a working-on card: last push, stars, open issues, straight from the repo. */
function RepoPulse({ project, at }: { project: Project; at: number }) {
  const slug = repoSlug(project)
  const info = useRepo(slug)
  if (!slug) return null
  const fresh = info && info !== 'error' && at - new Date(info.pushedAt).getTime() < 7 * 864e5
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[13px] text-white/60">
      <a href={`https://github.com/${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-white/80 hover:text-white">
        <SiGithub size={13} /> {slug}
      </a>
      {info === null && <span className="h-3 w-40 animate-pulse rounded bg-white/10" aria-hidden />}
      {info === 'error' && <span>activity unavailable right now</span>}
      {info && info !== 'error' && (
        <>
          <a
            href={`https://github.com/${slug}/commits/${info.branch}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-white"
            title={new Date(info.pushedAt).toLocaleString()}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', fresh ? 'bg-emerald-400' : 'bg-white/30')} />
            last push {timeAgo(info.pushedAt, at)}
          </a>
          {info.language && <span>{info.language}</span>}
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3" /> {info.stars}
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleDot className="h-3 w-3" /> {info.openIssues} open
          </span>
        </>
      )}
    </div>
  )
}

/* ── GitHub: public activity feed ────────────────────────────────────── */

interface GhEvent {
  id: string
  type: string
  repo: { name: string }
  created_at: string
  payload: {
    ref_type?: string
    head?: string
    ref?: string | null
    action?: string
    pull_request?: { title: string; html_url?: string }
    issue?: { title: string; html_url?: string }
  }
}

type Kind = 'push' | 'pr' | 'other'
const kindOf = (e: GhEvent): Kind => (e.type === 'PushEvent' ? 'push' : e.type === 'PullRequestEvent' || e.type === 'IssuesEvent' ? 'pr' : 'other')
const FILTERS: { id: 'all' | Kind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'push', label: 'Pushes' },
  { id: 'pr', label: 'PRs & issues' },
  { id: 'other', label: 'Other' },
]

function describe(e: GhEvent): { icon: ReactNode; text: string; href?: string; sha?: string } {
  const p = e.payload
  const repo = `https://github.com/${e.repo.name}`
  switch (e.type) {
    case 'PushEvent': {
      const branch = (p.ref ?? '').replace(/^refs\/heads\//, '')
      return { icon: <GitCommit className="h-4 w-4" />, text: `Pushed to ${branch || 'a branch'}`, href: `${repo}/commits/${branch || ''}`, sha: p.head }
    }
    case 'CreateEvent':
      return { icon: <Tag className="h-4 w-4" />, text: `Created ${p.ref_type}${p.ref ? ` ${p.ref}` : ''}`, href: repo }
    case 'PullRequestEvent':
      return { icon: <GitPullRequest className="h-4 w-4" />, text: `${p.action} pull request — ${p.pull_request?.title ?? ''}`, href: p.pull_request?.html_url ?? `${repo}/pulls` }
    case 'IssuesEvent':
      return { icon: <GitPullRequest className="h-4 w-4" />, text: `${p.action} issue — ${p.issue?.title ?? ''}`, href: p.issue?.html_url ?? `${repo}/issues` }
    case 'WatchEvent':
      return { icon: <Star className="h-4 w-4" />, text: 'Starred', href: repo }
    default:
      return { icon: <SiGithub size={15} />, text: e.type.replace(/Event$/, '').replace(/([A-Z])/g, ' $1').trim(), href: repo }
  }
}

function useGitHubEvents(username: string) {
  const [events, setEvents] = useState<GhEvent[] | null | 'error'>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)
  const load = useCallback(async () => {
    const id = ++seq.current
    setBusy(true)
    try {
      const r = await fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, { headers: { accept: 'application/vnd.github+json' } })
      if (!r.ok) throw new Error(String(r.status))
      const list = (await r.json()) as GhEvent[]
      if (id !== seq.current) return
      setEvents(list.filter((e) => e.type !== 'WatchEvent'))
      setFetchedAt(Date.now())
    } catch {
      if (id === seq.current) setEvents((prev) => (Array.isArray(prev) ? prev : 'error'))
    } finally {
      if (id === seq.current) setBusy(false)
    }
  }, [username])
  useEffect(() => {
    load()
    const id = window.setInterval(load, 2 * 60 * 1000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])
  return { events, fetchedAt, busy, reload: load }
}

/* ── page ────────────────────────────────────────────────────────────── */

const FOCUS_LINKS: Record<string, { href: string; hint: string }> = {
  Learning: { href: '/#coding', hint: 'Live profiles' },
  'Open to': { href: '/#contact', hint: 'Get in touch' },
}

export function NowPage() {
  const tick = useTick(1000)
  const github = bySocialId('github')
  const username = github.href.split('/').filter(Boolean).pop() ?? ''
  const { events, fetchedAt, busy, reload } = useGitHubEvents(username)
  const weather = useWeather(now.location.coords.lat, now.location.coords.lon, now.timezone)
  const [filter, setFilter] = useState<'all' | Kind>('all')

  const updatedDate = new Date(now.updated + 'T00:00:00')
  const updated = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(updatedDate)
  const updatedDays = Math.floor((tick - updatedDate.getTime()) / 864e5)
  const hour = hourIn(now.timezone, tick)
  const awake = hour >= 9 && hour < 24

  const shown = useMemo(() => (Array.isArray(events) ? events.filter((e) => filter === 'all' || kindOf(e) === filter).slice(0, 8) : events), [events, filter])
  const counts = useMemo(() => {
    const c = { all: 0, push: 0, pr: 0, other: 0 }
    if (Array.isArray(events)) for (const e of events) (c.all++, c[kindOf(e)]++)
    return c
  }, [events])

  useEffect(() => {
    const prev = document.title
    document.title = `Now — ${profile.name}`
    return () => {
      document.title = prev
    }
  }, [])

  const wx = weather && weather !== 'error' ? describeWeather(weather.code, weather.isDay) : null

  return (
    <>
      {/* header + status cards */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="container-apple">
          <motion.div variants={stagger(0.1, 0.15)} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] tracking-[-0.224px] text-ink-48 transition-colors hover:text-ink">
                <ArrowLeft className="h-3.5 w-3.5" /> Home
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} className="mt-6 text-[14px] font-semibold tracking-[-0.224px] text-primary">
              Now
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-2 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px] md:text-[64px]"
            >
              What I'm doing right now.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-[640px] text-[19px] font-light leading-[1.4] text-ink-48 sm:text-[21px]">
              Where I am, what I'm building and what I'm learning at this point in my life. A{' '}
              <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                now page
              </a>
              .
            </motion.p>
            <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-ink-48">
              <Tooltip label={`Updated ${updated}`}>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
                    updatedDays <= 45 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', updatedDays <= 45 ? 'bg-emerald-500' : 'bg-amber-500')} />
                  Page updated {updatedDays === 0 ? 'today' : `${updatedDays} day${updatedDays === 1 ? '' : 's'} ago`}
                </span>
              </Tooltip>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/60 px-2.5 py-1 dark:border-white/10 dark:bg-white/[0.08]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Clock, weather and GitHub feed are live
              </span>
            </motion.div>
          </motion.div>

          <motion.div variants={stagger(0.1, 0.5)} initial="hidden" animate="show" className="mt-12 grid gap-5 md:grid-cols-[1.25fr_1fr]">
            {/* location + live clock + weather */}
            <motion.div variants={fadeUp}>
              <GlassPanel className="h-full rounded-[18px] p-7 md:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">
                      <MapPin className="h-3.5 w-3.5" /> Location
                    </p>
                    <p className="mt-3 font-display text-[32px] font-semibold leading-none tracking-[-0.01em] text-ink md:text-[36px]">{now.location.city}</p>
                    <p className="mt-1.5 text-[17px] text-ink-80">{now.location.region}</p>
                    <div className="mt-4 flex items-center gap-2 text-[14px] text-ink-80" aria-live="polite">
                      {weather === null && <span className="h-4 w-36 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" aria-hidden />}
                      {weather === 'error' && <span className="text-ink-48">Weather unavailable right now</span>}
                      {weather && weather !== 'error' && wx && (
                        <>
                          <span className="text-primary">{wx.icon}</span>
                          <span className="font-display text-[20px] font-semibold leading-none text-ink">{weather.temp}°C</span>
                          <span>{wx.label}</span>
                          <span className="inline-flex items-center gap-1 text-ink-48">
                            <Droplets className="h-3.5 w-3.5" /> {weather.humidity}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48 sm:justify-end">
                      <Clock className="h-3.5 w-3.5" /> Local time
                    </p>
                    <p className="mt-3 font-mono text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em] text-ink md:text-[32px]">{clock(now.timezone, tick)}</p>
                    <p className="mt-1.5 text-[13px] text-ink-48">
                      {now.timezoneLabel} · {dayLabel(now.timezone, tick)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-ink-48 sm:justify-end">
                      <span className={cn('h-2 w-2 rounded-full', awake ? 'bg-emerald-400' : 'bg-amber-400')} />
                      {awake ? 'Likely awake' : 'Probably asleep'} · {gapLabel(now.timezone, tick)}
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-[15px] leading-[1.5] text-ink-80">{now.location.note}</p>
                <p className="mt-3 text-[13px] tracking-[-0.12px] text-ink-48">{now.location.campus}</p>
              </GlassPanel>
            </motion.div>

            {/* focus list — skill names link into the Skills section */}
            <motion.div variants={fadeUp}>
              <GlassPanel className="h-full rounded-[18px] p-3">
                <p className="flex items-center gap-1.5 px-4 pt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">
                  <Sparkles className="h-3.5 w-3.5" /> Focus
                </p>
                <ul className="mt-1 divide-y divide-black/[0.06] dark:divide-white/10">
                  {now.focus.map((f) => {
                    const link = FOCUS_LINKS[f.label]
                    return (
                      <li key={f.label} className="relative px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">{f.label}</p>
                          {link && (
                            <Link href={link.href} className="group inline-flex items-center gap-1 text-[12px] text-ink-48 transition-colors hover:text-primary">
                              {link.hint}
                              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </Link>
                          )}
                        </div>
                        <p className="mt-0.5 text-[17px] text-ink">
                          <LinkedProse text={f.value} />
                        </p>
                        <p className="text-[13px] text-ink-48">
                          <LinkedProse text={f.detail} className="text-ink-80" />
                        </p>
                      </li>
                    )
                  })}
                </ul>
                <p className="px-4 pb-3 pt-2 text-[12px] text-ink-48">Dotted terms open in the Skills section.</p>
              </GlassPanel>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* working on — same card template as Projects, with a live repo strip */}
      <section className="section relative overflow-hidden bg-tile-1 text-white">
        <Background tone="dark" mode="absolute" />
        <div className="container-apple relative">
          <SectionHeading tone="dark" eyebrow="Working on" title="On my desk this week." subtitle="The things actively getting commits right now — newest first. Each strip reads the repo live." />
          <motion.div variants={stagger(0.15)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="mt-12 space-y-8">
            {workingOn.map((p, i) => (
              <motion.div key={p.id} variants={fadeUp}>
                <RepoPulse project={p} at={tick} />
                <ProjectCard p={p} index={i} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* live GitHub activity */}
      <section className="section relative">
        <div className="container-apple">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <SectionHeading eyebrow="Latest on GitHub" title="Fresh off the keyboard." subtitle="My most recent public activity, straight from the GitHub API. Refreshes every two minutes and whenever you come back to the tab." />
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
              <GlassButton href={github.href} external variant="glass" icon={<SiGithub size={16} />}>
                {github.handle}
              </GlassButton>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} className="mt-10 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filter activity" className="flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = f.id === filter
                return (
                  <button
                    key={f.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      'relative rounded-full px-3.5 py-1.5 text-[13.5px] tracking-[-0.2px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
                      active ? 'text-on-ink' : 'text-ink-80 hover:text-ink',
                    )}
                  >
                    {active && <motion.span layoutId="now-feed-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" aria-hidden />}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {f.label}
                      <span className={cn('text-[11.5px] tabular-nums', active ? 'text-on-ink/60' : 'text-ink-48')}>{counts[f.id]}</span>
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={reload}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-ink-48 transition-colors hover:text-ink disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />
              {busy ? 'Refreshing…' : fetchedAt ? `Updated ${timeAgo(new Date(fetchedAt).toISOString(), tick)}` : 'Refresh'}
            </button>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} className="mt-4">
            <GlassPanel spotlight={false} className="rounded-[18px] px-2 py-2">
              {shown === null && (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-4 px-5 py-4">
                      <span className="h-8 w-8 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/10" />
                      <span className="h-3.5 flex-1 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
                    </li>
                  ))}
                </ul>
              )}
              {shown === 'error' && (
                <p className="px-5 py-6 text-[15px] text-ink-48">
                  GitHub's API is rate-limiting right now —{' '}
                  <a href={github.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                    see my activity on github.com
                  </a>
                  .
                </p>
              )}
              {Array.isArray(shown) && (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                  <AnimatePresence initial={false}>
                    {shown.map((e) => {
                      const d = describe(e)
                      return (
                        <motion.li
                          key={e.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.3, ease: appleEase }}
                        >
                          <a
                            href={d.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-4 rounded-[12px] px-5 py-4 transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-focus dark:hover:bg-white/[0.05]"
                          >
                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">{d.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] text-ink">{d.text}</p>
                              <p className="mt-0.5 truncate text-[13px] text-ink-48">
                                <span className="text-primary">{e.repo.name}</span>
                                {d.sha && (
                                  <>
                                    {' · '}
                                    <span className="font-mono text-[12px]">{d.sha.slice(0, 7)}</span>
                                  </>
                                )}
                                {' · '}
                                {timeAgo(e.created_at, tick)}
                              </p>
                            </div>
                            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-48 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                          </a>
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                  {shown.length === 0 && <li className="px-5 py-6 text-[15px] text-ink-48">Nothing public in this category yet.</li>}
                </ul>
              )}
            </GlassPanel>
          </motion.div>
        </div>
      </section>
    </>
  )
}
