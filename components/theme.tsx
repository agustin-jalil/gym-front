'use client'

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Theme = 'system' | 'light' | 'dark'
const KEY = 'theme'

/** Se ejecuta en <head> antes de pintar, para que no parpadee el modo claro al abrir en oscuro. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');var d=!t||t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

/** Sin preferencia guardada la app arranca en oscuro. */
const DEFAULT_THEME: Theme = 'dark'

const Ctx = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({ theme: DEFAULT_THEME, setTheme: () => {} })

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === 'light' || saved === 'dark' || saved === 'system') setThemeState(saved)
    } catch {
      /* sin almacenamiento: queda en el tema por defecto */
    }
  }, [])

  // En modo "sistema", sigue los cambios del sistema operativo en vivo.
  React.useEffect(() => {
    if (theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => apply('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [theme])

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t)
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* ignorar */
    }
    apply(t)
  }, [])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => React.useContext(Ctx)

const OPTIONS: { id: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dark', label: 'Oscuro', icon: Moon },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'system', label: 'Sistema', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-2xl border border-input bg-card p-1">
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          onClick={() => setTheme(id)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors',
            theme === id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  )
}
