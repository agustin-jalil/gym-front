import type { Exercise, MuscleGroup, Routine, RoutineExercise } from './types.ts'
import type { ExerciseRecord } from './server/exercises.ts'
import type { RoutineExerciseRecord, RoutineRecord } from './server/routines.ts'
import type { RoutineInput } from './validation.ts'

const MUSCLES: readonly string[] = ['pecho', 'espalda', 'piernas', 'hombros', 'brazos', 'core']
const isMuscle = (v: string | null): v is MuscleGroup => v !== null && MUSCLES.includes(v)
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function toExercise(r: ExerciseRecord): Exercise {
  return { id: r.id, name: r.name, muscle: isMuscle(r.muscleGroup) ? r.muscleGroup : 'core', custom: r.isCustom }
}

const toRoutineExercise = (e: RoutineExerciseRecord): RoutineExercise => ({
  exerciseId: e.exerciseId,
  sets: e.sets,
  reps: e.repsMax,
  weight: e.weightKg ?? 0,
  restSec: e.restSeconds,
})

/**
 * El front maneja una lista plana de ejercicios y varios días de la semana; el servidor, días con ejercicios.
 * Equivalencia: cada día de la semana es un `routine_day` con la misma lista de ejercicios.
 */
export function toRoutine(r: RoutineRecord): Routine {
  const weekdays = [...new Set(r.days.flatMap((d) => (d.weekday === null ? [] : [d.weekday])))].sort((a, b) => a - b)
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    days: weekdays,
    exercises: (r.days[0]?.exercises ?? []).map(toRoutineExercise),
    createdAt: r.createdAt,
  }
}

export function toRoutineInput(r: Routine): RoutineInput {
  const exercises = r.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    sets: e.sets,
    repsMin: e.reps,
    repsMax: e.reps,
    weightKg: e.weight,
    restSeconds: e.restSec,
  }))
  const weekdays = [...new Set(r.days)].sort((a, b) => a - b)
  const days =
    weekdays.length === 0
      ? [{ name: 'Rutina', weekday: null, exercises }]
      : weekdays.map((weekday) => ({ name: WEEKDAYS[weekday] ?? 'Día', weekday, exercises }))
  return { id: r.id, name: r.name, type: r.type, days }
}
