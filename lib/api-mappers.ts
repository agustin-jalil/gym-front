import type { Exercise, LoggedExercise, MuscleGroup, Routine, RoutineExercise, Session } from './types.ts'
import type { ExerciseRecord } from './server/exercises.ts'
import type { RoutineExerciseRecord, RoutineRecord } from './server/routines.ts'
import type { WorkoutRecord } from './server/workouts.ts'
import type { RoutineInput } from './validation.ts'
import type { WorkoutInput } from './workouts.ts'

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

/** El servidor guarda series sueltas; el front las agrupa por ejercicio (en orden de aparición). Todas cuentan como hechas. */
export function toSession(w: WorkoutRecord): Session {
  const groups = new Map<string, LoggedExercise>()
  for (const s of w.sets) {
    const group = groups.get(s.exerciseId) ?? { exerciseId: s.exerciseId, restSec: 0, sets: [] }
    group.sets.push({ reps: s.reps, weight: s.weightKg, done: true, ...(s.rpe === null ? {} : { rpe: s.rpe }) })
    groups.set(s.exerciseId, group)
  }
  return {
    id: w.id,
    routineId: w.routineId ?? '',
    routineName: w.routineName,
    startedAt: w.startedAt,
    finishedAt: w.finishedAt,
    exercises: [...groups.values()],
  }
}

/** Solo viajan las series completadas, numeradas por ejercicio. */
export function toWorkoutInput(s: Session): WorkoutInput {
  return {
    id: s.id,
    routineId: s.routineId === '' ? null : s.routineId,
    routineName: s.routineName,
    startedAt: s.startedAt,
    finishedAt: s.finishedAt,
    sets: s.exercises.flatMap((e) =>
      e.sets
        .filter((x) => x.done)
        .map((x, i) => ({ exerciseId: e.exerciseId, setNumber: i + 1, weightKg: x.weight, reps: x.reps, rpe: x.rpe ?? null })),
    ),
  }
}
