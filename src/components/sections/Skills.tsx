import { motion } from 'framer-motion'
import { competencies, skillGroups } from '../../data/skills'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import { Chip } from '../ui/Chip'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

export function Skills() {
  return (
    <section id="skills" className="section relative">
      <div className="container-apple">
        <SectionHeading
          eyebrow="Skills"
          title="A full-stack toolkit, end to end."
          subtitle="From Go services and Postgres schemas to React interfaces and Docker deployments."
        />

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {skillGroups.map((g) => (
            <motion.div key={g.title} variants={fadeUp} className="h-full">
              <GlassPanel className="h-full rounded-[18px] p-6" whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <h3 className="font-display text-[21px] font-semibold leading-tight text-ink">{g.title}</h3>
                <p className="mt-1 text-[14px] tracking-[-0.224px] text-ink-48">{g.description}</p>
                <motion.div variants={stagger(0.04)} className="mt-5 flex flex-wrap gap-2">
                  {g.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Chip key={item.name} className="gap-1.5 pl-2.5">
                        <span className="grid place-items-center" style={item.color ? { color: item.color } : undefined} aria-hidden>
                          <Icon size={14} />
                        </span>
                        {item.name}
                      </Chip>
                    )
                  })}
                </motion.div>
              </GlassPanel>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={stagger(0.05, 0.2)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-8 flex flex-wrap items-center gap-2"
        >
          <motion.span variants={fadeUp} className="mr-2 text-[14px] font-semibold tracking-[-0.224px] text-ink-48">
            Core competencies
          </motion.span>
          {competencies.map((c) => (
            <Chip key={c} className="border-transparent bg-ink text-on-ink hover:border-transparent hover:bg-ink hover:text-on-ink dark:bg-ink dark:text-on-ink dark:hover:bg-ink">
              {c}
            </Chip>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
