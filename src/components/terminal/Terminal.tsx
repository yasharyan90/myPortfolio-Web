import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { profile } from '../../data/profile'
import { useTerminal } from '../../hooks/useTerminal'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/cn'
import { appleEase } from '../../lib/motion'
import { COMMAND_COUNT, PALETTES, SECTIONS, commandNames, fileNames, neofetch, projectIds, runCommand } from '../../terminal/commands'
import type { Line, TermContext, TermPalette } from '../../terminal/types'
import { MatrixRain } from './MatrixRain'

/* ── types ───────────────────────────────────────────────────────────── */

type Row = { id: number; kind: 'out'; line: Line } | { id: number; kind: 'cmd'; text: string }

const HISTORY_KEY = 'term_history'
const PROMPT_USER = profile.name.toLowerCase().replace(/\s+/g, '')

const BOOT_LINES: Line[] = [
  { text: 'booting portfolio-os 2.0 ...', tone: 'dim' },
  { text: 'loading modules ............ [ok]', tone: 'dim' },
  { text: 'mounting /projects ......... [ok]', tone: 'dim' },
  { text: `starting shell for ${profile.firstName.toLowerCase()} ... [ok]`, tone: 'dim' },
  { text: '' },
]

function readHistory(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

const toneClass: Record<NonNullable<Line['tone']>, string> = {
  default: 'text-[var(--t-text)]',
  dim: 'text-[var(--t-dim)]',
  green: 'text-[var(--t-green)]',
  cyan: 'text-[var(--t-cyan)]',
  yellow: 'text-[var(--t-yellow)]',
  red: 'text-[var(--t-red)]',
  bold: 'font-semibold text-[var(--t-text)]',
}

/* ── component ───────────────────────────────────────────────────────── */

export function Terminal() {
  const { isOpen, close } = useTerminal()
  const { isDark, setTheme } = useTheme()
  const reduce = useReducedMotion()

  const [rows, setRows] = useState<Row[]>([])
  const [input, setInput] = useState('')
  const [palette, setPalette] = useState<TermPalette>('default')
  const [matrix, setMatrix] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [busy, setBusy] = useState(false)

  const historyRef = useRef<string[]>(readHistory())
  const historyIdx = useRef(historyRef.current.length)
  const draftRef = useRef('')
  const bootedRef = useRef(false)
  const bootedAt = useRef(Date.now())
  const idRef = useRef(0)
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  const nextId = () => ++idRef.current
  const push = useCallback((lines: Line[]) => {
    setRows((r) => [...r, ...lines.map((line): Row => ({ id: nextId(), kind: 'out', line }))])
  }, [])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  /* boot sequence — once per page load, replayed by `reset` */
  const boot = useCallback(
    (opts: { isDark: boolean; palette: TermPalette }) => {
      clearTimers()
      setRows([])
      bootedRef.current = true
      bootedAt.current = Date.now()
      const delay = reduce ? 0 : 90
      BOOT_LINES.forEach((l, i) => {
        timers.current.push(window.setTimeout(() => push([l]), delay * i))
      })
      timers.current.push(
        window.setTimeout(
          () => {
            push([
              ...neofetch({ isDark: opts.isDark, palette: opts.palette, bootedAt: bootedAt.current }, window.innerWidth < 640),
              { text: '' },
              { text: `Type 'help' to see all ${COMMAND_COUNT} commands.`, tone: 'dim' },
              { text: '' },
            ])
          },
          delay * BOOT_LINES.length + 40,
        ),
      )
    },
    [push, reduce],
  )

  useEffect(() => {
    if (isOpen && !bootedRef.current) boot({ isDark, palette })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => clearTimers, [])

  /* focus + escape + scroll lock while open */
  useEffect(() => {
    if (!isOpen) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  /* an async command hides the prompt briefly — give focus back when it returns */
  useEffect(() => {
    if (!busy && isOpen) inputRef.current?.focus()
  }, [busy, isOpen])

  /* keep the newest line in view */
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [rows, busy])

  /* side effects a command can request */
  const ctx = useMemo<TermContext>(
    () => ({
      history: historyRef.current,
      sessionCount,
      bootedAt: bootedAt.current,
      isDark,
      isFullscreen: fullscreen,
      matrix,
      palette,
      setTheme,
      setPalette,
      setMatrix,
      setFullscreen,
      scrollTo: (id) => {
        const el = document.getElementById(id)
        if (!el) return false
        close()
        window.setTimeout(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 220)
        return true
      },
      openUrl: (url) => {
        if (/^(mailto|tel):/.test(url)) window.location.href = url
        else window.open(url, '_blank', 'noopener,noreferrer')
      },
      copy: async (text) => {
        try {
          await navigator.clipboard.writeText(text)
          return true
        } catch {
          return false
        }
      },
      clear: () => setRows([]),
      reset: () => {
        setPalette('default')
        setMatrix(false)
        boot({ isDark, palette: 'default' })
      },
      close,
    }),
    [sessionCount, isDark, fullscreen, matrix, palette, setTheme, close, reduce, boot],
  )

  const submit = useCallback(
    async (raw: string) => {
      const cmdRow: Row = { id: nextId(), kind: 'cmd', text: raw }
      setRows((r) => [...r, cmdRow])
      const trimmed = raw.trim()
      if (!trimmed) return

      const h = historyRef.current
      if (h[h.length - 1] !== trimmed) h.push(trimmed)
      if (h.length > 200) h.splice(0, h.length - 200)
      historyIdx.current = h.length
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(h))
      } catch {
        /* private mode */
      }

      setSessionCount((c) => c + 1)
      const result = runCommand(trimmed, { ...ctx, sessionCount: sessionCount + 1 })
      if (result instanceof Promise) {
        setBusy(true)
        const lines = await result
        setBusy(false)
        if (lines) push(lines)
      } else if (result) {
        push(result)
      }
    },
    [ctx, push, sessionCount],
  )

  /* tab completion, history, shortcuts */
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const h = historyRef.current
    if (e.key === 'Enter') {
      e.preventDefault()
      const v = input
      setInput('')
      draftRef.current = ''
      void submit(v)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIdx.current === h.length) draftRef.current = input
      if (historyIdx.current > 0) {
        historyIdx.current--
        setInput(h[historyIdx.current] ?? '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx.current < h.length) {
        historyIdx.current++
        setInput(historyIdx.current === h.length ? draftRef.current : (h[historyIdx.current] ?? ''))
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      complete()
    } else if ((e.key === 'l' || e.key === 'L') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setRows([])
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault()
      setRows((r) => [...r, { id: nextId(), kind: 'cmd', text: input + '^C' }])
      setInput('')
    }
  }

  const complete = () => {
    const parts = input.split(/\s+/)
    const isArg = parts.length > 1
    const partial = (isArg ? parts[parts.length - 1] : parts[0]).toLowerCase()
    let pool: string[] = commandNames()
    if (isArg) {
      const c = parts[0].toLowerCase()
      if (c === 'cd' || c === 'open') pool = [...SECTIONS]
      else if (c === 'project') pool = projectIds()
      else if (c === 'cat') pool = fileNames()
      else if (c === 'theme') pool = PALETTES
      else if (c === 'man' || c === 'help') pool = c === 'help' ? ['about', 'navigate', 'shell', 'fun'] : commandNames()
      else return
    }
    const matches = pool.filter((n) => n.startsWith(partial))
    if (!partial || !matches.length) return
    if (matches.length === 1) {
      setInput([...parts.slice(0, -1), matches[0]].join(' ') + ' ')
      return
    }
    // longest common prefix, then list the candidates
    let lcp = matches[0]
    matches.forEach((m) => {
      while (!m.startsWith(lcp)) lcp = lcp.slice(0, -1)
    })
    if (lcp.length > partial.length) setInput([...parts.slice(0, -1), lcp].join(' '))
    else push([{ text: matches.join('   '), tone: 'dim' }])
  }

  const focusInput = (e: MouseEvent) => {
    // don't steal a text selection or a link click
    if ((e.target as HTMLElement).closest('a')) return
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  const windowTransition = reduce ? { duration: 0 } : { duration: 0.32, ease: appleEase }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="term-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio terminal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center bg-black/35 backdrop-blur-[6px]',
            fullscreen ? 'p-0 sm:p-4' : 'p-0 sm:p-6',
          )}
        >
          <motion.div
            layout
            data-palette={palette}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={windowTransition}
            className={cn(
              'term-glass relative flex flex-col overflow-hidden font-mono text-[13.5px] leading-[1.6] text-[var(--t-text)]',
              'h-[100dvh] w-full rounded-none sm:rounded-[22px]',
              fullscreen ? 'sm:h-[calc(100dvh-32px)] sm:w-full' : 'sm:h-[min(580px,84dvh)] sm:w-[min(840px,94vw)]',
            )}
          >
            {/* title bar */}
            <div className="relative flex h-11 flex-shrink-0 items-center border-b border-white/[0.08] px-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close terminal"
                  className="group grid h-3 w-3 place-items-center rounded-full bg-[#ff5f57] ring-1 ring-black/20 transition-transform hover:scale-110"
                >
                  <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 transition-opacity group-hover:opacity-100">×</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRows([])}
                  aria-label="Clear terminal"
                  title="Clear"
                  className="group grid h-3 w-3 place-items-center rounded-full bg-[#febc2e] ring-1 ring-black/20 transition-transform hover:scale-110"
                >
                  <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 transition-opacity group-hover:opacity-100">−</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFullscreen((v) => !v)}
                  aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  title="Fullscreen"
                  className="group grid h-3 w-3 place-items-center rounded-full bg-[#28c840] ring-1 ring-black/20 transition-transform hover:scale-110"
                >
                  <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 transition-opacity group-hover:opacity-100">+</span>
                </button>
              </div>
              <p className="pointer-events-none absolute inset-x-0 text-center text-[12px] tracking-[-0.1px] text-[var(--t-dim)]">
                {PROMPT_USER}@portfolio — zsh
              </p>
              <span className="ml-auto rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10.5px] text-[var(--t-dim)]">
                {sessionCount} cmd{sessionCount === 1 ? '' : 's'}
              </span>
            </div>

            {/* body */}
            <div ref={bodyRef} onClick={focusInput} className="term-scroll relative flex-1 cursor-text overflow-y-auto px-4 py-3 sm:px-5">
              {matrix && <MatrixRain />}
              <div className="relative z-10">
                {rows.map((r) =>
                  r.kind === 'cmd' ? (
                    <div key={r.id} className="whitespace-pre-wrap break-words">
                      <Prompt />
                      <span>{r.text}</span>
                    </div>
                  ) : (
                    <OutLine key={r.id} line={r.line} />
                  ),
                )}

                {busy && <p className="text-[var(--t-dim)]">…</p>}
                <div className={cn('flex items-center whitespace-pre', busy && 'opacity-0')}>
                  <Prompt />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    enterKeyHint="send"
                    aria-label="Terminal command"
                    className="min-w-0 flex-1 bg-transparent font-mono text-[13.5px] text-[var(--t-text)] caret-[var(--t-green)] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-1.5 text-[10.5px] text-[var(--t-dim)]">
              <span className="truncate">
                type <b className="font-semibold text-[var(--t-green)]">help</b> · tab completes · ↑↓ history · esc closes
              </span>
              <span className="hidden sm:inline">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Prompt() {
  return (
    <span className="select-none">
      <span className="text-[var(--t-green)]">{PROMPT_USER}@portfolio</span>
      <span className="text-[var(--t-dim)]">:</span>
      <span className="text-[var(--t-cyan)]">~</span>
      <span className="text-[var(--t-dim)]">$ </span>
    </span>
  )
}

function OutLine({ line }: { line: Line }) {
  const cls = cn('whitespace-pre-wrap break-words', toneClass[line.tone ?? 'default'])
  if (line.text === '') return <div className="h-[1.2em]" />
  if (line.href) {
    const external = /^https?:/.test(line.href)
    return (
      <div className={cls}>
        <a
          href={line.href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="underline decoration-[var(--t-cyan)]/40 underline-offset-[3px] transition-colors hover:decoration-[var(--t-cyan)]"
        >
          {line.text}
        </a>
      </div>
    )
  }
  return <div className={cls}>{line.text}</div>
}
