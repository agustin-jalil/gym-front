import { ROUTINE_TYPES } from './routine-types.ts'
import type { RoutineType } from './types.ts'

export interface SetResult {
  reps: number
  weight: number
  rpe?: number
}

/** Una sesión de un ejercicio. `type` ausente = del mismo tipo que la rutina actual. */
export interface SessionSets {
  type?: RoutineType
  sets: SetResult[]
  /** Descanso usado entre series, en segundos. */
  restSec?: number
}

export interface SuggestInput {
  type: RoutineType
  /** Sesiones del ejercicio, de la más vieja a la más reciente. */
  history: SessionSets[]
  repsMin?: number
  repsMax?: number
  /** Incremento mínimo de carga en kg (2,5 barra; 1–2 mancuerna). */
  incrementKg?: number
  /** Series planeadas; si la última sesión hizo menos, se considera incompleta. */
  plannedSets?: number
}

export type SuggestionKind = 'first' | 'increase' | 'repeat' | 'rest' | 'deload' | 'type-change'

export interface Suggestion {
  kind: SuggestionKind
  /** kg sugeridos; null si no hay historial y la primera carga la elige el usuario. */
  weight: number | null
  reps: number
  restSec?: number
  reason: string
}

const RPE_LIMIT = 9
const INCREASE = 0.025
const REST_STEP = 5

export function roundToIncrement(value: number, increment: number): number {
  return Number((Math.round(value / increment) * increment).toFixed(6))
}

interface Clean {
  type: RoutineType | undefined
  restSec: number | undefined
  sets: SetResult[]
  weight: number
  minReps: number
  hardRpe: boolean
}

function clean(s: SessionSets): Clean | null {
  const sets = s.sets.filter(
    (x) => Number.isFinite(x.reps) && x.reps > 0 && Number.isFinite(x.weight) && x.weight >= 0,
  )
  if (sets.length === 0) return null
  return {
    type: s.type,
    restSec: s.restSec,
    sets,
    weight: Math.max(...sets.map((x) => x.weight)),
    minReps: Math.min(...sets.map((x) => x.reps)),
    hardRpe: sets.some((x) => x.rpe !== undefined && x.rpe > RPE_LIMIT),
  }
}

export function suggestLoad(input: SuggestInput): Suggestion {
  const spec = ROUTINE_TYPES[input.type]
  const repsMin = input.repsMin ?? spec.repsMin
  const repsMax = input.repsMax ?? spec.repsMax
  const inc = input.incrementKg !== undefined && input.incrementKg > 0 ? input.incrementKg : 2.5
  const sessions = input.history.map(clean).filter((s): s is Clean => s !== null)
  const last = sessions[sessions.length - 1]
  const metabolic = input.type === 'estres_metabolico'

  if (!last) {
    return { kind: 'first', weight: null, reps: repsMin, reason: 'Es la primera vez: elegí una carga con la que llegues al piso del rango.' }
  }

  if ((last.type ?? input.type) !== input.type) {
    return {
      kind: 'type-change',
      weight: last.weight,
      reps: repsMin,
      restSec: metabolic ? spec.restMax : spec.restDefault,
      reason: `Cambió el tipo de rutina: mantené ${last.weight} kg y empezá por ${repsMin} reps con el descanso del nuevo tipo.`,
    }
  }

  const complete = (s: Clean) => input.plannedSets === undefined || s.sets.length >= input.plannedSets
  if (!complete(last)) {
    return {
      kind: 'repeat',
      weight: last.weight,
      reps: Math.max(repsMin, last.minReps),
      restSec: last.restSec,
      reason: `Sesión incompleta (${last.sets.length} de ${input.plannedSets} series): repetí ${last.weight} kg sin cambios.`,
    }
  }

  const prev = sessions[sessions.length - 2]
  const below = (s: Clean | undefined) => s !== undefined && complete(s) && s.type === last.type && s.minReps < repsMin
  if (below(last) && below(prev)) {
    const pct = repsMin - last.minReps >= 3 ? 0.1 : 0.05
    const weight = Math.max(0, Math.min(roundToIncrement(last.weight * (1 - pct), inc), last.weight - inc))
    return {
      kind: 'deload',
      weight,
      reps: repsMin,
      reason: `Dos sesiones seguidas por debajo de ${repsMin} reps: bajá ${Math.round(pct * 100)} % la carga a ${weight} kg.`,
    }
  }

  const atTop = last.minReps >= repsMax
  if (!atTop || last.hardRpe) {
    const target = last.minReps < repsMin ? repsMin : atTop ? repsMax : last.minReps + 1
    const why = last.hardRpe
      ? `Llegaste al tope pero con RPE mayor a ${RPE_LIMIT}: repetí ${last.weight} kg.`
      : last.minReps < repsMin
        ? `Quedaste por debajo de ${repsMin} reps: repetí ${last.weight} kg y apuntá al piso.`
        : `Repetí ${last.weight} kg y apuntá a ${target} reps en todas las series.`
    return { kind: 'repeat', weight: last.weight, reps: target, restSec: last.restSec, reason: why }
  }

  if (metabolic) {
    const rest = last.restSec ?? spec.restMax
    if (rest > spec.restMin) {
      const next = Math.max(spec.restMin, rest - REST_STEP)
      return {
        kind: 'rest',
        weight: last.weight,
        reps: repsMax,
        restSec: next,
        reason: `Completaste ${repsMax} reps en todas las series: mantené ${last.weight} kg y bajá el descanso a ${next} s.`,
      }
    }
  }

  const weight = Math.max(roundToIncrement(last.weight * (1 + INCREASE), inc), last.weight + inc)
  return {
    kind: 'increase',
    weight,
    reps: repsMin,
    restSec: metabolic ? spec.restMax : last.restSec,
    reason: `Completaste ${repsMax} reps en todas las series${metabolic ? ' con el descanso mínimo' : ''}: subí a ${weight} kg y volvé a ${repsMin} reps.`,
  }
}
