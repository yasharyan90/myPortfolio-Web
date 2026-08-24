import { motion } from 'framer-motion'
import { profile } from '../../data/profile'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

export function About() {
  return (
    <section id="about" className="section relative">
      <div className="container-apple">
        <SectionHeading eyebrow="About" title={profile.headline} subtitle={`Seeking a ${profile.seeking}.`} />

        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 grid gap-5 md:grid-cols-[1.4fr_1fr]"
        >
          <motion.div variants={fadeUp}>
            <GlassPanel className="h-full rounded-[18px] p-7 md:p-9">
              <p className="text-[17px] leading-[1.6] text-ink-80 sm:text-[19px]">{profile.summary}</p>
              <div className="mt-8 grid grid-cols-2 gap-4 lg:hidden">
                {profile.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-[26px] font-semibold leading-none text-ink">
                      <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                    </p>
                    <p className="mt-1 text-[13px] text-ink-48">{s.label}</p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassPanel className="h-full rounded-[18px] p-7">
              <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                {profile.facts.map((f) => (
                  <li key={f.label} className="py-3.5 first:pt-0 last:pb-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">{f.label}</p>
                    <p className="mt-0.5 text-[17px] text-ink">{f.value}</p>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
