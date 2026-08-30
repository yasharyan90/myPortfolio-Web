import { motion } from 'framer-motion'
import { ArrowUpRight, ExternalLink } from 'lucide-react'
import { SiGithub } from 'react-icons/si'
import { projects, type Project } from '../../data/projects'
import { fadeUp, stagger } from '../../lib/motion'
import { Background } from '../layout/Background'
import { Chip } from '../ui/Chip'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

export function ProjectCard({ p, index }: { p: Project; index: number }) {
  const flip = index % 2 === 1
  return (
    <motion.article variants={fadeUp}>
      <GlassPanel tone="dark" className="rounded-[24px] p-3 md:p-4">
        <div className={`grid gap-6 md:grid-cols-[0.9fr_1.1fr] ${flip ? 'md:[&>*:first-child]:order-2' : ''}`}>
          {/* cover */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative min-h-[240px] overflow-hidden rounded-[18px] md:min-h-full"
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
            <div className="absolute bottom-6 left-6 flex gap-4">
              {p.metrics.map((m) => (
                <div key={m.label} className="glass-dark rounded-[11px] px-3 py-2">
                  <p className="font-display text-[17px] font-semibold leading-none text-white">{m.value}</p>
                  <p className="mt-1 text-[11px] text-white/70">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* body */}
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
            {p.links.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {p.links.map((l) => (
                  <GlassButton
                    key={l.href}
                    href={l.href}
                    external
                    variant={l.kind === 'live' ? 'primary' : 'glassDark'}
                    icon={l.kind === 'github' ? <SiGithub size={16} /> : <ExternalLink className="h-4 w-4" />}
                    iconRight={<ArrowUpRight className="h-4 w-4" />}
                  >
                    {l.label}
                  </GlassButton>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </motion.article>
  )
}

export function Projects() {
  return (
    <section id="projects" className="section relative overflow-hidden bg-tile-1 text-white">
      <Background tone="dark" mode="absolute" />
      <div className="container-apple relative">
        <SectionHeading
          tone="dark"
          eyebrow="Projects"
          title="Built to run in production."
          subtitle="Collaborative editing, streaming, real-time and e-commerce platforms with live payments — designed, shipped and debugged end to end."
        />
        <motion.div variants={stagger(0.15)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="mt-12 space-y-6">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} p={p} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
