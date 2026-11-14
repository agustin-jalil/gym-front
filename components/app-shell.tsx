'use client'

import { SyncErrorBanner } from '@/components/gym-loading'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Dumbbell, History, Home, Settings, TrendingUp } from 'lucide-react'
import { APP_NAME } from '@/lib/app'
import { cn } from '@/lib/utils'

interface Destination {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  /** Aparece en la barra inferior del celular (máx. 5 destinos). */
  bottom?: boolean
}

/** Una sola lista de destinos para las tres presentaciones: barra inferior, riel y barra lateral. */
const DESTINATIONS: Destination[] = [
  { href: '/', label: 'Hoy', icon: Home, bottom: true },
  { href: '/rutinas', label: 'Rutinas', icon: ClipboardList, bottom: true },
  { href: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { href: '/historial', label: 'Historial', icon: History, bottom: true },
  { href: '/progreso', label: 'Progreso', icon: TrendingUp, bottom: true },
  { href: '/ajustes', label: 'Ajustes', icon: Settings, bottom: true },
]

const isActive = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

/**
 * Navegación adaptable: barra inferior (compact < 600), riel (medium) y barra lateral (expanded >= 840).
 * Durante un entrenamiento se oculta todo: modo foco, sin toques accidentales.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith('/entrenar')) return (
      <main className="min-h-dvh">
        <SyncErrorBanner />
        {children}
      </main>
    )

  return (
    <>
      <aside
        aria-label="Navegación principal"
        className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r bg-background medium:flex expanded:w-60"
      >
        <Link
          href="/"
          className="flex h-20 items-center justify-center gap-3 font-display text-2xl font-semibold expanded:justify-start expanded:px-5"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="size-5" />
          </span>
          <span className="hidden expanded:inline">{APP_NAME}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
          {DESTINATIONS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-colors',
                  'expanded:min-h-12 expanded:flex-row expanded:justify-start expanded:gap-3 expanded:px-4 expanded:text-sm',
                  active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] medium:pb-0 medium:pl-[72px] expanded:pl-60">
        <SyncErrorBanner />
        {children}
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl medium:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {DESTINATIONS.filter((d) => d.bottom).map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span className={cn('rounded-full px-4 py-1 transition-colors', active && 'bg-primary/15')}>
                    <Icon className="size-5" />
                  </span>
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
