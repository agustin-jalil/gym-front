import type { Exercise, GymState, Routine, RoutineExercise } from './types'

/** Catálogo inicial. El usuario puede sumar los suyos desde /ejercicios. */
export const SEED_EXERCISES: Exercise[] = [
  { id: 'press-banca', name: 'Press de banca', muscle: 'pecho' },
  { id: 'press-inclinado', name: 'Press inclinado con mancuernas', muscle: 'pecho' },
  { id: 'aperturas', name: 'Aperturas con mancuernas', muscle: 'pecho' },
  { id: 'fondos', name: 'Fondos en paralelas', muscle: 'pecho' },
  { id: 'cruces-polea', name: 'Cruces en polea', muscle: 'pecho' },

  { id: 'dominadas', name: 'Dominadas', muscle: 'espalda' },
  { id: 'remo-barra', name: 'Remo con barra', muscle: 'espalda' },
  { id: 'jalon', name: 'Jalón al pecho', muscle: 'espalda' },
  { id: 'remo-mancuerna', name: 'Remo con mancuerna', muscle: 'espalda' },
  { id: 'peso-muerto', name: 'Peso muerto', muscle: 'espalda' },

  { id: 'sentadilla', name: 'Sentadilla', muscle: 'piernas' },
  { id: 'prensa', name: 'Prensa de piernas', muscle: 'piernas' },
  { id: 'zancadas', name: 'Zancadas', muscle: 'piernas' },
  { id: 'peso-muerto-rumano', name: 'Peso muerto rumano', muscle: 'piernas' },
  { id: 'extension-cuadriceps', name: 'Extensión de cuádriceps', muscle: 'piernas' },
  { id: 'curl-femoral', name: 'Curl femoral', muscle: 'piernas' },
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'piernas' },
  { id: 'elevacion-gemelos', name: 'Elevación de gemelos', muscle: 'piernas' },

  { id: 'press-militar', name: 'Press militar', muscle: 'hombros' },
  { id: 'elevaciones-laterales', name: 'Elevaciones laterales', muscle: 'hombros' },
  { id: 'pajaros', name: 'Pájaros', muscle: 'hombros' },
  { id: 'face-pull', name: 'Face pull', muscle: 'hombros' },

  { id: 'curl-biceps', name: 'Curl de bíceps', muscle: 'brazos' },
  { id: 'curl-martillo', name: 'Curl martillo', muscle: 'brazos' },
  { id: 'triceps-polea', name: 'Extensión de tríceps en polea', muscle: 'brazos' },
  { id: 'press-frances', name: 'Press francés', muscle: 'brazos' },

  { id: 'crunch', name: 'Crunch abdominal', muscle: 'core' },
  { id: 'elevacion-piernas', name: 'Elevación de piernas', muscle: 'core' },
  { id: 'rueda-abdominal', name: 'Rueda abdominal', muscle: 'core' },
]

const ex = (exerciseId: string, sets: number, reps: number, weight: number, restSec = 90): RoutineExercise => ({
  exerciseId,
  sets,
  reps,
  weight,
  restSec,
})

const SEED_ROUTINES: Omit<Routine, 'createdAt'>[] = [
  {
    id: 'seed-push',
    name: 'Empuje',
    days: [1, 4],
    exercises: [
      ex('press-banca', 4, 8, 60, 120),
      ex('press-inclinado', 3, 10, 20),
      ex('press-militar', 3, 10, 30),
      ex('elevaciones-laterales', 3, 15, 8, 60),
      ex('triceps-polea', 3, 12, 25, 60),
    ],
  },
  {
    id: 'seed-pull',
    name: 'Tirón',
    days: [2, 5],
    exercises: [
      ex('dominadas', 4, 6, 0, 120),
      ex('remo-barra', 4, 8, 50),
      ex('jalon', 3, 10, 45),
      ex('face-pull', 3, 15, 20, 60),
      ex('curl-biceps', 3, 12, 15, 60),
    ],
  },
  {
    id: 'seed-legs',
    name: 'Piernas',
    days: [3, 6],
    exercises: [
      ex('sentadilla', 4, 8, 70, 150),
      ex('prensa', 3, 12, 120),
      ex('peso-muerto-rumano', 3, 10, 60),
      ex('curl-femoral', 3, 12, 35, 60),
      ex('elevacion-gemelos', 4, 15, 40, 60),
    ],
  },
]

export function emptyState(): GymState {
  return { exercises: SEED_EXERCISES, routines: [], sessions: [], draft: null }
}

/** Primer uso: catálogo + tres rutinas de ejemplo (se pueden editar o borrar). */
export function seedState(): GymState {
  const now = new Date().toISOString()
  return {
    exercises: SEED_EXERCISES,
    routines: SEED_ROUTINES.map((r) => ({ ...r, createdAt: now })),
    sessions: [],
    draft: null,
  }
}
