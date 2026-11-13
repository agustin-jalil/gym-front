'use client'

import * as React from 'react'
import { Button } from './button'

/** Confirmación con el <dialog> nativo: foco atrapado, Esc para cancelar y fondo bloqueado sin librerías. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const ref = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="w-[min(92vw,26rem)] rounded-3xl border bg-card p-0 text-card-foreground shadow-xl"
    >
      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <h2 className="font-display text-xl">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex flex-col-reverse gap-2 medium:flex-row medium:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
