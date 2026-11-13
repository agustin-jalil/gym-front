import * as React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from './card'

/** Vacío, error o sin datos: icono, título, explicación y una acción. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/12 text-primary [&_svg]:size-8">
          {icon}
        </div>
      ) : null}
      <h2 className="font-display text-xl">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-4">
      <Skeleton className="h-9 w-48" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div data-slot="card" className="rounded-2xl border bg-card p-3.5 medium:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {icon ? <span className="text-primary [&_svg]:size-4">{icon}</span> : null}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold leading-none">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
