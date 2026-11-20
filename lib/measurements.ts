import { isUuid, type Parsed } from './validation.ts'

/** Peso corporal en kg; el resto, perímetros en cm. Todos opcionales. */
export const MEASUREMENT_FIELDS = [
  'bodyWeightKg',
  'waistCm',
  'hipCm',
  'chestCm',
  'shouldersCm',
  'neckCm',
  'armRightCm',
  'armLeftCm',
  'forearmCm',
  'thighRightCm',
  'thighLeftCm',
  'calfCm',
] as const

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]

export type MeasurementInput = { id?: string; measuredOn: string } & Record<MeasurementField, number | null>

const MAX_VALUE = 500

function isCalendarDate(v: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
}

export function parseMeasurement(input: unknown): Parsed<MeasurementInput> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, error: 'El cuerpo debe ser un objeto' }
  const body: Record<string, unknown> = { ...input }
  const id = body.id
  if (id !== undefined && !isUuid(id)) return { ok: false, error: 'id debe ser un uuid' }
  const measuredOn = body.measuredOn
  if (typeof measuredOn !== 'string' || !isCalendarDate(measuredOn)) {
    return { ok: false, error: 'measuredOn debe ser una fecha AAAA-MM-DD válida' }
  }
  const values = {} as Record<MeasurementField, number | null>
  for (const f of MEASUREMENT_FIELDS) {
    const v = body[f]
    if (v === undefined || v === null) {
      values[f] = null
    } else if (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= MAX_VALUE) {
      values[f] = v
    } else {
      return { ok: false, error: `${f} debe ser un número mayor que 0 y hasta ${MAX_VALUE}` }
    }
  }
  return { ok: true, value: { ...(id === undefined ? {} : { id }), measuredOn, ...values } }
}
