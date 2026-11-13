import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const WIDTHS = { sm: 'max-w-2xl', md: 'max-w-4xl', lg: 'max-w-6xl' } as const

/** Ancho y márgenes de una página: 16 px de gutter en compact, 24 en medium, 32 en expanded. */
export function PageContainer({
  size = 'md',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: keyof typeof WIDTHS }) {
  return (
    <div
      className={cn('rise mx-auto w-full space-y-6 px-4 py-6 medium:px-6 expanded:px-8 expanded:py-8', WIDTHS[size], className)}
      {...props}
    />
  )
}

/** Cabecera de página. Un solo <h1> por pantalla; en compact las acciones bajan debajo del título. */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <header className="space-y-3">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 medium:flex-row medium:items-end medium:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight medium:text-4xl">{title}</h1>
          {description ? <p className="text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export function SectionHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-xl">{title}</h2>
      {actions}
    </div>
  )
}
