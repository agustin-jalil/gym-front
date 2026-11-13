'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const control =
  'w-full rounded-xl border border-input bg-muted/60 px-3 text-foreground placeholder:text-muted-foreground transition-shadow focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, 'h-10', className)} {...props} />
}

export function NativeSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-10 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

/** Etiqueta + control + mensaje. Une el label con el control para lectores de pantalla. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-sm text-destructive-ink">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

/**
 * Campo numérico para pesos y repeticiones: deja escribir "62,5" o borrar el campo sin saltos,
 * y selecciona todo al enfocar (en el gimnasio se corrige rápido, con el pulgar).
 */
export function NumField({
  value,
  onChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number
  onChange: (n: number) => void
}) {
  const [text, setText] = React.useState(String(value))
  const focused = React.useRef(false)

  React.useEffect(() => {
    if (!focused.current) setText(String(value))
  }, [value])

  return (
    <input
      inputMode="decimal"
      autoComplete="off"
      className={cn(control, 'h-10 text-center font-semibold', className)}
      value={text}
      onFocus={(e) => {
        focused.current = true
        e.target.select()
      }}
      onBlur={() => {
        focused.current = false
        setText(String(value))
      }}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.')
        if (!/^\d*\.?\d*$/.test(t)) return
        setText(t)
        const n = parseFloat(t)
        onChange(Number.isNaN(n) ? 0 : n)
      }}
      {...props}
    />
  )
}

/** Opciones tipo botón (una sola elegida), p. ej. el filtro por músculo. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 medium:mx-0 medium:flex-wrap medium:px-0">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
            value === o.id
              ? 'border-transparent bg-primary text-primary-foreground'
              : 'border-input bg-transparent text-foreground hover:bg-accent',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
