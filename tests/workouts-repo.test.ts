import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { createExercise } from "../lib/server/exercises.ts";
import { createWorkout, deleteWorkout, getWorkout, listWorkouts } from "../lib/server/workouts.ts";
import { createRoutine, deleteRoutine } from "../lib/server/routines.ts";
import { parseWorkout, type WorkoutInput } from "../lib/workouts.ts";

const url = process.env.DATABASE_URL;
const skip = url ? false : "DATABASE_URL no definida";
const MISSING = "00000000-0000-0000-0000-000000000000";
const EX = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function input(extra: Record<string, unknown> = {}): WorkoutInput {
  const r = parseWorkout({
    routineName: "Empuje",
    startedAt: "2026-11-01T10:00:00.000Z",
    finishedAt: "2026-11-01T11:00:00.000Z",
    sets: [
      { exerciseId: EX, setNumber: 1, weightKg: 62.5, reps: 10, rpe: 8 },
      { exerciseId: EX, setNumber: 2, weightKg: 62.5, reps: 8 },
    ],
    ...extra,
  });
  assert.ok(r.ok);
  return r.value;
}

describe("repositorio de entrenamientos", { skip }, () => {
  let pool: Pool;
  before(async () => {
    pool = new Pool({ connectionString: url });
    await pool.query("truncate workouts, routines, exercises cascade");
    await createExercise(pool, { id: EX, name: "Press test" });
  });
  after(async () => {
    await pool.end();
  });

  test("crear y leer devuelve números y series en orden", async () => {
    const w = await createWorkout(pool, input());
    assert.equal(w.routineName, "Empuje");
    assert.deepEqual(w.sets.map((s) => [s.setNumber, s.weightKg, s.reps, s.rpe]), [[1, 62.5, 10, 8], [2, 62.5, 8, null]]);
    assert.equal(w.startedAt, "2026-11-01T10:00:00.000Z");
    assert.deepEqual(await getWorkout(pool, w.id), w);
    assert.equal(await getWorkout(pool, MISSING), null);
  });

  test("respeta el id del cliente y repetir el mismo id da conflicto (no duplica)", async () => {
    const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    await createWorkout(pool, input({ id }));
    await assert.rejects(createWorkout(pool, input({ id })), (e: { code?: string }) => e.code === "23505");
    const rows = await pool.query("select count(*)::int as n from workout_sets where workout_id = $1", [id]);
    assert.equal(rows.rows[0].n, 2);
  });

  test("lista del más reciente al más viejo", async () => {
    await createWorkout(pool, input({ startedAt: "2026-12-01T10:00:00.000Z", finishedAt: "2026-12-01T11:00:00.000Z" }));
    const list = await listWorkouts(pool);
    assert.ok(list.length >= 3);
    assert.ok(list[0].startedAt >= list[1].startedAt);
  });

  test("ejercicio inexistente falla y no deja el entrenamiento a medias", async () => {
    const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const bad = input({ id, sets: [{ exerciseId: MISSING, setNumber: 1, weightKg: 1, reps: 1 }] });
    await assert.rejects(createWorkout(pool, bad), (e: { code?: string }) => e.code === "23503");
    assert.equal(await getWorkout(pool, id), null);
  });

  test("borrar la rutina conserva el entrenamiento con su nombre", async () => {
    const r = await createRoutine(pool, { name: "Temporal", type: "hipertrofia", days: [] });
    const w = await createWorkout(pool, input({ routineId: r.id, routineName: "Temporal" }));
    assert.equal(w.routineId, r.id);
    await deleteRoutine(pool, r.id);
    const after = await getWorkout(pool, w.id);
    assert.equal(after?.routineId, null);
    assert.equal(after?.routineName, "Temporal");
  });

  test("borrar elimina también sus series", async () => {
    const w = await createWorkout(pool, input());
    assert.equal(await deleteWorkout(pool, w.id), true);
    assert.equal(await deleteWorkout(pool, w.id), false);
    const n = await pool.query("select count(*)::int as n from workout_sets where workout_id = $1", [w.id]);
    assert.equal(n.rows[0].n, 0);
  });
});
