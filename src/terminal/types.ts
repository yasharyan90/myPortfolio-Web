export type LineTone = 'default' | 'dim' | 'green' | 'cyan' | 'yellow' | 'red' | 'bold'

export interface Line {
  text: string
  tone?: LineTone
  /** when set, the line renders as a clickable link */
  href?: string
}

export type TermPalette = 'default' | 'green' | 'amber' | 'matrix' | 'dracula'

/** Side-effect hooks a command may call. The registry stays pure; the React shell wires these up. */
export interface TermContext {
  history: string[]
  sessionCount: number
  bootedAt: number
  isDark: boolean
  isFullscreen: boolean
  matrix: boolean
  palette: TermPalette
  setTheme: (t: 'light' | 'dark') => void
  setPalette: (p: TermPalette) => void
  setMatrix: (on: boolean) => void
  setFullscreen: (on: boolean) => void
  scrollTo: (sectionId: string) => boolean
  openUrl: (url: string) => void
  copy: (text: string) => Promise<boolean>
  clear: () => void
  reset: () => void
  close: () => void
}

export type CommandResult = Line[] | null | Promise<Line[] | null>

export interface Command {
  name: string
  description: string
  usage: string
  group: 'about' | 'navigate' | 'shell' | 'fun'
  run: (args: string[], ctx: TermContext) => CommandResult
}
