import { profile } from '../../data/profile'
import { socials } from '../../data/socials'
import { SocialButton } from '../ui/SocialButton'

export function Footer() {
  return (
    <footer className="bg-parchment py-12">
      <div className="container-apple">
        <div className="flex flex-col items-center justify-between gap-6 border-t border-hairline pt-8 sm:flex-row">
          <p className="text-[12px] tracking-[-0.12px] text-ink-48">
            © {new Date().getFullYear()} {profile.name}. Built with React, Tailwind CSS &amp; Framer Motion.
          </p>
          <div className="flex items-center gap-2">
            {socials.map((s) => (
              <SocialButton key={s.id} social={s} variant="icon" />
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
