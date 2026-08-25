import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { profile } from '../../data/profile'
import { socials } from '../../data/socials'
import { appleEase, fadeUp, stagger, viewport } from '../../lib/motion'
import { Background } from '../layout/Background'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SocialButton } from '../ui/SocialButton'

export function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section id="contact" className="section relative overflow-hidden bg-tile-1 text-white">
      <Background tone="dark" mode="absolute" />
      <div className="container-apple relative">
        <motion.div variants={stagger(0.12)} initial="hidden" whileInView="show" viewport={viewport} className="mx-auto max-w-[760px] text-center">
          <motion.p variants={fadeUp} className="text-[14px] font-semibold tracking-[-0.224px] text-sky">
            Contact
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-2 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[56px] md:text-[64px]"
          >
            Let's build something that stays up.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 text-[19px] font-light leading-[1.4] text-muted-dark sm:text-[21px]">
            Open to SDE and Full Stack internships. Reply time is usually same-day.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <GlassButton href={`mailto:${profile.email}`} size="lg" icon={<Mail className="h-4 w-4" />}>
              {profile.email}
            </GlassButton>
            <GlassButton onClick={copyEmail} variant="glassDark" size="lg" ariaLabel="Copy email address" className="min-w-[132px]">
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: appleEase }}
                    className="flex items-center gap-2 text-sky"
                  >
                    <Check className="h-4 w-4" /> Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: appleEase }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </GlassButton>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {socials
              .filter((s) => s.id !== 'email')
              .map((s) => (
                <SocialButton key={s.id} social={s} tone="dark" variant="pill" />
              ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10">
            <GlassPanel tone="dark" spotlight={false} className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full px-6 py-3 text-[14px] text-muted-dark">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-sky" /> {profile.phone}
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-sky" /> {profile.collegeEmail}
              </span>
            </GlassPanel>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
