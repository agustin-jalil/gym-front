import { isUuid, type Parsed } from './validation.ts'

export interface WorkoutSetInput {
  exerciseId: string
  setNumber: number
  weightKg: number
  reps: number
  rpe: number | null
}

export interface WorkoutInput {
  id?: string
  routineId: string | null
  routineName: string
  startedAt: string
  finishedAt: string
  sets: WorkoutSetInput[]
}

const MAX_NAME = 120
const MAX_SETS = 500
const MAX_WEIGHT_KG = 1000
const MAX_REPS = 1000
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/

const fail = <T>(error: string): Parsed<T> => ({ ok: false, error })

function parseTimestamp(v: unknown): string | null {
  if (typeof v !== 'string' || !ISO.test(v)) return null
  const t = Date.parse(v)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

function parseSet(raw: unknown, index: number): Parsed<WorkoutSetInput> {
  const at = `sets[${index}]`
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return fail(`${at} debe ser un objeto`)
  const s: Record<string, unknown> = { ...raw }
  if (!isUuid(s.exerciseId)) return fail(`${at}.exerciseId debe ser un uuid`)
  const { setNumber, weightKg, reps, rpe } = s
  if (typeof setNumber !== 'number' || !Number.isInteger(setNumber) || setNumber < 1 || setNumber > MAX_SETS) {
    return fail(`${at}.setNumber debe ser un entero entre 1 y ${MAX_SETS}`)
  }
  if (typeof weightKg !== 'number' || !Number.isFinite(weightKg) || weightKg < 0 || weightKg > MAX_WEIGHT_KG) {
    return fail(`${at}.weightKg debe ser un número entre 0 y ${MAX_WEIGHT_KG}`)
  }
  if (typeof reps !== 'number' || !Number.isInteger(reps) || reps < 0 || reps > MAX_REPS) {
    return fail(`${at}.reps debe ser un entero entre 0 y ${MAX_REPS}`)
  }
  let rpeValue: number | null = null
  if (rpe !== undefined && rpe !== null) {
    if (typeof rpe !== 'number' || rpe < 1 || rpe > 10 || !Number.isInteger(rpe * 2)) {
      return fail(`${at}.rpe debe estar entre 1 y 10, en pasos de 0,5`)
    }
    rpeValue = rpe
  }
  return { ok: true, value: { exerciseId: s.exerciseId, setNumber, weightKg, reps, rpe: rpeValue } }
}

/** Valida un entrenamiento terminado: solo series completadas, con RPE opcional. */
export function parseWorkout(input: unknown): Parsed<WorkoutInput> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return fail('El cuerpo debe ser un objeto')
  const body: Record<string, unknown> = { ...input }
  if (body.id !== undefined && !isUuid(body.id)) return fail('id debe ser un uuid')
  if (body.routineId !== undefined && body.routineId !== null && !isUuid(body.routineId)) return fail('routineId debe ser un uuid')
  const name = typeof body.routineName === 'string' ? body.routineName.trim() : ''
  if (name === '' || name.length > MAX_NAME) return fail(`routineName debe tener entre 1 y ${MAX_NAME} caracteres`)
  const startedAt = parseTimestamp(body.startedAt)
  if (startedAt === null) return fail('startedAt debe ser una fecha y hora ISO válida')
  const finishedAt = parseTimestamp(body.finishedAt)
  if (finishedAt === null || finishedAt < startedAt) return fail('finishedAt debe ser una fecha y hora ISO válida, no anterior a startedAt')
  if (!Array.isArray(body.sets) || body.sets.length < 1 || body.sets.length > MAX_SETS) {
    return fail(`sets debe tener entre 1 y ${MAX_SETS} series`)
  }
  const sets: WorkoutSetInput[] = []
  for (const [i, raw] of body.sets.entries()) {
    const r = parseSet(raw, i)
    if (!r.ok) return r
    sets.push(r.value)
  }
  return {
    ok: true,
    value: {
      ...(typeof body.id === 'string' ? { id: body.id } : {}),
      routineId: typeof body.routineId === 'string' ? body.routineId : null,
      routineName: name,
      startedAt,
      finishedAt,
      sets,
    },
  }
}
