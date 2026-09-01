import { ArrowUpRight } from 'lucide-react'
import { cloneElement, useCallback, useEffect, useRef, useState } from 'react'
import { ActivityCalendar } from 'react-activity-calendar'
import { SiGithub } from 'react-icons/si'
import { bySocialId } from '../../data/socials'
import { useTheme } from '../../hooks/useTheme'
import type { ContributionCalendar } from '../../../api/contributions'
import { cn } from '../../lib/cn'
import { GlassPanel } from './GlassPanel'

/** GitHub's own contribution scales, so the graph reads exactly like the one on github.com */
const THEME = {
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  dark: ['#1f1f22', '#0e4429', '#006d32', '#26a641', '#39d353'],
}

const REFRESH_MS = 5 * 60 * 1000

/** The account's first year on GitHub — the year picker runs from here to the current year, adding new years automatically. */
const FIRST_YEAR = 2025

/** 'last' = rolling last-365-days window (GitHub's default); a number = that calendar year. */
type View = 'last' | number

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const tooltip = (a: { date: string; count: number }) => {
  const n = a.count
  return `${n === 0 ? 'No' : n} contribution${n === 1 ? '' : 's'} on ${dateFmt.format(new Date(a.date + 'T00:00:00'))}`
}

/** Today's date in the viewer's own timezone — GitHub is asked for this exact day so the last cell is really today. */
function localToday(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

type State = { status: 'loading' } | { status: 'ready'; data: ContributionCalendar } | { status: 'error' }

/**
 * Live contribution heatmap. Data comes from /api/contributions, which reads GitHub's public
 * contributions page directly (no token) for a range ending on the viewer's local today.
 * Refetches when the tab regains focus and every five minutes while visible.
 */
export function GitHubContributions() {
  const { isDark } = useTheme()
  const github = bySocialId('github')
  const username = github.href.split('/').filter(Boolean).pop() ?? ''
  const [state, setState] = useState<State>({ status: 'loading' })
  const [view, setView] = useState<View>('last')
  const seq = useRef(0)
  const wrap = useRef<HTMLDivElement>(null)

  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= FIRST_YEAR; y--) years.push(y)

  const load = useCallback(async () => {
    const id = ++seq.current
    try {
      const to = localToday()
      const query = `user=${encodeURIComponent(username)}&to=${to}${view === 'last' ? '' : `&year=${view}`}`
      // rolling window and the current year are live; a finished year never changes, let caches serve it
      const live = view === 'last' || view === Number(to.slice(0, 4))
      const res = await fetch(`/api/contributions?${query}`, live ? { cache: 'no-store' } : undefined)
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as ContributionCalendar
      if (seq.current === id) setState({ status: 'ready', data })
    } catch {
      if (seq.current === id) setState((s) => (s.status === 'ready' ? s : { status: 'error' }))
    }
  }, [username, view])

  useEffect(() => {
    setState({ status: 'loading' })
    void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, REFRESH_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.clearInterval(timer)
    }
  }, [load])

  // On narrow screens the grid overflows; start scrolled to the newest weeks, not last September.
  useEffect(() => {
    const root = wrap.current
    if (!root) return
    const toEnd = () => {
      const sc = root.querySelector<HTMLElement>('.react-activity-calendar__scroll-container')
      if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = sc.scrollWidth
    }
    const mo = new MutationObserver(toEnd)
    mo.observe(root, { childList: true, subtree: true })
    toEnd()
    return () => mo.disconnect()
  }, [])

  // last cell is today only in the rolling view and the current year — past years end on Dec 31
  const last = state.status === 'ready' ? state.data.days[state.data.days.length - 1] : undefined
  const today = last && last.date === localToday() ? last : undefined

  return (
    <GlassPanel spotlight={false} className="rounded-[18px] px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-2.5">
          <SiGithub size={18} className="text-ink" />
          <p className="font-display text-[17px] font-semibold tracking-[-0.374px] text-ink">GitHub activity</p>
          {state.status === 'ready' && today && (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/60 px-2.5 py-0.5 text-[12px] text-ink-48 dark:border-white/10 dark:bg-white/[0.08] sm:inline-flex"
              title={`Fetched from github.com at ${new Date(state.data.fetchedAt).toLocaleTimeString()}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26a641] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#26a641]" />
              </span>
              live · {today.count} today
            </span>
          )}
        </div>
        <a
          href={github.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 text-[14px] tracking-[-0.224px] text-primary transition-colors hover:text-primary-focus"
        >
          {github.handle}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Contribution range">
        {(['last', ...years] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12px] tracking-[-0.1px] transition-colors',
              view === v
                ? 'border-primary/40 bg-primary/10 font-medium text-primary'
                : 'border-black/[0.06] bg-white/60 text-ink-48 hover:text-ink dark:border-white/10 dark:bg-white/[0.08]',
            )}
          >
            {v === 'last' ? 'Last year' : v}
          </button>
        ))}
      </div>

      <div ref={wrap} className="gh-calendar mt-5 text-ink-48">
        {state.status === 'error' ? (
          <p className="text-[14px] text-ink-48">
            Couldn't reach GitHub right now —{' '}
            <a href={github.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
              see the graph on github.com
            </a>
            .
          </p>
        ) : (
          <ActivityCalendar
            data={state.status === 'ready' ? state.data.days : []}
            loading={state.status === 'loading'}
            colorScheme={isDark ? 'dark' : 'light'}
            theme={THEME}
            blockSize={13}
            blockMargin={4}
            blockRadius={3}
            fontSize={12}
            weekStart={1}
            labels={{ totalCount: view === 'last' ? '{{count}} contributions in the last year' : `{{count}} contributions in ${view}` }}
            renderBlock={(block, activity) => cloneElement(block, {}, <title>{tooltip(activity)}</title>)}
          />
        )}
      </div>
    </GlassPanel>
  )
}
