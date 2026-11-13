'use client'

import { useSyncExternalStore } from 'react'
import type { Draft, Exercise, GymState, LoggedSet, MuscleGroup, Routine, RoutineExercise, Session } from './types'
import { emptyState, seedState } from './seed'
import { lastTime } from './stats'
import { uid } from './utils'

/**
 * Almacenamiento local (localStorage). Toda la app habla con `gym.*` y `useGym()`:
 * para pasar a un backend solo hay que reemplazar este archivo, las pantallas no cambian.
 */
const KEY = 'gym:v1'

interface Snapshot {
  state: GymState
  hydrated: boolean
}

// En el servidor (y en la primera pasada del cliente) no hay datos: evita errores de hidratación.
const SERVER_SNAPSHOT: Snapshot = { state: emptyState(), hydrated: false }

let snap: Snapshot | null = null
const listeners = new Set<() => void>()

function isState(v: unknown): v is GymState {
  const s = v as GymState
  return !!s && Array.isArray(s.exercises) && Array.isArray(s.routines) && Array.isArray(s.sessions)
}

function read(): GymState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isState(parsed)) return { ...parsed, draft: parsed.draft ?? null }
    }
  } catch {
    /* almacenamiento bloqueado o dañado: se arranca de cero */
  }
  return seedState()
}

function notify() {
  listeners.forEach((l) => l())
}

function getSnapshot(): Snapshot {
  if (!snap) snap = { state: read(), hydrated: true }
  return snap
}

function commit(next: GymState) {
  snap = { state: next, hydrated: true }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* sin espacio o bloqueado: la sesión sigue en memoria */
  }
  notify()
}

function update(fn: (s: GymState) => GymState) {
  commit(fn(getSnapshot().state))
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      snap = null // otra pestaña escribió: se vuelve a leer
      notify()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useGym() {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  return { ...s.state, hydrated: s.hydrated }
}

/* ───────────── Acciones ───────────── */

const patchDraft = (fn: (d: Draft) => Draft) =>
  update((s) => (s.draft ? { ...s, draft: fn(s.draft) } : s))

export const gym = {
  /* Rutinas */
  createRoutine(): string {
    const id = uid()
    const routine: Routine = { id, name: 'Nueva rutina', days: [], exercises: [], createdAt: new Date().toISOString() }
    update((s) => ({ ...s, routines: [routine, ...s.routines] }))
    return id
  },
  updateRoutine(id: string, patch: Partial<Omit<Routine, 'id' | 'createdAt'>>) {
    update((s) => ({ ...s, routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  },
  deleteRoutine(id: string) {
    update((s) => ({
      ...s,
      routines: s.routines.filter((r) => r.id !== id),
      draft: s.draft?.routineId === id ? null : s.draft,
    }))
  },
  addRoutineExercise(routineId: string, exerciseId: string) {
    const item: RoutineExercise = { exerciseId, sets: 3, reps: 10, weight: 0, restSec: 90 }
    update((s) => ({
      ...s,
      routines: s.routines.map((r) => (r.id === routineId ? { ...r, exercises: [...r.exercises, item] } : r)),
    }))
  },
  updateRoutineExercise(routineId: string, index: number, patch: Partial<RoutineExercise>) {
    update((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId
          ? { ...r, exercises: r.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)) }
          : r,
      ),
    }))
  },
  moveRoutineExercise(routineId: string, index: number, dir: -1 | 1) {
    update((s) => ({
      ...s,
      routines: s.routines.map((r) => {
        const to = index + dir
        if (r.id !== routineId || to < 0 || to >= r.exercises.length) return r
        const list = [...r.exercises]
        ;[list[index], list[to]] = [list[to], list[index]]
        return { ...r, exercises: list }
      }),
    }))
  },
  removeRoutineExercise(routineId: string, index: number) {
    update((s) => ({
      ...s,
      routines: s.routines.map((r) =>
        r.id === routineId ? { ...r, exercises: r.exercises.filter((_, i) => i !== index) } : r,
      ),
    }))
  },

  /* Catálogo */
  addExercise(name: string, muscle: MuscleGroup) {
    const ex: Exercise = { id: uid(), name: name.trim(), muscle, custom: true }
    update((s) => ({ ...s, exercises: [...s.exercises, ex] }))
  },
  deleteExercise(id: string) {
    update((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) }))
  },

  /* Entrenamiento en curso */
  startWorkout(routineId: string) {
    update((s) => {
      const routine = s.routines.find((r) => r.id === routineId)
      if (!routine) return s
      const draft: Draft = {
        routineId,
        routineName: routine.name,
        startedAt: new Date().toISOString(),
        exercises: routine.exercises.map((e) => {
          const last = lastTime(s.sessions, e.exerciseId)
          return {
            exerciseId: e.exerciseId,
            restSec: e.restSec,
            // Sugiere lo que levantaste la última vez; si no hay historia, lo planeado en la rutina.
            sets: Array.from({ length: e.sets }, (_, i): LoggedSet => {
              const prev = last?.[Math.min(i, last.length - 1)]
              return { reps: prev?.reps ?? e.reps, weight: prev?.weight ?? e.weight, done: false }
            }),
          }
        }),
      }
      return { ...s, draft }
    })
  },
  updateSet(exIndex: number, setIndex: number, patch: Partial<LoggedSet>) {
    patchDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e, i) =>
        i === exIndex ? { ...e, sets: e.sets.map((x, j) => (j === setIndex ? { ...x, ...patch } : x)) } : e,
      ),
    }))
  },
  addSet(exIndex: number) {
    patchDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e, i) => {
        if (i !== exIndex) return e
        const last = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, { reps: last?.reps ?? 10, weight: last?.weight ?? 0, done: false }] }
      }),
    }))
  },
  removeSet(exIndex: number, setIndex: number) {
    patchDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e, i) =>
        i === exIndex ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) } : e,
      ),
    }))
  },
  discardWorkout() {
    update((s) => ({ ...s, draft: null }))
  },
  /** Guarda el entrenamiento con las series completadas. Devuelve null si no había ninguna. */
  finishWorkout(): string | null {
    const { draft } = getSnapshot().state
    if (!draft) return null
    const exercises = draft.exercises
      .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
      .filter((e) => e.sets.length > 0)
    if (exercises.length === 0) return null
    const session: Session = {
      id: uid(),
      routineId: draft.routineId,
      routineName: draft.routineName,
      startedAt: draft.startedAt,
      finishedAt: new Date().toISOString(),
      exercises,
    }
    update((s) => ({ ...s, sessions: [session, ...s.sessions], draft: null }))
    return session.id
  },

  /* Historial */
  deleteSession(id: string) {
    update((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }))
  },

  /* Datos */
  exportJson(): string {
    return JSON.stringify(getSnapshot().state, null, 2)
  },
  /** Reemplaza todo con el contenido de un respaldo. Devuelve false si el archivo no es válido. */
  importJson(text: string): boolean {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!isState(parsed)) return false
      commit({ ...parsed, draft: parsed.draft ?? null })
      return true
    } catch {
      return false
    }
  },
  reset() {
    commit(seedState())
  },
}
