import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MuscleGroup } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Id corto sin depender de crypto.randomUUID (no existe en http fuera de localhost, ej. el celular en la red local). */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const MUSCLES: { id: MuscleGroup; label: string }[] = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'espalda', label: 'Espalda' },
  { id: 'piernas', label: 'Piernas' },
  { id: 'hombros', label: 'Hombros' },
  { id: 'brazos', label: 'Brazos' },
  { id: 'core', label: 'Core' },
]

export const muscleLabel = (m: MuscleGroup) => MUSCLES.find((x) => x.id === m)?.label ?? m

/** Orden de la semana para mostrar (lunes primero). Los valores son getDay(): 0 = domingo. */
export const WEEK: { day: number; short: string; long: string }[] = [
  { day: 1, short: 'L', long: 'Lunes' },
  { day: 2, short: 'M', long: 'Martes' },
  { day: 3, short: 'X', long: 'Miércoles' },
  { day: 4, short: 'J', long: 'Jueves' },
  { day: 5, short: 'V', long: 'Viernes' },
  { day: 6, short: 'S', long: 'Sábado' },
  { day: 0, short: 'D', long: 'Domingo' },
]

export function formatKg(n: number) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(n)
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export const dateLong = (d: Date | string) =>
  new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(d))

export const dateShort = (d: Date | string) =>
  new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(d))

export const monthYear = (d: Date | string) =>
  new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(d))
