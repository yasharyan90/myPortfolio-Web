import { motion } from 'framer-motion'
import { ArrowLeft, Clock, GitCommit, GitPullRequest, MapPin, Sparkles, Star, Tag } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { SiGithub } from 'react-icons/si'
import { now, workingOn } from '../../data/now'
import { profile } from '../../data/profile'
import { bySocialId } from '../../data/socials'
import { Link } from '../../hooks/useRoute'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import { Background } from '../layout/Background'
import { ProjectCard } from '../sections/Projects'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

/* ── live local time in my timezone ─────────────────────────────────── */

function useLocalClock(timeZone: string) {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date())
  const [time, setTime] = useState(fmt)
  useEffect(() => {
    const t = window.setInterval(() => setTime(fmt()), 1000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeZone])
  return time
}

const dayLabel = (timeZone: string) => new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

/* ── latest public GitHub activity ───────────────────────────────────── */

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
    pull_request?: { title: string }
    issue?: { title: string }
  }
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  const units: [number, string][] = [
    [60, 's'],
    [60, 'm'],
    [24, 'h'],
    [7, 'd'],
    [4.35, 'w'],
    [12, 'mo'],
  ]
  let v = s
  let label = 's'
  for (const [div, u] of units) {
    if (v < div) break
    v = v / div
    label = u === 's' ? 'm' : u
  }
  return `${Math.floor(v)}${label} ago`
}

function describe(e: GhEvent): { icon: ReactNode; text: string; sha?: string } {
  const p = e.payload
  switch (e.type) {
    case 'PushEvent': {
      const branch = (p.ref ?? '').replace(/^refs\/heads\//, '')
      return { icon: <GitCommit className="h-4 w-4" />, text: `Pushed to ${branch || 'a branch'}`, sha: p.head }
    }
    case 'CreateEvent':
      return { icon: <Tag className="h-4 w-4" />, text: `Created ${p.ref_type}${p.ref ? ` ${p.ref}` : ''}` }
    case 'PullRequestEvent':
      return { icon: <GitPullRequest className="h-4 w-4" />, text: `${p.action} pull request — ${p.pull_request?.title ?? ''}` }
    case 'IssuesEvent':
      return { icon: <GitPullRequest className="h-4 w-4" />, text: `${p.action} issue — ${p.issue?.title ?? ''}` }
    case 'WatchEvent':
      return { icon: <Star className="h-4 w-4" />, text: 'Starred' }
    default:
      return { icon: <SiGithub size={15} />, text: e.type.replace(/Event$/, '').replace(/([A-Z])/g, ' $1').trim() }
  }
}

function useGitHubEvents(username: string) {
  const [events, setEvents] = useState<GhEvent[] | null | 'error'>(null)
  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`https://api.github.com/users/${username}/events/public?per_page=12`, {
      headers: { accept: 'application/vnd.github+json' },
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: GhEvent[]) => setEvents(list.filter((e) => e.type !== 'WatchEvent').slice(0, 6)))
      .catch(() => {
        if (!ctrl.signal.aborted) setEvents('error')
      })
    return () => ctrl.abort()
  }, [username])
  return events
}

/* ── page ────────────────────────────────────────────────────────────── */

