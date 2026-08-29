import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react'

/**
 * Tiny path router — enough for "/" and "/now" without pulling in a routing library.
 * vercel.json rewrites every non-file path to index.html, so deep links work in production.
 */

interface RouteContextValue {
  path: string
  /** Push a new path; optional hash scrolls to that element once the target page has rendered. */
  navigate: (path: string, hash?: string) => void
}

const RouteContext = createContext<RouteContextValue | null>(null)

const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/'

function scrollToHash(hash: string) {
  const el = document.getElementById(hash)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function RouteProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => (typeof window === 'undefined' ? '/' : normalize(window.location.pathname)))

  useEffect(() => {
    const onPop = () => setPath(normalize(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string, hash?: string) => {
    const next = normalize(to)
    const url = hash ? `${next}#${hash}` : next
    if (normalize(window.location.pathname) !== next) window.history.pushState(null, '', url)
    else if (hash) window.history.replaceState(null, '', url)
    setPath(next)
    if (hash) {
      // let the new page mount before looking for the target
      window.setTimeout(() => scrollToHash(hash), 60)
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [])

  const value = useMemo(() => ({ path, navigate }), [path, navigate])
  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
}

export function useRoute(): RouteContextValue {
  const ctx = useContext(RouteContext)
  if (!ctx) throw new Error('useRoute must be used inside <RouteProvider>')
  return ctx
}

/**
 * Anchor that handles internal navigation client-side.
 *  - "/now"       → pushState route change
 *  - "/#projects" → same-document scroll on "/", otherwise route to "/" then scroll
 *  - anything else (external, mailto, download) → default browser behaviour
 */
export function Link({ href, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { path, navigate } = useRoute()
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (!href.startsWith('/')) return
    const [target, hash] = href.split('#')
    const to = target || '/'
    if (hash && normalize(to) === path) {
      // same page: let the browser do a native fragment jump (keeps smooth-scroll + :target)
      return
    }
    e.preventDefault()
    navigate(to, hash || undefined)
  }
  return (
    <a href={href} onClick={handle} {...rest}>
      {children}
    </a>
  )
}
