# Yash Aryan — Portfolio

Apple-style, liquid-glass portfolio built from `Yash_Aryan_Resume_ATS.pdf`.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · react-icons / lucide-react

Light and dark themes: the sun/moon toggle in the nav persists to `localStorage` and otherwise follows the OS setting (applied before first paint, no flash).

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
  index.css                Tailwind @theme tokens from DESIGN.md, `:root.dark` token overrides, .glass / .glass-dark surfaces, .shine sweep
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
    useTheme.tsx           ThemeProvider (light/dark, localStorage + prefers-color-scheme) · useEffectiveTone()
  components/
    ui/
      GlassPanel.tsx       liquid-glass card with cursor-following specular highlight
      ThemeToggle.tsx      animated sun/moon switch
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

## Deploy to Vercel

`vercel.json` is already configured (Vite framework preset, `dist/` output, SPA rewrite, immutable caching for `/assets`, security headers).

**Option A — CLI**
```bash
npx vercel login          # one-time, opens browser
npx vercel                # preview deployment
npx vercel --prod         # production
```

**Option B — Git integration**
1. Push this repo to GitHub: `gh repo create yasharyan90/portfolio --public --source=. --push`
2. Import it at https://vercel.com/new — the framework is auto-detected; no settings needed.
3. Every push to `main` deploys to production, PRs get preview URLs.
