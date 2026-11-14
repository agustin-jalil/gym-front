import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ROUTINE_TYPES, adaptToType, defaultExercise } from "../lib/routine-types.ts";

describe("ROUTINE_TYPES", () => {
  test("hipertrofia: 6-12 reps, 90-180 s", () => {
    assert.deepEqual(ROUTINE_TYPES.hipertrofia, { label: "Hipertrofia", repsMin: 6, repsMax: 12, restMin: 90, restMax: 180, restDefault: 120 });
  });
  test("estrés metabólico: 12-20 reps, 30-60 s", () => {
    assert.deepEqual(ROUTINE_TYPES.estres_metabolico, { label: "Estrés metabólico", repsMin: 12, repsMax: 20, restMin: 30, restMax: 60, restDefault: 45 });
  });
});

describe("defaultExercise", () => {
  test("usa el tope del rango y el descanso por defecto del tipo", () => {
    assert.deepEqual(defaultExercise("hipertrofia", "e1"), { exerciseId: "e1", sets: 3, reps: 12, weight: 0, restSec: 120 });
    assert.deepEqual(defaultExercise("estres_metabolico", "e1"), { exerciseId: "e1", sets: 3, reps: 20, weight: 0, restSec: 45 });
  });
});

describe("adaptToType", () => {
  const base = { exerciseId: "e", sets: 4, weight: 30 };
  test("lleva reps y descanso al rango del nuevo tipo sin tocar series ni kg", () => {
    assert.deepEqual(adaptToType("estres_metabolico", { ...base, reps: 8, restSec: 120 }), { ...base, reps: 12, restSec: 60 });
    assert.deepEqual(adaptToType("hipertrofia", { ...base, reps: 20, restSec: 30 }), { ...base, reps: 12, restSec: 90 });
  });
  test("deja igual lo que ya está dentro del rango", () => {
    const e = { ...base, reps: 15, restSec: 45 };
    assert.deepEqual(adaptToType("estres_metabolico", e), e);
  });
  test("no muta la entrada", () => {
    const e = { ...base, reps: 8, restSec: 120 };
    adaptToType("estres_metabolico", e);
    assert.equal(e.reps, 8);
  });
});
