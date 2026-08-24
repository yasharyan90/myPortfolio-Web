import { motion } from 'framer-motion'
import { codingProfiles, contactProfiles } from '../../data/socials'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'
import { SocialButton } from '../ui/SocialButton'

export function Coding() {
  return (
    <section id="coding" className="section relative">
      <div className="container-apple">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <SectionHeading
            eyebrow="Profiles"
            title="Where I practice."
            subtitle="Every handle in one place — GitHub for what I build, LeetCode, GeeksforGeeks and Codeforces for how I think."
          />
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
            <GlassPanel spotlight={false} className="rounded-[18px] px-7 py-5 text-center md:text-left">
              <p className="font-display text-[48px] font-semibold leading-none tracking-[-0.02em] text-primary">
                <CountUp value={500} suffix="+" />
              </p>
              <p className="mt-1.5 text-[14px] tracking-[-0.224px] text-ink-48">DSA problems solved</p>
            </GlassPanel>
          </motion.div>
        </div>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {codingProfiles.map((s) => (
            <SocialButton key={s.id} social={s} variant="card" />
          ))}
        </motion.div>

        <motion.div
          variants={stagger(0.1, 0.3)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-6 grid gap-5 sm:grid-cols-2"
        >
          {contactProfiles.map((s) => (
            <SocialButton key={s.id} social={s} variant="card" />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
