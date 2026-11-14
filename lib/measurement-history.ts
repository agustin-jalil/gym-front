import type { MeasurementField } from './measurements.ts'
import { MEASUREMENT_FIELDS } from './measurements.ts'

export type MeasurementEntry = { id: string; measuredOn: string; createdAt: string } & Record<MeasurementField, number | null>

export type MeasurementVariation = {
  entry: MeasurementEntry
  /** Diferencia con la última medición anterior que tenía ese campo; null si no hay con qué comparar. */
  deltas: Record<MeasurementField, number | null>
}

export const MEASUREMENT_LABELS: Record<MeasurementField, string> = {
  bodyWeightKg: 'Peso corporal',
  waistCm: 'Cintura',
  hipCm: 'Cadera',
  chestCm: 'Pecho',
  shouldersCm: 'Hombros',
  neckCm: 'Cuello',
  armRightCm: 'Brazo derecho',
  armLeftCm: 'Brazo izquierdo',
  forearmCm: 'Antebrazo',
  thighRightCm: 'Muslo derecho',
  thighLeftCm: 'Muslo izquierdo',
  calfCm: 'Pantorrilla',
}

export const unitOf = (f: MeasurementField): 'kg' | 'cm' => (f === 'bodyWeightKg' ? 'kg' : 'cm')

const MAX_VALUE = 500
const round1 = (n: number) => Math.round(n * 10) / 10

/** De más nueva a más vieja (fecha, y a igual fecha, orden de carga). */
const newestFirst = (a: MeasurementEntry, b: MeasurementEntry) =>
  b.measuredOn.localeCompare(a.measuredOn) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)

export function variations(entries: readonly MeasurementEntry[]): MeasurementVariation[] {
  const sorted = [...entries].sort(newestFirst)
  return sorted.map((entry, i) => {
    const deltas = {} as Record<MeasurementField, number | null>
    for (const f of MEASUREMENT_FIELDS) {
      const current = entry[f]
      const previous = current === null ? undefined : sorted.slice(i + 1).find((e) => e[f] !== null)?.[f]
      deltas[f] = current === null || previous === undefined || previous === null ? null : round1(current - previous)
    }
    return { entry, deltas }
  })
}

export function formatDelta(delta: number | null, unit: 'kg' | 'cm'): string {
  if (delta === null) return '—'
  const abs = String(Math.abs(delta)).replace('.', ',')
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return `${sign}${abs} ${unit}`
}

export type FieldParse = { ok: true; value: number | null } | { ok: false }

/** Texto de un campo del formulario: vacío = no cargado; coma o punto decimal; mayor que 0 y hasta 500. */
export function parseFieldText(text: string): FieldParse {
  const t = text.trim().replace(',', '.')
  if (t === '') return { ok: true, value: null }
  if (!/^\d+(\.\d+)?$/.test(t)) return { ok: false }
  const n = Number(t)
  return n > 0 && n <= MAX_VALUE ? { ok: true, value: n } : { ok: false }
}
