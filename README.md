# Yash Aryan — Portfolio

Apple-style, liquid-glass portfolio built from `Yash_Aryan_Resume_ATS.pdf`.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · react-icons / lucide-react

```bash
npm install
npm run dev       # http://localhost:5173 (use --port 5180 if 5173 is busy)
npm run build     # typecheck + production build → dist/
npm run preview
```

## Architecture

```
DESIGN.md                  Apple design tokens pulled via `npx getdesign add apple` (source of truth for colors/type/radius)
public/
  profile.jpg              hero portrait
  Yash_Aryan_Resume.pdf    served by the "Download résumé" buttons
  favicon.svg
src/
  index.css                Tailwind @theme tokens from DESIGN.md + .glass / .glass-dark liquid-glass surfaces + .shine sweep
  App.tsx                  section order (light → light → dark → light → dark → light → dark → footer)
  data/                    ALL content lives here — edit these, never the components
    profile.ts             name, tagline, contact, stats, quick facts
    socials.ts             GitHub · LeetCode · GeeksforGeeks · Codeforces · LinkedIn · Email (handle, URL, brand color, icon)
    skills.ts · projects.ts · education.ts · certifications.ts
  lib/
    motion.ts              shared Framer Motion variants (fadeUp, stagger, appleEase, spring)
    cn.ts
  hooks/
    useActiveSection.ts    IntersectionObserver → active nav pill
  components/
    ui/
      GlassPanel.tsx       liquid-glass card with cursor-following specular highlight
      GlassButton.tsx      Apple pill button (primary / glass / glassDark / ink) — magnetic + shine + press
      SocialButton.tsx     animated profile-link button: `pill` (hero/contact), `icon` (footer), `card` (Coding section)
      Magnetic.tsx         cursor-attraction wrapper (spring)
      CountUp.tsx          in-view number animation
      SectionHeading.tsx · Chip.tsx
    layout/
      Navbar.tsx           floating frosted pill nav, layoutId active indicator, mobile sheet
      Background.tsx       drifting blurred orbs (fixed for light sections, scoped inside dark tiles)
      ScrollProgress.tsx · Footer.tsx
    sections/
      Hero · About · Skills · Projects · Coding · Education · Certifications · Contact
```

## Updating content

- New coding/social profile → add an entry to `src/data/socials.ts`; it automatically appears in the hero pills, Coding cards, Contact row and footer.
- New project → append to `src/data/projects.ts` (`links` supports `github` and `live`).
- Replace `public/profile.jpg` / `public/Yash_Aryan_Resume.pdf` to update the photo / résumé.

## Deploy

Static output in `dist/` — deploy to Vercel/Netlify/GitHub Pages with no config (`vercel` from the project root works out of the box).
