import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, Clipboard, Contact as ContactIcon, Copy, Mail, Phone, Send } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { profile } from '../../data/profile'
import { socials } from '../../data/socials'
import { cn } from '../../lib/cn'
import { appleEase, fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { Background } from '../layout/Background'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SocialButton } from '../ui/SocialButton'

/* ── helpers ────────────────────────────────────────────────────────────── */

const MY_TZ = 'Asia/Kolkata'
const MY_CITY = 'Prayagraj'

function hourIn(now: Date, timeZone: string) {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hour12: false }).format(now)) % 24
}

function describeGap(now: Date) {
  const mine = Math.round((new Date(now.toLocaleString('en-US', { timeZone: MY_TZ })).getTime() - now.getTime()) / 60000)
  const yours = Math.round((new Date(now.toLocaleString('en-US')).getTime() - now.getTime()) / 60000)
  const diff = mine - yours
  if (Math.abs(diff) < 15) return 'Same time zone as you'
  const h = Math.floor(Math.abs(diff) / 60)
  const m = Math.abs(diff) % 60
  const span = `${h}h${m ? ` ${m}m` : ''}`
  return diff > 0 ? `${span} ahead of you` : `${span} behind you`
}

function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), tickMs)
    return () => window.clearInterval(id)
  }, [tickMs])
  return now
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function downloadVCard() {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${profile.name.split(' ').slice(1).join(' ')};${profile.firstName};;;`,
    `FN:${profile.name}`,
    `TITLE:${profile.role}`,
    `EMAIL;TYPE=INTERNET,PREF:${profile.email}`,
    `EMAIL;TYPE=INTERNET:${profile.collegeEmail}`,
    `TEL;TYPE=CELL:${profile.phone.replace(/\s+/g, '')}`,
    `ADR;TYPE=HOME:;;;${MY_CITY};Uttar Pradesh;;India`,
    `URL:${window.location.origin}`,
    ...socials.filter((s) => s.id !== 'email').map((s) => `URL:${s.href}`),
    'END:VCARD',
  ]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${profile.name.replace(/\s+/g, '_')}.vcf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

/** A button whose label flips to a confirmation for a moment after `onAct` succeeds. */
function FlipButton({
  idle,
  done,
  onAct,
  variant = 'glassDark',
  size = 'md',
  ariaLabel,
  className,
}: {
  idle: ReactNode
  done: ReactNode
  onAct: () => Promise<boolean> | boolean
  variant?: 'primary' | 'glassDark'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'done'>('idle')
  const act = async () => {
    if (await onAct()) {
      setState('done')
      window.setTimeout(() => setState('idle'), 1800)
    }
  }
  return (
    <GlassButton onClick={act} variant={variant} size={size} ariaLabel={ariaLabel} className={className} magnetic={false}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: appleEase }}
          className={cn('flex items-center gap-2', state === 'done' && variant === 'glassDark' && 'text-sky')}
        >
          {state === 'done' ? done : idle}
        </motion.span>
      </AnimatePresence>
    </GlassButton>
  )
}

const INTENTS = [
  { id: 'internship', label: 'Internship', subject: 'Internship opportunity', hint: 'Role, team and timeline — I can start fast.' },
  { id: 'freelance', label: 'Freelance project', subject: 'Freelance project', hint: 'What you need built, rough scope and when.' },
  { id: 'collab', label: 'Collaboration', subject: "Let's collaborate", hint: 'Open source, hackathon or a side project.' },
  { id: 'hello', label: 'Just saying hi', subject: 'Hello from your portfolio', hint: 'No agenda needed.' },
] as const
type IntentId = (typeof INTENTS)[number]['id']

const DRAFT_KEY = 'contact-draft'
const MAX = 1000

function Composer() {
  const [intent, setIntent] = useState<IntentId>('internship')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  // keep a half-written note across reloads
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null')
      if (d) {
        if (INTENTS.some((i) => i.id === d.intent)) setIntent(d.intent)
        if (typeof d.name === 'string') setName(d.name)
        if (typeof d.message === 'string') setMessage(d.message)
      }
    } catch {
      /* ignore */
    }
  }, [])
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ intent, name, message }))
    } catch {
      /* ignore */
    }
  }, [intent, name, message])

  const current = INTENTS.find((i) => i.id === intent)!
  const subject = `${current.subject}${name.trim() ? ` — ${name.trim()}` : ''}`
  const body = `${message.trim()}${name.trim() ? `\n\n— ${name.trim()}` : ''}`
  const mailto = useMemo(
    () => `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    [subject, body],
  )
  const ready = message.trim().length > 0

  const openMail = () => {
    window.location.href = mailto
    setSent(true)
    window.setTimeout(() => setSent(false), 2600)
  }
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && ready) openMail()
  }

  const field =
    'w-full rounded-[12px] border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-[border-color,background-color,box-shadow] duration-200 focus:border-sky/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-sky/20'

  return (
    <GlassPanel tone="dark" className="rounded-[24px] p-5 sm:p-7" onKeyDown={onKey}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45">What's this about?</p>
      <div role="radiogroup" aria-label="Reason for getting in touch" className="mt-3 flex flex-wrap gap-2">
        {INTENTS.map((i) => {
          const on = i.id === intent
          return (
            <button
              key={i.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setIntent(i.id)}
              className={cn(
                'relative rounded-full px-3.5 py-1.5 text-[13.5px] tracking-[-0.2px] transition-colors duration-300',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky',
                on ? 'text-[#1d1d1f]' : 'text-white/75 hover:text-white',
              )}
            >
              {on && <motion.span layoutId="intent-pill" transition={spring} className="absolute inset-0 rounded-full bg-white" aria-hidden />}
              <span className="relative z-10">{i.label}</span>
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={intent}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: appleEase }}
          className="mt-3 text-[13px] text-white/50"
        >
          {current.hint}
        </motion.p>
      </AnimatePresence>

      <div className="mt-5 grid gap-3">
        <label className="block">
          <span className="sr-only">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            placeholder="Your name (optional)"
            autoComplete="name"
            className={field}
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            placeholder="A couple of lines is plenty — what are you working on?"
            rows={5}
            className={cn(field, 'resize-none pb-8 leading-[1.5]')}
          />
          <span
            className={cn('pointer-events-none absolute bottom-3 right-4 text-[11.5px] tabular-nums', message.length > MAX * 0.9 ? 'text-amber-300/80' : 'text-white/35')}
            aria-live="polite"
          >
            {message.length} / {MAX}
          </span>
        </label>
      </div>

      {/* live preview of what will land in my inbox */}
      <div className="mt-4 flex items-center gap-2 overflow-hidden text-[12.5px] text-white/45">
        <Mail className="h-3.5 w-3.5 shrink-0 text-sky/80" />
        <span className="shrink-0">Subject:</span>
        <span className="truncate text-white/75">{subject}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <GlassButton onClick={openMail} size="md" icon={<Send className="h-4 w-4" />} className={cn(!ready && 'pointer-events-none opacity-50')} magnetic={false}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={sent ? 'sent' : 'send'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: appleEase }}
            >
              {sent ? 'Opening your mail app…' : 'Open in mail app'}
            </motion.span>
          </AnimatePresence>
        </GlassButton>
        <FlipButton
          idle={
            <>
              <Clipboard className="h-4 w-4" /> Copy message
            </>
          }
          done={
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          }
          onAct={() => copyText(`To: ${profile.email}\nSubject: ${subject}\n\n${body}`)}
          ariaLabel="Copy the composed message"
          className={cn(!ready && 'pointer-events-none opacity-50')}
        />
        <span className="hidden text-[12px] text-white/35 sm:inline">
          <kbd className="rounded-[5px] bg-white/10 px-1.5 py-0.5 font-mono text-[11.5px] text-white/70">⌘</kbd> + <kbd className="rounded-[5px] bg-white/10 px-1.5 py-0.5 font-mono text-[11.5px] text-white/70">↵</kbd> to send
        </span>
      </div>
      <p className="mt-3 text-[12px] text-white/40">Nothing is sent from this page — it opens a pre-filled email in your own mail app.</p>
    </GlassPanel>
  )
}

