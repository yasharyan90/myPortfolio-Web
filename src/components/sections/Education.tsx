import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { education } from '../../data/education'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import { Background } from '../layout/Background'
import { Chip } from '../ui/Chip'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

export function Education() {
  return (
    <section id="education" className="section relative overflow-hidden bg-tile-3 text-white">
      <Background tone="dark" mode="absolute" />
      <div className="container-apple relative">
        <SectionHeading tone="dark" eyebrow="Education" title="Grounded in fundamentals." />

        <motion.ol
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative mt-12 space-y-6 before:absolute before:left-[27px] before:top-6 before:bottom-6 before:w-px before:bg-white/15 md:before:left-[31px]"
        >
          {education.map((e) => (
            <motion.li key={e.school} variants={fadeUp} className="relative flex gap-5 md:gap-7">
              <div className="glass-dark relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full md:h-16 md:w-16">
                <GraduationCap className="h-6 w-6 text-sky" />
              </div>
              <GlassPanel tone="dark" className="flex-1 rounded-[18px] p-6 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-[21px] font-semibold leading-tight text-white md:text-[24px]">{e.school}</h3>
                    <p className="mt-1 text-[17px] text-white/85">{e.degree}</p>
                    {e.detail && <p className="text-[15px] text-muted-dark">{e.detail}</p>}
                  </div>
                  {e.score && <span className="rounded-full bg-sky/15 px-3 py-1 text-[13px] font-semibold text-sky">{e.score}</span>}
                </div>
                <p className="mt-3 text-[14px] tracking-[-0.224px] text-muted-dark">
                  {e.period} · {e.location}
                </p>
                {e.coursework && (
                  <motion.div variants={stagger(0.03)} className="mt-5 flex flex-wrap gap-2">
                    {e.coursework.map((c) => (
                      <Chip key={c} tone="dark">
                        {c}
                      </Chip>
                    ))}
                  </motion.div>
                )}
              </GlassPanel>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
