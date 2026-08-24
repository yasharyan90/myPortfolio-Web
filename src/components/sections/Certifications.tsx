import { motion } from 'framer-motion'
import { Award, Sparkles } from 'lucide-react'
import { achievements, certifications } from '../../data/certifications'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import { Chip } from '../ui/Chip'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

export function Certifications() {
  return (
    <section id="certifications" className="section relative">
      <div className="container-apple">
        <SectionHeading eyebrow="Certifications & achievements" title="Verified along the way." />

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {certifications.map((c) => (
            <motion.div key={c.title} variants={fadeUp} className="h-full">
              <GlassPanel className="flex h-full flex-col rounded-[18px] p-6" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </span>
                  {c.badge && <span className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-on-ink">{c.badge}</span>}
                </div>
                <h3 className="mt-5 font-display text-[19px] font-semibold leading-snug text-ink">{c.title}</h3>
                <p className="mt-1 text-[14px] tracking-[-0.224px] text-ink-48">
                  {c.issuer} · {c.platform}
                </p>
                <motion.div variants={stagger(0.04)} className="mt-auto flex flex-wrap gap-2 pt-5">
                  {c.topics.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </motion.div>
              </GlassPanel>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={stagger(0.1, 0.2)} initial="hidden" whileInView="show" viewport={viewport} className="mt-6 grid gap-3 md:grid-cols-3">
          {achievements.map((a) => (
            <motion.div key={a} variants={fadeUp} className="glass flex items-center gap-3 rounded-full px-4 py-3 text-[15px] text-ink-80">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              {a}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
