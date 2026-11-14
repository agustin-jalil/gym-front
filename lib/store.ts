'use client'

import { useSyncExternalStore } from 'react'
import type { Draft, Exercise, GymState, LoggedSet, MuscleGroup, Routine, RoutineExercise, Session } from './types'
import { emptyState } from './seed'
import { lastTime } from './stats'
import { fromLegacyId } from './legacy-ids'
import { toExercise, toRoutine, toRoutineInput } from './api-mappers'
import { uuid } from './uuid'
import { uid } from './utils'
import type { ExerciseRecord } from './server/exercises'
import type { RoutineRecord } from './server/routines'

/**
 * Rutinas y ejercicios viven en Postgres (vía /api). El historial y el entrenamiento en curso siguen en
 * localStorage (`gym:v1`) hasta que T6 los mueva a la base. Toda la app habla con `gym.*` y `useGym()`.
 * `gym:v1` conserva sus `exercises` y `routines` originales sin tocar: los usa la importación única (T7).
 */
const KEY = 'gym:v1'
const SYNC_DELAY_MS = 400

interface Snapshot {
  state: GymState
  /** true cuando rutinas y ejercicios ya llegaron del servidor. */
  hydrated: boolean
  /** No se pudieron cargar rutinas y ejercicios (solo tiene sentido mientras `hydrated` es false). */
  error: string | null
  /** Un cambio no se pudo guardar en el servidor; los datos se recargaron desde allá. */
  syncError: string | null
}

// En el servidor (y en la primera pasada del cliente) no hay datos: evita errores de hidratación.
const SERVER_SNAPSHOT: Snapshot = { state: emptyState(), hydrated: false, error: null, syncError: null }

let snap: Snapshot | null = null
let loading = false
const listeners = new Set<() => void>()

function isState(v: unknown): v is GymState {
  const s = v as GymState
  return !!s && Array.isArray(s.exercises) && Array.isArray(s.routines) && Array.isArray(s.sessions)
}

const migrateSession = (s: Session): Session => ({
  ...s,
  routineId: fromLegacyId(s.routineId),
  exercises: s.exercises.map((e) => ({ ...e, exerciseId: fromLegacyId(e.exerciseId) })),
})

const migrateDraft = (d: Draft | null | undefined): Draft | null =>
  d ? { ...d, routineId: fromLegacyId(d.routineId), exercises: d.exercises.map((e) => ({ ...e, exerciseId: fromLegacyId(e.exerciseId) })) } : null

function readRaw(): GymState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isState(parsed)) return { ...parsed, draft: parsed.draft ?? null }
    }
  } catch {
    /* almacenamiento bloqueado o dañado: se arranca de cero */
  }
  return null
}

function readLocal(): Pick<GymState, 'sessions' | 'draft'> {
  const raw = readRaw()
  return { sessions: (raw?.sessions ?? []).map(migrateSession), draft: migrateDraft(raw?.draft) }
}

function writeLocal(sessions: Session[], draft: Draft | null) {
  const raw = readRaw()
  try {
    localStorage.setItem(KEY, JSON.stringify({ exercises: raw?.exercises ?? [], routines: raw?.routines ?? [], sessions, draft }))
  } catch {
    /* sin espacio o bloqueado: la sesión sigue en memoria */
  }
}

function notify() {
  listeners.forEach((l) => l())
}

function getSnapshot(): Snapshot {
  if (!snap) snap = { ...SERVER_SNAPSHOT, state: { ...emptyState(), ...readLocal() } }
  return snap
}

function setSnap(patch: Partial<Snapshot>) {
  snap = { ...getSnapshot(), ...patch }
  notify()
}

function setState(next: GymState, persist = false) {
  setSnap({ state: next })
  if (persist) writeLocal(next.sessions, next.draft)
}

/** Cambia rutinas/ejercicios en memoria; el guardado en el servidor lo programa quien llama. */
const updateRemote = (fn: (s: GymState) => GymState) => setState(fn(getSnapshot().state))
/** Cambia historial/entrenamiento en curso: se guarda en localStorage. */
const updateLocal = (fn: (s: GymState) => GymState) => setState(fn(getSnapshot().state), true)

/* ───────────── Servidor ───────────── */

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }
  if (!res.ok) {
    let message = 'El servidor respondió con un error.'
    try {
      const body: unknown = await res.json()
      if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') message = body.error
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(message)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

async function load() {
  if (loading) return
  loading = true
  setSnap({ error: null })
  try {
    const [exercises, routines] = await Promise.all([
      api<ExerciseRecord[]>('/api/exercises'),
      api<RoutineRecord[]>('/api/routines'),
    ])
    setSnap({ state: { ...getSnapshot().state, exercises: exercises.map(toExercise), routines: routines.map(toRoutine) }, hydrated: true })
  } catch (e) {
    setSnap({ error: e instanceof Error ? e.message : 'No se pudieron cargar los datos.' })
  } finally {
    loading = false
  }
}

/** Escrituras al servidor en orden (crear antes de editar antes de borrar). Si una falla, se recarga lo que hay allá. */
let chain: Promise<void> = Promise.resolve()
function enqueue(task: () => Promise<unknown>) {
  chain = chain.then(task).then(
    () => undefined,
    (e: unknown) => {
      setSnap({ syncError: e instanceof Error ? e.message : 'No se pudo guardar el cambio.' })
      void load()
    },
  )
}

const pendingSync = new Map<string, ReturnType<typeof setTimeout>>()

function putRoutine(id: string) {
  const routine = getSnapshot().state.routines.find((r) => r.id === id)
  if (routine) enqueue(() => api(`/api/routines/${id}`, { method: 'PUT', body: JSON.stringify(toRoutineInput(routine)) }))
}

/** Agrupa los cambios seguidos de una rutina (teclear un número, etc.) en un solo guardado. */
function scheduleRoutineSync(id: string) {
  clearTimeout(pendingSync.get(id))
  pendingSync.set(
    id,
    setTimeout(() => {
      pendingSync.delete(id)
      putRoutine(id)
    }, SYNC_DELAY_MS),
  )
}

function flushPending() {
  for (const [id, timer] of pendingSync) {
    clearTimeout(timer)
    pendingSync.delete(id)
    putRoutine(id)
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!snap?.hydrated) void load()
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      setSnap({ state: { ...getSnapshot().state, ...readLocal() } }) // otra pestaña escribió
    }
  }
  const onHide = () => flushPending()
  window.addEventListener('storage', onStorage)
  window.addEventListener('pagehide', onHide)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('pagehide', onHide)
  }
}

