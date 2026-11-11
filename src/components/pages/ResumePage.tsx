import { motion } from 'framer-motion'
import { ArrowLeft, Check, Link2, Mail, MapPin, Phone, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { achievements, certifications } from '../../data/certifications'
import { education } from '../../data/education'
import { profile } from '../../data/profile'
import { projects } from '../../data/projects'
import { competencies, skillGroups } from '../../data/skills'
import { socials } from '../../data/socials'
import { Link } from '../../hooks/useRoute'
import { fadeUp, stagger } from '../../lib/motion'
import { GlassButton } from '../ui/GlassButton'

/** Projects that lead the résumé — the ones with a public link, newest first, capped so it stays near two pages. */
const featured = projects.filter((p) => p.links.length > 0).slice(0, 4)
const webLinks = socials.filter((s) => ['github', 'linkedin', 'leetcode'].includes(s.id))
const SITE_URL = 'https://my-portfolio-web-murex.vercel.app'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid print:mt-5">
      <h2 className="border-b border-ink/15 pb-1.5 font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function ResumePage() {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const prev = document.title
    document.title = `${profile.name} — Résumé`
    return () => {
      document.title = prev
    }
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/resume`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative pt-28 pb-20 md:pt-32 print:p-0">
      <div className="container-apple">
        {/* toolbar — not printed */}
        <motion.div variants={stagger(0.08, 0.1)} initial="hidden" animate="show" className="print:hidden">
          <motion.div variants={fadeUp}>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] tracking-[-0.224px] text-ink-48 transition-colors hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" /> Home
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold tracking-[-0.224px] text-primary">Résumé</p>
              <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[44px]">Always current.</h1>
              <p className="mt-3 max-w-[560px] text-[17px] font-light leading-[1.45] text-ink-48">
                This résumé is generated from the same data that powers the site, so it never goes stale. Save it as a PDF from your browser's print dialog.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GlassButton onClick={() => window.print()} icon={<Printer className="h-4 w-4" />} magnetic={false}>
                Save as PDF
              </GlassButton>
              <GlassButton onClick={copyLink} variant="glass" icon={copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />} magnetic={false}>
                {copied ? 'Link copied' : 'Copy link'}
              </GlassButton>
            </div>
          </motion.div>
        </motion.div>

        {/* the sheet */}
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="resume-sheet mx-auto mt-10 max-w-[860px] rounded-[18px] bg-canvas px-7 py-9 text-[13.5px] leading-[1.5] text-ink-80 shadow-product sm:px-11 sm:py-12 print:mt-0 print:max-w-none print:rounded-none print:px-0 print:py-0 print:shadow-none"
        >
          {/* header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">{profile.name}</h1>
              <p className="mt-2 text-[15px] text-ink">{profile.role}</p>
              <p className="mt-1 text-[13px] text-ink-48">{profile.availability}</p>
            </div>
            <ul className="space-y-1 text-[12.5px] sm:text-right">
              <li>
                <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                  <Mail className="h-3 w-3 print:hidden" /> {profile.email}
                </a>
              </li>
              <li>
                <a href={`tel:${profile.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                  <Phone className="h-3 w-3 print:hidden" /> {profile.phone}
                </a>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3 print:hidden" /> {profile.location}
              </li>
              {webLinks.map((s) => (
                <li key={s.id}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {s.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </a>
                </li>
              ))}
              <li>
                <a href={SITE_URL} className="hover:text-primary">
                  {SITE_URL.replace(/^https?:\/\//, '')}
                </a>
              </li>
            </ul>
          </header>

          <Section title="Summary">
            <p>{profile.summary}</p>
          </Section>

          <Section title="Skills">
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[auto_1fr]">
              {skillGroups.map((g) => (
                <div key={g.title} className="contents">
                  <dt className="font-semibold text-ink">{g.title}</dt>
                  <dd>{g.items.map((i) => i.name).join(', ')}</dd>
                </div>
              ))}
              <div className="contents">
                <dt className="font-semibold text-ink">Core</dt>
                <dd>{competencies.join(', ')}</dd>
              </div>
            </dl>
          </Section>

          <Section title="Projects">
            <ul className="space-y-4">
              {featured.map((p) => (
                <li key={p.id} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="font-semibold text-ink">
                      {p.name} <span className="font-normal text-ink-48">— {p.subtitle}</span>
                    </p>
                    <p className="text-[12px] text-ink-48">
                      {p.links.map((l, i) => (
                        <span key={l.href}>
                          {i > 0 && ' · '}
                          <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                            {l.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                          </a>
                        </span>
                      ))}
                    </p>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-48">{p.stack.join(' · ')}</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5">
                    {p.highlights.slice(0, 3).map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Education">
            <ul className="space-y-2.5">
              {education.map((e) => (
                <li key={e.school} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <div>
                    <p className="font-semibold text-ink">{e.school}</p>
                    <p>
                      {e.degree}
                      {e.detail ? ` · ${e.detail}` : ''}
                      {e.score ? ` · ${e.score}` : ''}
                    </p>
                  </div>
                  <p className="text-[12.5px] text-ink-48">
                    {e.period} · {e.location}
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Certifications">
            <ul className="space-y-1.5">
              {certifications.map((c) => (
                <li key={c.title} className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p>
                    <span className="font-semibold text-ink">{c.title}</span> — {c.issuer}, {c.platform}
                    {c.badge ? ` · ${c.badge}` : ''}
                  </p>
                  {c.credentialUrl && (
                    <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink-48 hover:text-primary">
                      {c.credentialUrl.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Achievements">
            <ul className="list-disc space-y-1 pl-5">
              {achievements.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Section>

          <p className="mt-8 text-[11px] text-ink-48 print:mt-6">
            Generated from {SITE_URL.replace(/^https?:\/\//, '')} on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </motion.article>
      </div>
    </div>
  )
}
