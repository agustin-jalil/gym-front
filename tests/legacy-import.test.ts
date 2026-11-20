import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { planLegacyImport } from "../lib/legacy-import.ts";
import { SEED_EXERCISE_UUIDS, SEED_ROUTINE_UUIDS } from "../lib/legacy-ids.ts";

const idFor = (kind: string, id: string) => {
  const h = Buffer.from(`${kind}:${id}`).toString("hex").padEnd(32, "0").slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20)}`;
};
const UU = "11111111-1111-4111-8111-111111111111";
const state = (over: Record<string, unknown> = {}) => ({
  exercises: [{ id: "press-banca", name: "Press de banca", muscle: "pecho" }, { id: "mi-ej", name: "Mi ejercicio", muscle: "core", custom: true }],
  routines: [
    { id: "seed-push", name: "Push", days: [1], exercises: [], createdAt: "2026-01-01T00:00:00Z" },
    { id: "r1", name: "Mía", days: [1, 3], createdAt: "2026-01-01T00:00:00Z", exercises: [
      { exerciseId: "press-banca", sets: 3, reps: 8, weight: 60, restSec: 90 },
      { exerciseId: "mi-ej", sets: 2, reps: 15, weight: 0, restSec: 45 },
    ] },
  ],
  sessions: [
    { id: "s1", routineId: "r1", routineName: "Mía", startedAt: "2026-02-01T10:00:00.000Z", finishedAt: "2026-02-01T11:00:00.000Z",
      exercises: [
        { exerciseId: "press-banca", restSec: 90, sets: [{ reps: 8, weight: 60, done: true }, { reps: 6, weight: 60, done: false }] },
        { exerciseId: "mi-ej", restSec: 45, sets: [{ reps: 15, weight: 0, done: true }] },
      ] },
    { id: "s2", routineId: "seed-push", routineName: "Push", startedAt: "2026-02-02T10:00:00.000Z", finishedAt: "2026-02-02T11:00:00.000Z",
      exercises: [{ exerciseId: "dominadas", restSec: 60, sets: [{ reps: 5, weight: 0, done: false }] }] },
  ],
  ...over,
});

describe("planLegacyImport", () => {
  test("rechaza lo que no es un estado de gym:v1", () => {
    for (const bad of [null, [], "x", {}, { exercises: [], routines: [] }]) assert.equal(planLegacyImport(bad, idFor).ok, false);
  });
  test("estado vacío es válido y no importa nada", () => {
    const r = planLegacyImport({ exercises: [], routines: [], sessions: [] }, idFor);
    assert.ok(r.ok);
    assert.deepEqual([r.value.exercises.length, r.value.routines.length, r.value.workouts.length], [0, 0, 0]);
  });
  test("importa solo ejercicios propios y rutinas que no son de ejemplo, con ids deterministas", () => {
    const r = planLegacyImport(state(), idFor);
    assert.ok(r.ok);
    assert.deepEqual(r.value.exercises.map((e) => [e.id, e.name, e.muscleGroup]), [[idFor("exercise", "mi-ej"), "Mi ejercicio", "core"]]);
    assert.deepEqual(r.value.routines.map((x) => x.id), [idFor("routine", "r1")]);
    const days = r.value.routines[0].days;
    assert.deepEqual(days.map((d) => d.weekday), [1, 3]);
    assert.deepEqual(days[0].exercises.map((e) => e.exerciseId), [SEED_EXERCISE_UUIDS[0], idFor("exercise", "mi-ej")]);
    assert.equal(r.value.routines[0].type, "hipertrofia");
  });
  test("sesiones: solo series hechas, ids mapeados; sin series hechas se omite y se cuenta", () => {
    const r = planLegacyImport(state(), idFor);
    assert.ok(r.ok);
    assert.equal(r.value.workouts.length, 1);
    const w = r.value.workouts[0];
    assert.equal(w.id, idFor("session", "s1"));
    assert.equal(w.routineId, idFor("routine", "r1"));
    assert.deepEqual(w.sets.map((s) => [s.exerciseId, s.setNumber, s.reps]), [[SEED_EXERCISE_UUIDS[0], 1, 8], [idFor("exercise", "mi-ej"), 1, 15]]);
    assert.equal(r.value.skipped, 1);
  });
  test("sesión de rutina de ejemplo apunta al uuid de la semilla", () => {
    const r = planLegacyImport(state({ sessions: [{ id: "s2", routineId: "seed-push", routineName: "Push", startedAt: "2026-02-02T10:00:00.000Z", finishedAt: "2026-02-02T11:00:00.000Z",
      exercises: [{ exerciseId: "dominadas", restSec: 60, sets: [{ reps: 5, weight: 0, done: true }] }] }] }), idFor);
    assert.ok(r.ok);
    assert.equal(r.value.workouts[0].routineId, SEED_ROUTINE_UUIDS[0]);
  });
  test("ids que ya son uuid se conservan", () => {
    const r = planLegacyImport(state({ exercises: [{ id: UU, name: "X", muscle: "core", custom: true }], routines: [], sessions: [] }), idFor);
    assert.ok(r.ok);
    assert.equal(r.value.exercises[0].id, UU);
  });
  test("datos dañados se omiten y se cuentan, no rompen la importación", () => {
    const r = planLegacyImport(state({ sessions: [{ id: "s9", exercises: "x" }, null, { id: "s1", routineId: "r1", routineName: "Mía", startedAt: "no", finishedAt: "no", exercises: [] }] }), idFor);
    assert.ok(r.ok);
    assert.equal(r.value.workouts.length, 0);
    assert.equal(r.value.skipped, 3);
  });
});
