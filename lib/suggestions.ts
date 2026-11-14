import { suggestLoad, type SessionSets, type Suggestion } from './progression.ts'
import type { RoutineType, Session } from './types.ts'

/** Sesiones del ejercicio (solo series hechas), de la más vieja a la más reciente, en el formato de `suggestLoad`. */
export function historyFor(sessions: readonly Session[], exerciseId: string): SessionSets[] {
  return [...sessions]
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .flatMap((s) => {
      const logged = s.exercises.filter((e) => e.exerciseId === exerciseId)
      const sets = logged.flatMap((e) => e.sets.filter((x) => x.done))
      if (sets.length === 0) return []
      return [
        {
          sets: sets.map((x) => ({ reps: x.reps, weight: x.weight, ...(x.rpe === undefined ? {} : { rpe: x.rpe }) })),
          restSec: logged[0]?.restSec,
        },
      ]
    })
}

export function suggestionFor(
  sessions: readonly Session[],
  exerciseId: string,
  type: RoutineType,
  plannedSets: number,
): Suggestion {
  return suggestLoad({ type, history: historyFor(sessions, exerciseId), plannedSets })
}
