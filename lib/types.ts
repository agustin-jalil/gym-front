export type MuscleGroup = 'pecho' | 'espalda' | 'piernas' | 'hombros' | 'brazos' | 'core'

export interface Exercise {
  id: string
  name: string
  muscle: MuscleGroup
  custom?: boolean
}

/** Un ejercicio dentro de una rutina: lo que se planea hacer. */
export interface RoutineExercise {
  exerciseId: string
  sets: number
  reps: number
  weight: number
  restSec: number
}

export interface Routine {
  id: string
  name: string
  /** Días de la semana en que toca (0 = domingo … 6 = sábado). */
  days: number[]
  exercises: RoutineExercise[]
  createdAt: string
}

/** Una serie registrada durante un entrenamiento. */
export interface LoggedSet {
  reps: number
  weight: number
  done: boolean
}

export interface LoggedExercise {
  exerciseId: string
  restSec: number
  sets: LoggedSet[]
}

/** Entrenamiento en curso (se guarda para no perderlo al recargar). */
export interface Draft {
  routineId: string
  routineName: string
  startedAt: string
  exercises: LoggedExercise[]
}

/** Entrenamiento terminado. Solo conserva las series completadas. */
export interface Session {
  id: string
  routineId: string
  routineName: string
  startedAt: string
  finishedAt: string
  exercises: LoggedExercise[]
}

export interface GymState {
  exercises: Exercise[]
  routines: Routine[]
  sessions: Session[]
  draft: Draft | null
}
