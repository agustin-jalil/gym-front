import "server-only";
import type { Pool } from "pg";
import type { Queryable } from "./exercises";
import { inTransaction } from "./routines.ts";
import type { WorkoutInput } from "../workouts.ts";

export interface WorkoutSetRecord {
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number | null;
}

export interface WorkoutRecord {
  id: string;
  routineId: string | null;
  routineName: string;
  startedAt: string;
  finishedAt: string;
  sets: WorkoutSetRecord[];
}

interface WorkoutRow {
  id: string;
  routine_id: string | null;
  routine_name: string | null;
  started_at: Date;
  finished_at: Date | null;
}
interface SetRow {
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
}

async function loadWorkouts(db: Queryable, id: string | null): Promise<WorkoutRecord[]> {
  const workouts = await db.query<WorkoutRow>(
    `select w.id, w.routine_id, coalesce(w.routine_name, r.name, 'Entrenamiento') as routine_name, w.started_at, w.finished_at
     from workouts w left join routines r on r.id = w.routine_id
     where ($1::uuid is null or w.id = $1::uuid)
     order by w.started_at desc, w.id`,
    [id],
  );
  if (workouts.rows.length === 0) return [];
  const sets = await db.query<SetRow>(
    `select workout_id, exercise_id, set_number, weight_kg::float8 as weight_kg, reps, rpe::float8 as rpe
     from workout_sets where workout_id = any($1::uuid[]) order by workout_id, created_at, set_number`,
    [workouts.rows.map((w) => w.id)],
  );
  return workouts.rows.map((w) => ({
    id: w.id,
    routineId: w.routine_id,
    routineName: w.routine_name ?? "Entrenamiento",
    startedAt: w.started_at.toISOString(),
    finishedAt: (w.finished_at ?? w.started_at).toISOString(),
    sets: sets.rows
      .filter((s) => s.workout_id === w.id)
      .map((s) => ({ exerciseId: s.exercise_id, setNumber: s.set_number, weightKg: s.weight_kg, reps: s.reps, rpe: s.rpe })),
  }));
}

export function listWorkouts(db: Queryable): Promise<WorkoutRecord[]> {
  return loadWorkouts(db, null);
}

export async function getWorkout(db: Queryable, id: string): Promise<WorkoutRecord | null> {
  return (await loadWorkouts(db, id))[0] ?? null;
}

/** Guarda el entrenamiento y todas sus series o nada. Repetir un id existente da conflicto (23505). */
export function createWorkout(pool: Pool, input: WorkoutInput): Promise<WorkoutRecord> {
  return inTransaction(pool, async (client) => {
    const w = await client.query<{ id: string }>(
      `insert into workouts (id, routine_id, routine_name, started_at, finished_at)
       values (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5) returning id`,
      [input.id ?? null, input.routineId, input.routineName, input.startedAt, input.finishedAt],
    );
    const id = w.rows[0].id;
    // created_at sigue el orden de las series dentro del entrenamiento (clock_timestamp avanza por fila).
    for (const s of input.sets) {
      await client.query(
        `insert into workout_sets (workout_id, exercise_id, set_number, weight_kg, reps, rpe, created_at)
         values ($1, $2, $3, $4, $5, $6, clock_timestamp())`,
        [id, s.exerciseId, s.setNumber, s.weightKg, s.reps, s.rpe],
      );
    }
    return (await loadWorkouts(client, id))[0];
  });
}

export async function deleteWorkout(db: Queryable, id: string): Promise<boolean> {
  const res = await db.query("delete from workouts where id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}