export function useGym() {
  const s = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  return { ...s.state, hydrated: s.hydrated, error: s.error, syncError: s.syncError }
}

/* ───────────── Acciones ───────────── */

const patchDraft = (fn: (d: Draft) => Draft) =>
  updateLocal((s) => (s.draft ? { ...s, draft: fn(s.draft) } : s))

const mapRoutine = (routineId: string, fn: (r: Routine) => Routine) =>
  updateRemote((s) => ({ ...s, routines: s.routines.map((r) => (r.id === routineId ? fn(r) : r)) }))

/** Edita una rutina en memoria y programa el guardado en el servidor. */
function editRoutine(routineId: string, fn: (r: Routine) => Routine) {
  mapRoutine(routineId, fn)
  scheduleRoutineSync(routineId)
}

export const gym = {
  /** Vuelve a pedir rutinas y ejercicios al servidor (tras un error de carga). */
  reload() {
    setSnap({ syncError: null })
    void load()
  },
  dismissSyncError() {
    setSnap({ syncError: null })
  },

  /* Rutinas */
  createRoutine(): string {
    const id = uuid()
    const routine: Routine = {
      id,
      name: 'Nueva rutina',
      type: 'hipertrofia',
      days: [],
      exercises: [],
      createdAt: new Date().toISOString(),
    }
    updateRemote((s) => ({ ...s, routines: [routine, ...s.routines] }))
    enqueue(() => api('/api/routines', { method: 'POST', body: JSON.stringify(toRoutineInput(routine)) }))
    return id
  },
  updateRoutine(id: string, patch: Partial<Omit<Routine, 'id' | 'createdAt'>>) {
    editRoutine(id, (r) => ({ ...r, ...patch }))
  },
  deleteRoutine(id: string) {
    clearTimeout(pendingSync.get(id))
    pendingSync.delete(id)
    updateLocal((s) => ({
      ...s,
      routines: s.routines.filter((r) => r.id !== id),
      draft: s.draft?.routineId === id ? null : s.draft,
    }))
    enqueue(() => api(`/api/routines/${id}`, { method: 'DELETE' }))
  },
  addRoutineExercise(routineId: string, exerciseId: string) {
    const item: RoutineExercise = { exerciseId, sets: 3, reps: 10, weight: 0, restSec: 90 }
    editRoutine(routineId, (r) => ({ ...r, exercises: [...r.exercises, item] }))
  },
  updateRoutineExercise(routineId: string, index: number, patch: Partial<RoutineExercise>) {
    editRoutine(routineId, (r) => ({ ...r, exercises: r.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)) }))
  },
  moveRoutineExercise(routineId: string, index: number, dir: -1 | 1) {
    editRoutine(routineId, (r) => {
      const to = index + dir
      if (to < 0 || to >= r.exercises.length) return r
      const list = [...r.exercises]
      ;[list[index], list[to]] = [list[to], list[index]]
      return { ...r, exercises: list }
    })
  },
  removeRoutineExercise(routineId: string, index: number) {
    editRoutine(routineId, (r) => ({ ...r, exercises: r.exercises.filter((_, i) => i !== index) }))
  },

  /* Catálogo */
  addExercise(name: string, muscle: MuscleGroup) {
    const ex: Exercise = { id: uuid(), name: name.trim(), muscle, custom: true }
    updateRemote((s) => ({ ...s, exercises: [...s.exercises, ex] }))
    enqueue(() => api('/api/exercises', { method: 'POST', body: JSON.stringify({ id: ex.id, name: ex.name, muscleGroup: muscle }) }))
  },
  deleteExercise(id: string) {
    updateRemote((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) }))
    enqueue(() => api(`/api/exercises/${id}`, { method: 'DELETE' }))
  },

  /* Entrenamiento en curso */
  startWorkout(routineId: string) {
    updateLocal((s) => {
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
    updateLocal((s) => ({ ...s, draft: null }))
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
    updateLocal((s) => ({ ...s, sessions: [session, ...s.sessions], draft: null }))
    return session.id
  },

  /* Historial */
  deleteSession(id: string) {
    updateLocal((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }))
  },

  /* Datos */
  exportJson(): string {
    return JSON.stringify(getSnapshot().state, null, 2)
  },
  /**
   * Restaura el historial y el entrenamiento en curso de un respaldo. Las rutinas y ejercicios viven en el
   * servidor y no se tocan (la importación a la base llega en T7). Devuelve false si el archivo no es válido.
   */
  importJson(text: string): boolean {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!isState(parsed)) return false
      updateLocal((s) => ({ ...s, sessions: parsed.sessions.map(migrateSession), draft: migrateDraft(parsed.draft) }))
      return true
    } catch {
      return false
    }
  },
  /** Borra el historial y el entrenamiento en curso de este dispositivo. Rutinas y ejercicios no se tocan. */
  reset() {
    updateLocal((s) => ({ ...s, sessions: [], draft: null }))
  },
}
