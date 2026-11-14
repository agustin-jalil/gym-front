import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isUuid, parseNewExercise, parseNewRoutine } from "../lib/validation.ts";

const ID = "11111111-1111-4111-8111-111111111111";
const ex = { exerciseId: ID, sets: 3, repsMin: 6, repsMax: 12, restSeconds: 90 };

describe("isUuid", () => {
  test("acepta uuid y rechaza basura", () => {
    assert.equal(isUuid(ID), true);
    assert.equal(isUuid("abc"), false);
    assert.equal(isUuid(5), false);
  });
});

describe("parseNewExercise", () => {
  test("válido, recorta espacios", () => {
    const r = parseNewExercise({ name: "  Press ", muscleGroup: "pecho" });
    assert.deepEqual(r, { ok: true, value: { name: "Press", muscleGroup: "pecho", equipment: null } });
  });
  test("rechaza no-objeto, nombre vacío o largo, tipos erróneos", () => {
    for (const bad of [null, "x", [], {}, { name: "  " }, { name: "a".repeat(101) }, { name: "a", muscleGroup: 3 }]) {
      assert.equal(parseNewExercise(bad).ok, false);
    }
  });
});

describe("parseNewRoutine", () => {
  const base = { name: "Torso", type: "hipertrofia", days: [{ name: "Lunes", weekday: 1, exercises: [ex] }] };
  test("válido", () => {
    const r = parseNewRoutine(base);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.days[0].exercises[0].weightKg, null);
  });
  test("acepta días vacíos y peso", () => {
    assert.equal(parseNewRoutine({ ...base, days: [] }).ok, true);
    const r = parseNewRoutine({ ...base, days: [{ name: "D", exercises: [{ ...ex, weightKg: 20 }] }] });
    assert.equal(r.ok, true);
  });
  test("rechaza tipo, nombre, weekday, reps, series, descanso, peso y uuid inválidos", () => {
    const day = (e: object) => ({ ...base, days: [{ name: "D", exercises: [{ ...ex, ...e }] }] });
    const bads: unknown[] = [
      { ...base, type: "otro" },
      { ...base, name: "" },
      { ...base, days: "x" },
      { ...base, days: [{ name: "D", weekday: 7, exercises: [] }] },
      { ...base, days: [{ name: "", exercises: [] }] },
      day({ repsMin: 12, repsMax: 6 }),
      day({ repsMin: 0 }),
      day({ sets: 0 }),
      day({ sets: 1.5 }),
      day({ restSeconds: -1 }),
      day({ weightKg: -2 }),
      day({ exerciseId: "nope" }),
    ];
    for (const b of bads) assert.equal(parseNewRoutine(b).ok, false, JSON.stringify(b));
  });
  test("el error dice dónde", () => {
    const r = parseNewRoutine({ ...base, type: "x" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /type/);
  });
});

describe("id opcional elegido por el cliente", () => {
  test("ejercicio: acepta uuid, rechaza otra cosa", () => {
    const ok = parseNewExercise({ id: ID, name: "Press" });
    assert.equal(ok.ok && ok.value.id, ID);
    assert.equal(parseNewExercise({ id: "abc", name: "Press" }).ok, false);
    const none = parseNewExercise({ name: "Press" });
    assert.equal(none.ok && none.value.id, undefined);
  });
  test("rutina: acepta uuid, rechaza otra cosa", () => {
    const ok = parseNewRoutine({ id: ID, name: "R", type: "hipertrofia", days: [] });
    assert.equal(ok.ok && ok.value.id, ID);
    assert.equal(parseNewRoutine({ id: 5, name: "R", type: "hipertrofia", days: [] }).ok, false);
  });
});
