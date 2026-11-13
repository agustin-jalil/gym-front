import * as React from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Aviso en línea (no un toast): se queda hasta que cambia la pantalla. */
export function Alert({ tone, children }: { tone: 'success' | 'error'; children: React.ReactNode }) {
  const Icon = tone === 'success' ? CheckCircle2 : CircleAlert
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
        tone === 'success' ? 'border-success/40 bg-success/10 text-success-ink' : 'border-destructive/40 bg-destructive/10 text-destructive-ink',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
