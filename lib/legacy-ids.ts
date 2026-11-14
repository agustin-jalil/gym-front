import { SEED_EXERCISES, SEED_ROUTINES } from './seed.ts'

/** uuid estable para los datos de ejemplo de v0.1; la migración 0002 inserta exactamente estos. */
const seedUuid = (group: 1 | 2, index: number) =>
  `00000000-0000-4000-8000-00000000${group}${String(index + 1).padStart(3, '0')}`

export const SEED_EXERCISE_UUIDS = SEED_EXERCISES.map((_, i) => seedUuid(1, i))
export const SEED_ROUTINE_UUIDS = SEED_ROUTINES.map((_, i) => seedUuid(2, i))

const LEGACY = new Map<string, string>([
  ...SEED_EXERCISES.map((e, i): [string, string] => [e.id, SEED_EXERCISE_UUIDS[i]]),
  ...SEED_ROUTINES.map((r, i): [string, string] => [r.id, SEED_ROUTINE_UUIDS[i]]),
])

/** Traduce un id de `gym:v1` (p. ej. 'press-banca') al uuid de la base. Lo desconocido queda igual. */
export function fromLegacyId(id: string): string {
  return LEGACY.get(id) ?? id
}