export function NowPage() {
  const time = useLocalClock(now.timezone)
  const github = bySocialId('github')
  const username = github.href.split('/').filter(Boolean).pop() ?? ''
  const events = useGitHubEvents(username)
  const updated = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(now.updated + 'T00:00:00'))

  useEffect(() => {
    const prev = document.title
    document.title = `Now — ${profile.name}`
    return () => {
      document.title = prev
    }
  }, [])

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
              , updated {updated}.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger(0.1, 0.5)}
            initial="hidden"
            animate="show"
            className="mt-12 grid gap-5 md:grid-cols-[1.25fr_1fr]"
          >
            {/* location + live clock */}
            <motion.div variants={fadeUp}>
              <GlassPanel className="h-full rounded-[18px] p-7 md:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">
                      <MapPin className="h-3.5 w-3.5" /> Location
                    </p>
                    <p className="mt-3 font-display text-[32px] font-semibold leading-none tracking-[-0.01em] text-ink md:text-[36px]">
                      {now.location.city}
                    </p>
                    <p className="mt-1.5 text-[17px] text-ink-80">{now.location.region}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48 sm:justify-end">
                      <Clock className="h-3.5 w-3.5" /> Local time
                    </p>
                    <p className="mt-3 font-mono text-[28px] font-semibold leading-none tabular-nums tracking-[-0.02em] text-ink md:text-[32px]">{time}</p>
                    <p className="mt-1.5 text-[13px] text-ink-48">
                      {now.timezoneLabel} · {dayLabel(now.timezone)}
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-[15px] leading-[1.5] text-ink-80">{now.location.note}</p>
                <p className="mt-3 text-[13px] tracking-[-0.12px] text-ink-48">{now.location.campus}</p>
              </GlassPanel>
            </motion.div>

            {/* focus list */}
            <motion.div variants={fadeUp}>
              <GlassPanel className="h-full rounded-[18px] p-7">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">
                  <Sparkles className="h-3.5 w-3.5" /> Focus
                </p>
                <ul className="mt-4 divide-y divide-black/[0.06] dark:divide-white/10">
                  {now.focus.map((f) => (
                    <li key={f.label} className="py-3.5 first:pt-0 last:pb-0">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">{f.label}</p>
                      <p className="mt-0.5 text-[17px] text-ink">{f.value}</p>
                      <p className="text-[13px] text-ink-48">{f.detail}</p>
                    </li>
                  ))}
                </ul>
              </GlassPanel>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* working on — same card template as Projects */}
      <section className="section relative overflow-hidden bg-tile-1 text-white">
        <Background tone="dark" mode="absolute" />
        <div className="container-apple relative">
          <SectionHeading
            tone="dark"
            eyebrow="Working on"
            title="On my desk this week."
            subtitle="The things actively getting commits right now — newest first."
          />
          <motion.div variants={stagger(0.15)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="mt-12 space-y-6">
            {workingOn.map((p, i) => (
              <ProjectCard key={p.id} p={p} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* live GitHub activity */}
      <section className="section relative">
        <div className="container-apple">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <SectionHeading eyebrow="Latest on GitHub" title="Fresh off the keyboard." subtitle="My most recent public activity, straight from the GitHub API." />
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
              <GlassButton href={github.href} external variant="glass" icon={<SiGithub size={16} />}>
                {github.handle}
              </GlassButton>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} className="mt-12">
            <GlassPanel spotlight={false} className="rounded-[18px] px-2 py-2">
              {events === null && (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                  {[0, 1, 2, 3].map((i) => (
                    <li key={i} className="flex items-center gap-4 px-5 py-4">
                      <span className="h-8 w-8 animate-pulse rounded-full bg-black/[0.06] dark:bg-white/10" />
                      <span className="h-3.5 flex-1 animate-pulse rounded bg-black/[0.06] dark:bg-white/10" />
                    </li>
                  ))}
                </ul>
              )}
              {events === 'error' && (
                <p className="px-5 py-6 text-[15px] text-ink-48">
                  GitHub's API is rate-limiting right now —{' '}
                  <a href={github.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                    see my activity on github.com
                  </a>
                  .
                </p>
              )}
              {Array.isArray(events) && (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                  {events.map((e) => {
                    const d = describe(e)
                    return (
                      <li key={e.id} className="flex items-start gap-4 px-5 py-4">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">{d.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] text-ink">{d.text}</p>
                          <p className="mt-0.5 text-[13px] text-ink-48">
                            <a
                              href={`https://github.com/${e.repo.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {e.repo.name}
                            </a>
                            {d.sha && (
                              <>
                                {' · '}
                                <a
                                  href={`https://github.com/${e.repo.name}/commit/${d.sha}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-[12px] underline-offset-2 hover:text-ink hover:underline"
                                >
                                  {d.sha.slice(0, 7)}
                                </a>
                              </>
                            )}
                            {' · '}
                            {timeAgo(e.created_at)}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                  {events.length === 0 && <li className="px-5 py-6 text-[15px] text-ink-48">Quiet week — nothing public yet.</li>}
                </ul>
              )}
            </GlassPanel>
          </motion.div>
        </div>
      </section>
    </>
  )
}
