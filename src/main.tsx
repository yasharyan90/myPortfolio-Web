import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { RouteProvider } from './hooks/useRoute'
import { TerminalProvider } from './hooks/useTerminal'
import { ThemeProvider } from './hooks/useTheme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouteProvider>
        <TerminalProvider>
          <App />
        </TerminalProvider>
      </RouteProvider>
    </ThemeProvider>
  </StrictMode>,
)
