import "server-only";
import type { Pool, PoolClient } from "pg";
import type { Queryable } from "./exercises";

export type RoutineType = "hipertrofia" | "estres_metabolico";

export interface RoutineExerciseRecord {
  id: string;
  exerciseId: string;
  position: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  weightKg: number | null;
  restSeconds: number;
}

export interface RoutineDayRecord {
  id: string;
  position: number;
  name: string;
  weekday: number | null;
  exercises: RoutineExerciseRecord[];
}

export interface RoutineRecord {
  id: string;
  name: string;
  type: RoutineType;
  createdAt: string;
  updatedAt: string;
  days: RoutineDayRecord[];
}

export interface NewRoutineExercise {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  weightKg?: number | null;
  restSeconds: number;
}

export interface NewRoutineDay {
  name: string;
  weekday?: number | null;
  exercises: NewRoutineExercise[];
}

export interface NewRoutine {
  id?: string;
  name: string;
  type: RoutineType;
  days: NewRoutineDay[];
}

interface RoutineRow {
  id: string;
  name: string;
  type: RoutineType;
  created_at: Date;
  updated_at: Date;
}
interface DayRow {
  id: string;
  routine_id: string;
  position: number;
  name: string;
  weekday: number | null;
}
interface ExerciseRow {
  id: string;
  routine_day_id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  weight_kg: string | null;
  rest_seconds: number;
}

async function loadRoutines(db: Queryable, id: string | null): Promise<RoutineRecord[]> {
  const filter = id === null ? "" : "where id = $1";
  const params = id === null ? [] : [id];
  const routines = await db.query<RoutineRow>(
    `select id, name, type, created_at, updated_at from routines ${filter} order by created_at, id`,
    params,
  );
  if (routines.rows.length === 0) return [];
  const ids = routines.rows.map((r) => r.id);
  const days = await db.query<DayRow>(
    "select id, routine_id, position, name, weekday from routine_days where routine_id = any($1::uuid[]) order by position",
    [ids],
  );
  const exercises = await db.query<ExerciseRow>(
    `select re.id, re.routine_day_id, re.exercise_id, re.position, re.sets, re.reps_min, re.reps_max, re.weight_kg, re.rest_seconds
     from routine_exercises re join routine_days d on d.id = re.routine_day_id
     where d.routine_id = any($1::uuid[]) order by re.position`,
    [ids],
  );
  return routines.rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
    days: days.rows
      .filter((d) => d.routine_id === r.id)
      .map((d) => ({
        id: d.id,
        position: d.position,
        name: d.name,
        weekday: d.weekday,
        exercises: exercises.rows
          .filter((e) => e.routine_day_id === d.id)
          .map((e) => ({
            id: e.id,
            exerciseId: e.exercise_id,
            position: e.position,
            sets: e.sets,
            repsMin: e.reps_min,
            repsMax: e.reps_max,
            weightKg: e.weight_kg === null ? null : Number(e.weight_kg),
            restSeconds: e.rest_seconds,
          })),
      })),
  }));
}

export function listRoutines(db: Queryable): Promise<RoutineRecord[]> {
  return loadRoutines(db, null);
}

export async function getRoutine(db: Queryable, id: string): Promise<RoutineRecord | null> {
  return (await loadRoutines(db, id))[0] ?? null;
}

async function insertDays(client: PoolClient, routineId: string, days: NewRoutineDay[]): Promise<void> {
  for (const [dayPos, day] of days.entries()) {
    const d = await client.query<{ id: string }>(
      "insert into routine_days (routine_id, position, name, weekday) values ($1, $2, $3, $4) returning id",
      [routineId, dayPos, day.name, day.weekday ?? null],
    );
    for (const [pos, ex] of day.exercises.entries()) {
      await client.query(
        `insert into routine_exercises (routine_day_id, exercise_id, position, sets, reps_min, reps_max, weight_kg, rest_seconds)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [d.rows[0].id, ex.exerciseId, pos, ex.sets, ex.repsMin, ex.repsMax, ex.weightKg ?? null, ex.restSeconds],
      );
    }
  }
}

async function inTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export function createRoutine(pool: Pool, input: NewRoutine): Promise<RoutineRecord> {
  return inTransaction(pool, async (client) => {
    const r = await client.query<{ id: string }>(
      "insert into routines (id, name, type) values (coalesce($1::uuid, gen_random_uuid()), $2, $3) returning id",
      [input.id ?? null, input.name, input.type],
    );
    await insertDays(client, r.rows[0].id, input.days);
    return (await loadRoutines(client, r.rows[0].id))[0];
  });
}

/** Reemplaza nombre, tipo, días y ejercicios. Devuelve null si la rutina no existe. */
export function updateRoutine(pool: Pool, id: string, input: NewRoutine): Promise<RoutineRecord | null> {
  return inTransaction(pool, async (client) => {
    const r = await client.query(
      "update routines set name = $2, type = $3, updated_at = now() where id = $1",
      [id, input.name, input.type],
    );
    if ((r.rowCount ?? 0) === 0) return null;
    await client.query("delete from routine_days where routine_id = $1", [id]);
    await insertDays(client, id, input.days);
    return (await loadRoutines(client, id))[0];
  });
}

export async function deleteRoutine(db: Queryable, id: string): Promise<boolean> {
  const res = await db.query("delete from routines where id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}
