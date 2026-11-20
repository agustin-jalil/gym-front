import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { importLegacyState } from "../lib/server/legacy-import.ts";
import { listExercises } from "../lib/server/exercises.ts";
import { listRoutines } from "../lib/server/routines.ts";
import { listWorkouts } from "../lib/server/workouts.ts";

const url = process.env.DATABASE_URL;
const skip = url ? false : "DATABASE_URL no definida";

const legacy = () => ({
  exercises: [{ id: "mi-ej", name: "Mi ejercicio", muscle: "core", custom: true }],
  routines: [{ id: "r1", name: "Mía", days: [1], createdAt: "2026-01-01T00:00:00Z", exercises: [{ exerciseId: "mi-ej", sets: 3, reps: 12, weight: 0, restSec: 60 }] }],
  sessions: [
    { id: "s1", routineId: "r1", routineName: "Mía", startedAt: "2026-02-01T10:00:00.000Z", finishedAt: "2026-02-01T11:00:00.000Z",
      exercises: [
        { exerciseId: "mi-ej", restSec: 60, sets: [{ reps: 12, weight: 0, done: true }, { reps: 10, weight: 0, done: true }] },
        { exerciseId: "press-banca", restSec: 90, sets: [{ reps: 8, weight: 60, done: true }] },
        { exerciseId: "ejercicio-borrado", restSec: 90, sets: [{ reps: 8, weight: 60, done: true }] },
      ] },
  ],
});

describe("importación de gym:v1", { skip }, () => {
  let pool: Pool;
  before(async () => {
    pool = new Pool({ connectionString: url });
    await pool.query("truncate workouts, routines, exercises cascade");
    // catálogo de ejemplo: press de banca con su uuid de semilla
    await pool.query("insert into exercises (id, name, muscle_group, is_custom) values ('00000000-0000-4000-8000-000000001001', 'Press de banca', 'pecho', false)");
  });
  after(async () => {
    await pool.end();
  });

  test("importa ejercicios, rutinas y entrenamientos; omite series de ejercicios que ya no existen", async () => {
    const res = await importLegacyState(pool, legacy());
    assert.ok(res.ok);
    assert.deepEqual([res.result.exercises, res.result.routines, res.result.workouts], [1, 1, 1]);
    const [w] = await listWorkouts(pool);
    assert.equal(w.sets.length, 3);
    assert.equal(w.routineName, "Mía");
    assert.ok(w.routineId);
    assert.equal((await listExercises(pool)).filter((e) => e.isCustom).length, 1);
    assert.equal((await listRoutines(pool))[0].days[0].exercises.length, 1);
  });

  test("importar otra vez no duplica nada", async () => {
    const res = await importLegacyState(pool, legacy());
    assert.ok(res.ok);
    assert.deepEqual([res.result.exercises, res.result.routines, res.result.workouts], [0, 0, 0]);
    assert.equal((await listWorkouts(pool)).length, 1);
    assert.equal((await listRoutines(pool)).length, 1);
  });

  test("respaldo inválido no toca la base", async () => {
    const res = await importLegacyState(pool, { nada: true });
    assert.equal(res.ok, false);
    assert.equal((await listWorkouts(pool)).length, 1);
  });
});
