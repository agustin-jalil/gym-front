import { fromLegacyId } from './legacy-ids.ts'
import { toRoutineInput, toWorkoutInput } from './api-mappers.ts'
import { isUuid, parseNewExercise, parseNewRoutine, type ExerciseInput, type Parsed, type RoutineInput } from './validation.ts'
import { parseWorkout, type WorkoutInput } from './workouts.ts'
import type { LoggedExercise, Routine, RoutineExercise, Session } from './types.ts'

export type LegacyKind = 'exercise' | 'routine' | 'session'
/** Id estable (misma entrada → mismo uuid) para que importar dos veces no duplique. */
export type IdFor = (kind: LegacyKind, legacyId: string) => string

export interface ImportPlan {
  exercises: (ExerciseInput & { id: string })[]
  routines: (RoutineInput & { id: string })[]
  workouts: (WorkoutInput & { id: string })[]
  /** Elementos del respaldo que no se pudieron importar (dañados o sin series hechas). */
  skipped: number
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Convierte el contenido de `gym:v1` en lo que hay que insertar en la base. Los datos de ejemplo de v0.1
 * ya están en la base (migración 0002) y se referencian por su uuid; solo se importa lo que creó el usuario.
 */
export function planLegacyImport(raw: unknown, idFor: IdFor): Parsed<ImportPlan> {
  if (!isRecord(raw) || !Array.isArray(raw.exercises) || !Array.isArray(raw.routines) || !Array.isArray(raw.sessions)) {
    return { ok: false, error: 'No es un respaldo válido de gym:v1' }
  }
  const mapId = (kind: LegacyKind, id: string) => {
    const seed = fromLegacyId(id)
    return seed !== id || isUuid(id) ? seed : idFor(kind, id)
  }
  const plan: ImportPlan = { exercises: [], routines: [], workouts: [], skipped: 0 }

  for (const e of raw.exercises) {
    if (!isRecord(e) || e.custom !== true || typeof e.id !== 'string') continue
    const parsed = parseNewExercise({ id: mapId('exercise', e.id), name: e.name, muscleGroup: e.muscle })
    if (parsed.ok) plan.exercises.push({ ...parsed.value, id: mapId('exercise', e.id) })
    else plan.skipped++
  }

  for (const r of raw.routines) {
    if (!isRecord(r) || typeof r.id !== 'string' || fromLegacyId(r.id) !== r.id) continue
    const routine = legacyRoutine(r, mapId)
    const parsed = routine ? parseNewRoutine(toRoutineInput(routine)) : null
    if (parsed?.ok) plan.routines.push({ ...parsed.value, id: mapId('routine', r.id) })
    else plan.skipped++
  }

  for (const s of raw.sessions) {
    const session = isRecord(s) ? legacySession(s, mapId) : null
    if (!session) {
      plan.skipped++
      continue
    }
    const input = toWorkoutInput(session)
    if (input.sets.length === 0) {
      plan.skipped++
      continue
    }
    const parsed = parseWorkout(input)
    if (parsed.ok) plan.workouts.push({ ...parsed.value, id: session.id })
    else plan.skipped++
  }
  return { ok: true, value: plan }
}

type MapId = (kind: LegacyKind, id: string) => string

function legacyRoutine(r: Record<string, unknown>, mapId: MapId): Routine | null {
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || !Array.isArray(r.exercises)) return null
  const exercises: RoutineExercise[] = []
  for (const e of r.exercises) {
    if (!isRecord(e) || typeof e.exerciseId !== 'string') return null
    const { sets, reps, weight, restSec } = e
    if (typeof sets !== 'number' || typeof reps !== 'number' || typeof weight !== 'number' || typeof restSec !== 'number') return null
    exercises.push({ exerciseId: mapId('exercise', e.exerciseId), sets, reps, weight, restSec })
  }
  const days = Array.isArray(r.days) ? r.days.filter((d): d is number => typeof d === 'number') : []
  return {
    id: mapId('routine', r.id),
    name: r.name,
    type: 'hipertrofia',
    days,
    exercises,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(0).toISOString(),
  }
}

function legacySession(s: Record<string, unknown>, mapId: MapId): Session | null {
  const { id, routineId, routineName, startedAt, finishedAt } = s
  if (typeof id !== 'string' || typeof startedAt !== 'string' || typeof finishedAt !== 'string' || !Array.isArray(s.exercises)) return null
  const exercises: LoggedExercise[] = []
  for (const e of s.exercises) {
    if (!isRecord(e) || typeof e.exerciseId !== 'string' || !Array.isArray(e.sets)) return null
    const sets = e.sets.flatMap((x) =>
      isRecord(x) && typeof x.reps === 'number' && typeof x.weight === 'number' ? [{ reps: x.reps, weight: x.weight, done: x.done === true }] : [],
    )
    exercises.push({ exerciseId: mapId('exercise', e.exerciseId), restSec: typeof e.restSec === 'number' ? e.restSec : 0, sets })
  }
  return {
    id: mapId('session', id),
    routineId: typeof routineId === 'string' ? mapId('routine', routineId) : '',
    routineName: typeof routineName === 'string' && routineName.trim() !== '' ? routineName : 'Entrenamiento',
    startedAt,
    finishedAt,
    exercises,
  }
}
