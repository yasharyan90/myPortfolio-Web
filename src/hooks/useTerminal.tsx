import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface TerminalContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const TerminalContext = createContext<TerminalContextValue | null>(null)

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((v) => !v), [])

  // ⌘K / Ctrl+K toggles from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle])
  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}

export function useTerminal(): TerminalContextValue {
  const ctx = useContext(TerminalContext)
  if (!ctx) throw new Error('useTerminal must be used inside <TerminalProvider>')
  return ctx
}
