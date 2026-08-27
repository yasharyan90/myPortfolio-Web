import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { ArrowDown, Download, MapPin } from 'lucide-react'
import { useRef, type MouseEvent } from 'react'
import { profile } from '../../data/profile'
import { socials } from '../../data/socials'
import { appleEase, fadeUp, stagger } from '../../lib/motion'
import { CountUp } from '../ui/CountUp'
import { GitHubContributions } from '../ui/GitHubContributions'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SocialButton } from '../ui/SocialButton'

const floatingChips = [
  { text: 'Go · Fiber', x: '-8%', y: '12%', delay: 0 },
  { text: 'React 19', x: '78%', y: '6%', delay: 0.6 },
  { text: 'PostgreSQL', x: '-12%', y: '68%', delay: 1.2 },
  { text: 'Redis Pub/Sub', x: '72%', y: '80%', delay: 1.8 },
]

export function Hero() {
  const frameRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 140, damping: 18 })
  const sry = useSpring(ry, { stiffness: 140, damping: 18 })

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !frameRef.current) return
    const r = frameRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 16)
    rx.set(-py * 16)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28 pb-12 md:pt-32">
      <div className="container-apple grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr] md:gap-10">
        {/* copy */}
        <motion.div variants={stagger(0.1, 0.3)} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="inline-flex">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] tracking-[-0.2px] text-ink-80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {profile.availability}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-6 font-display text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[56px] md:text-[64px] lg:text-[72px]"
          >
            {profile.name}.
            <span className="mt-1 block text-ink-48">{profile.role}.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-[560px] text-[19px] font-light leading-[1.45] text-ink-80 sm:text-[21px]">
            {profile.tagline}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <GlassButton href="#projects" iconRight={<ArrowDown className="h-4 w-4" />}>
              View projects
            </GlassButton>
            <GlassButton href={profile.resume} variant="glass" download icon={<Download className="h-4 w-4" />}>
              Download résumé
            </GlassButton>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-2">
            {socials.slice(0, 5).map((s) => (
              <SocialButton key={s.id} social={s} variant="pill" />
            ))}
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 flex items-center gap-1.5 text-[14px] tracking-[-0.224px] text-ink-48">
            <MapPin className="h-3.5 w-3.5" /> {profile.location}
          </motion.p>
        </motion.div>

        {/* portrait */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: appleEase, delay: 0.5 }}
          className="relative mx-auto w-full max-w-[420px] [perspective:1200px]"
          onMouseMove={onMove}
          onMouseLeave={reset}
        >
          <motion.div ref={frameRef} style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }} className="relative">
            <GlassPanel className="rounded-[32px] p-3">
              <div className="relative overflow-hidden rounded-[24px]">
                <img
                  src={profile.avatar}
                  alt={`${profile.name} portrait`}
                  className="aspect-square w-full object-cover"
                  style={{ boxShadow: '3px 5px 30px 0 rgba(0,0,0,0.22)' }}
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <p className="font-display text-[21px] font-semibold leading-tight">{profile.name}</p>
                    <p className="text-[13px] text-white/80">VIT Bhopal · Class of 2028</p>
                  </div>
                  <span className="glass-dark rounded-full px-2.5 py-1 text-[12px]">CGPA 8.5</span>
                </div>
              </div>
            </GlassPanel>

            {floatingChips.map((c) => (
              <motion.span
                key={c.text}
                className="glass absolute hidden rounded-full px-3 py-1.5 text-[13px] font-semibold tracking-[-0.2px] text-ink-80 sm:block"
                style={{ left: c.x, top: c.y, transform: 'translateZ(60px)' }}
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
              >
                {c.text}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* live GitHub heatmap — sits under the location line, above About */}
      <motion.div
        id="contributions"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: appleEase, delay: 0.9 }}
        className="container-apple mt-12 scroll-mt-28 md:mt-14"
      >
        <GitHubContributions />
      </motion.div>

      {/* stats */}
      <motion.div
        variants={stagger(0.1, 1)}
        initial="hidden"
        animate="show"
        className="container-apple mt-6 hidden lg:block"
      >
        <GlassPanel spotlight={false} className="grid grid-cols-4 divide-x divide-black/[0.06] rounded-[18px] dark:divide-white/10">
          {profile.stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="px-6 py-4">
              <p className="font-display text-[28px] font-semibold leading-none tracking-[-0.01em] text-ink">
                <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </p>
              <p className="mt-1.5 text-[13px] tracking-[-0.2px] text-ink-48">{s.label}</p>
            </motion.div>
          ))}
        </GlassPanel>
      </motion.div>
    </section>
  )
}