function RightNow() {
  const now = useNow()
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: MY_TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now)
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: MY_TZ, weekday: 'short' }).format(now)
  const hour = hourIn(now, MY_TZ)
  const awake = hour >= 9 && hour < 24
  const gap = describeGap(now)

  return (
    <GlassPanel tone="dark" spotlight={false} className="rounded-[20px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex items-center gap-4">
          <div className="relative grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
            <span className={cn('h-2.5 w-2.5 rounded-full', awake ? 'bg-emerald-400' : 'bg-amber-400')} />
            {awake && <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400/60" aria-hidden />}
          </div>
          <div>
            <p className="font-display text-[22px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-white">
              {time}
              <span className="ml-2 text-[13px] font-normal tracking-normal text-white/50">{day} · {MY_CITY}</span>
            </p>
            <p className="mt-1.5 text-[13px] text-white/60">
              {awake ? 'Likely awake — same-day reply' : 'Probably asleep — I’ll reply in the morning'} · {gap}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`tel:${profile.phone.replace(/\s+/g, '')}`}
            className="glass-dark inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] text-white/85 transition-colors hover:text-white"
          >
            <Phone className="h-3.5 w-3.5 text-sky" /> {profile.phone}
          </a>
          <GlassButton onClick={downloadVCard} variant="glassDark" size="sm" icon={<ContactIcon className="h-3.5 w-3.5" />} magnetic={false} ariaLabel="Save my contact card">
            Save contact
          </GlassButton>
        </div>
      </div>
    </GlassPanel>
  )
}

/* ── section ────────────────────────────────────────────────────────────── */

export function Contact() {
  return (
    <section id="contact" className="section relative overflow-hidden bg-tile-1 text-white">
      <Background tone="dark" mode="absolute" />
      <div className="container-apple relative">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-12">
          <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={viewport}>
            <motion.p variants={fadeUp} className="text-[14px] font-semibold tracking-[-0.224px] text-sky">
              Contact
            </motion.p>
            <motion.h2 variants={fadeUp} className="mt-2 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[52px] lg:text-[56px]">
              Let's build something that stays up.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 max-w-[520px] text-[19px] font-light leading-[1.4] text-muted-dark">
              {profile.availability}. Reply time is usually same-day.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <GlassButton href={`mailto:${profile.email}`} size="lg" icon={<Mail className="h-4 w-4" />} iconRight={<ArrowUpRight className="h-4 w-4" />}>
                {profile.email}
              </GlassButton>
              <FlipButton
                size="lg"
                idle={
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                }
                done={
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                }
                onAct={() => copyText(profile.email)}
                ariaLabel="Copy email address"
                className="min-w-[132px]"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-2">
              {socials
                .filter((s) => s.id !== 'email')
                .map((s) => (
                  <SocialButton key={s.id} social={s} tone="dark" variant="pill" />
                ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8">
              <RightNow />
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
            <Composer />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
