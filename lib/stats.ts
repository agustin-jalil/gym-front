import type { Session } from './types'

/** Volumen = suma de repeticiones × peso de las series completadas. */
export function sessionVolume(s: Session) {
  return s.exercises.reduce(
    (acc, e) => acc + e.sets.reduce((a, set) => (set.done ? a + set.reps * set.weight : a), 0),
    0,
  )
}

export function sessionSets(s: Session) {
  return s.exercises.reduce((acc, e) => acc + e.sets.filter((x) => x.done).length, 0)
}

/** Fórmula de Epley para estimar el máximo de una repetición. */
export const est1RM = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30))

/** Lunes 00:00 de la semana de `d`. */
export function weekStart(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const diff = (x.getDay() + 6) % 7 // lunes = 0
  x.setDate(x.getDate() - diff)
  return x
}

const WEEK_MS = 7 * 24 * 3600 * 1000

export function sessionsThisWeek(sessions: Session[], now = new Date()) {
  const start = weekStart(now).getTime()
  return sessions.filter((s) => new Date(s.finishedAt).getTime() >= start)
}

/** Volumen por semana, de la más vieja a la actual. */
export function weeklyVolume(sessions: Session[], weeks = 8, now = new Date()) {
  const current = weekStart(now).getTime()
  const out = Array.from({ length: weeks }, (_, i) => {
    const start = current - (weeks - 1 - i) * WEEK_MS
    return { start, volume: 0 }
  })
  for (const s of sessions) {
    const idx = Math.floor((weekStart(new Date(s.finishedAt)).getTime() - out[0].start) / WEEK_MS)
    if (idx >= 0 && idx < weeks) out[idx].volume += sessionVolume(s)
  }
  return out
}

/** Semanas seguidas con al menos un entrenamiento (la semana actual cuenta si ya entrenó; si no, no corta la racha). */
export function streakWeeks(sessions: Session[], now = new Date()) {
  const weeks = new Set(sessions.map((s) => weekStart(new Date(s.finishedAt)).getTime()))
  let cursor = weekStart(now).getTime()
  if (!weeks.has(cursor)) cursor -= WEEK_MS
  let n = 0
  while (weeks.has(cursor)) {
    n++
    cursor -= WEEK_MS
  }
  return n
}

export interface ExercisePoint {
  date: string
  topWeight: number
  e1rm: number
  volume: number
}

/** Historia de un ejercicio, de la sesión más vieja a la más nueva. */
export function exerciseHistory(sessions: Session[], exerciseId: string): ExercisePoint[] {
  const pts: ExercisePoint[] = []
  for (const s of sessions) {
    const done = s.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((x) => x.done))
    if (done.length === 0) continue
    pts.push({
      date: s.finishedAt,
      topWeight: Math.max(...done.map((x) => x.weight)),
      e1rm: Math.max(...done.map((x) => est1RM(x.weight, x.reps))),
      volume: done.reduce((a, x) => a + x.reps * x.weight, 0),
    })
  }
  return pts.sort((a, b) => a.date.localeCompare(b.date))
}

/** Último registro de un ejercicio (para sugerir pesos y mostrar "última vez"). */
export function lastTime(sessions: Session[], exerciseId: string) {
  const sorted = [...sessions].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  for (const s of sorted) {
    const e = s.exercises.find((x) => x.exerciseId === exerciseId)
    const sets = e?.sets.filter((x) => x.done)
    if (sets && sets.length > 0) return sets
  }
  return null
}
