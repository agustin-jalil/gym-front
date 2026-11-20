import "server-only";
import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { planLegacyImport, type IdFor, type ImportPlan } from "../legacy-import.ts";
import { inTransaction, insertDays } from "./routines.ts";

/** uuid determinista (misma entrada → mismo id): importar dos veces el mismo respaldo no duplica nada. */
export const legacyIdFor: IdFor = (kind, legacyId) => {
  const h = createHash("sha1").update(`gym:v1:${kind}:${legacyId}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

export interface ImportResult {
  exercises: number;
  routines: number;
  workouts: number;
  /** Ya estaban en la base, estaban dañados o referían algo que ya no existe. */
  skipped: number;
}

async function existing(client: Pick<Pool, "query">, table: "exercises" | "routines" | "workouts", ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const res = await client.query<{ id: string }>(`select id from ${table} where id = any($1::uuid[])`, [ids]);
  return new Set(res.rows.map((r) => r.id));
}

/** Inserta lo que falte, todo o nada. Idempotente: lo que ya existe (por id) se cuenta como omitido. */
export function importPlan(pool: Pool, plan: ImportPlan): Promise<ImportResult> {
  return inTransaction(pool, async (client) => {
    const result: ImportResult = { exercises: 0, routines: 0, workouts: 0, skipped: plan.skipped };

    const haveEx = await existing(client, "exercises", plan.exercises.map((e) => e.id));
    for (const e of plan.exercises) {
      if (haveEx.has(e.id)) {
        result.skipped++;
        continue;
      }
      await client.query("insert into exercises (id, name, muscle_group, equipment, is_custom) values ($1, $2, $3, $4, true)", [
        e.id, e.name, e.muscleGroup, e.equipment,
      ]);
      result.exercises++;
    }

    const haveRoutines = await existing(client, "routines", plan.routines.map((r) => r.id));
    for (const r of plan.routines) {
      if (haveRoutines.has(r.id)) {
        result.skipped++;
        continue;
      }
      await client.query("insert into routines (id, name, type) values ($1, $2, $3)", [r.id, r.name, r.type]);
      await insertDays(client, r.id, r.days);
      result.routines++;
    }

    const allEx = await existing(client, "exercises", [...new Set(plan.workouts.flatMap((w) => w.sets.map((s) => s.exerciseId)))]);
    const allRoutines = await existing(client, "routines", plan.workouts.flatMap((w) => (w.routineId ? [w.routineId] : [])));
    const haveWorkouts = await existing(client, "workouts", plan.workouts.map((w) => w.id));
    for (const w of plan.workouts) {
      const sets = w.sets.filter((s) => allEx.has(s.exerciseId));
      if (haveWorkouts.has(w.id) || sets.length === 0) {
        result.skipped++;
        continue;
      }
      await client.query(
        "insert into workouts (id, routine_id, routine_name, started_at, finished_at) values ($1, $2, $3, $4, $5)",
        [w.id, w.routineId && allRoutines.has(w.routineId) ? w.routineId : null, w.routineName, w.startedAt, w.finishedAt],
      );
      for (const s of sets) {
        await client.query(
          `insert into workout_sets (workout_id, exercise_id, set_number, weight_kg, reps, rpe, created_at)
           values ($1, $2, $3, $4, $5, $6, clock_timestamp())`,
          [w.id, s.exerciseId, s.setNumber, s.weightKg, s.reps, s.rpe],
        );
      }
      result.workouts++;
    }
    return result;
  });
}

export function importLegacyState(pool: Pool, raw: unknown): Promise<{ ok: true; result: ImportResult } | { ok: false; error: string }> {
  const plan = planLegacyImport(raw, legacyIdFor);
  if (!plan.ok) return Promise.resolve(plan);
  return importPlan(pool, plan.value).then((result) => ({ ok: true as const, result }));
}
