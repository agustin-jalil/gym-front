import type { RoutineExercise, RoutineType } from './types.ts'

export interface RoutineTypeSpec {
  label: string
  repsMin: number
  repsMax: number
  restMin: number
  restMax: number
  restDefault: number
}

export const ROUTINE_TYPES: Record<RoutineType, RoutineTypeSpec> = {
  hipertrofia: { label: 'Hipertrofia', repsMin: 6, repsMax: 12, restMin: 90, restMax: 180, restDefault: 120 },
  estres_metabolico: { label: 'Estrés metabólico', repsMin: 12, repsMax: 20, restMin: 30, restMax: 60, restDefault: 45 },
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function defaultExercise(type: RoutineType, exerciseId: string): RoutineExercise {
  const spec = ROUTINE_TYPES[type]
  return { exerciseId, sets: 3, reps: spec.repsMax, weight: 0, restSec: spec.restDefault }
}

/** Lleva reps y descanso al rango del tipo; series y kg no se tocan. */
export function adaptToType(type: RoutineType, e: RoutineExercise): RoutineExercise {
  const spec = ROUTINE_TYPES[type]
  return {
    ...e,
    reps: clamp(e.reps, spec.repsMin, spec.repsMax),
    restSec: clamp(e.restSec, spec.restMin, spec.restMax),
  }
}
