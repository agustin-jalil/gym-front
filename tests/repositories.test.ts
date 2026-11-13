import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { createExercise, deleteExercise, getExercise, listExercises } from "../lib/server/exercises.ts";
import { createRoutine, deleteRoutine, getRoutine, listRoutines, updateRoutine } from "../lib/server/routines.ts";

const url = process.env.DATABASE_URL;
const skip = url ? false : "DATABASE_URL no definida";
const MISSING = "00000000-0000-0000-0000-000000000000";

describe("repositorios de servidor", { skip }, () => {
  let pool: Pool;
  before(async () => {
    pool = new Pool({ connectionString: url });
    await pool.query("truncate routines, exercises cascade");
  });
  after(async () => {
    await pool.end();
  });

  test("ejercicios: crear, leer, listar y borrar", async () => {
    const ex = await createExercise(pool, { name: "Press de banca", muscleGroup: "pecho" });
    assert.equal(ex.isCustom, true);
    assert.deepEqual(await getExercise(pool, ex.id), ex);
    assert.equal((await listExercises(pool)).length, 1);
    assert.equal(await getExercise(pool, MISSING), null);
    assert.equal(await deleteExercise(pool, ex.id), true);
    assert.equal(await deleteExercise(pool, ex.id), false);
  });

  test("ejercicios: nombre vacío rechazado por la base", async () => {
    await assert.rejects(createExercise(pool, { name: "  " }));
  });

  test("ejercicios: no borra los del catálogo", async () => {
    const ex = await createExercise(pool, { name: "Sentadilla", isCustom: false });
    assert.equal(await deleteExercise(pool, ex.id), false);
  });

  test("rutinas: crear con días y ejercicios, tipo y orden", async () => {
    const ex = await createExercise(pool, { name: "Remo" });
    const ex2 = await createExercise(pool, { name: "Dominadas" });
    const r = await createRoutine(pool, {
      name: "Torso",
      type: "estres_metabolico",
      days: [
        {
          name: "Lunes",
          weekday: 1,
          exercises: [
            { exerciseId: ex.id, sets: 3, repsMin: 12, repsMax: 20, weightKg: 42.5, restSeconds: 45 },
            { exerciseId: ex2.id, sets: 4, repsMin: 12, repsMax: 15, restSeconds: 30 },
          ],
        },
        { name: "Jueves", exercises: [] },
      ],
    });
    assert.equal(r.type, "estres_metabolico");
    assert.deepEqual(r.days.map((d) => d.name), ["Lunes", "Jueves"]);
    assert.deepEqual(r.days[0].exercises.map((e) => e.exerciseId), [ex.id, ex2.id]);
    assert.equal(r.days[0].exercises[0].weightKg, 42.5);
    assert.equal(r.days[0].exercises[1].weightKg, null);
    assert.deepEqual(await getRoutine(pool, r.id), r);
    assert.ok((await listRoutines(pool)).some((x) => x.id === r.id));
  });

  test("rutinas: crear es atómico (falla → no queda nada)", async () => {
    const before = (await listRoutines(pool)).length;
    await assert.rejects(
      createRoutine(pool, {
        name: "Rota",
        type: "hipertrofia",
        days: [{ name: "D", exercises: [{ exerciseId: MISSING, sets: 3, repsMin: 6, repsMax: 12, restSeconds: 90 }] }],
      }),
    );
    assert.equal((await listRoutines(pool)).length, before);
  });

  test("rutinas: rechaza rango de reps inválido y tipo inválido", async () => {
    const ex = await createExercise(pool, { name: "Curl" });
    await assert.rejects(
      createRoutine(pool, {
        name: "X",
        type: "hipertrofia",
        days: [{ name: "D", exercises: [{ exerciseId: ex.id, sets: 3, repsMin: 12, repsMax: 6, restSeconds: 90 }] }],
      }),
    );
    await assert.rejects(createRoutine(pool, { name: "Y", type: "otro" as never, days: [] }));
  });

  test("rutinas: actualizar reemplaza días y cambia el tipo; inexistente → null", async () => {
    const ex = await createExercise(pool, { name: "Press militar" });
    const r = await createRoutine(pool, {
      name: "A",
      type: "hipertrofia",
      days: [{ name: "D1", exercises: [{ exerciseId: ex.id, sets: 3, repsMin: 6, repsMax: 12, restSeconds: 90 }] }],
    });
    const upd = await updateRoutine(pool, r.id, { name: "B", type: "estres_metabolico", days: [{ name: "Solo", exercises: [] }] });
    assert.equal(upd?.name, "B");
    assert.equal(upd?.type, "estres_metabolico");
    assert.deepEqual(upd?.days.map((d) => d.name), ["Solo"]);
    assert.equal(await updateRoutine(pool, MISSING, { name: "Z", type: "hipertrofia", days: [] }), null);
  });

  test("rutinas: borrar en cascada", async () => {
    const r = await createRoutine(pool, { name: "Borrar", type: "hipertrofia", days: [{ name: "D", exercises: [] }] });
    assert.equal(await deleteRoutine(pool, r.id), true);
    assert.equal(await getRoutine(pool, r.id), null);
    assert.equal(await deleteRoutine(pool, r.id), false);
    const days = await pool.query("select 1 from routine_days where routine_id = $1", [r.id]);
    assert.equal(days.rowCount, 0);
  });
});
