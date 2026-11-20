import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseWorkout } from "../lib/workouts.ts";

const A = "11111111-1111-4111-8111-111111111111";
const R = "22222222-2222-4222-8222-222222222222";
const base = () => ({
  routineName: "Empuje",
  startedAt: "2026-11-01T10:00:00.000Z",
  finishedAt: "2026-11-01T11:00:00.000Z",
  sets: [{ exerciseId: A, setNumber: 1, weightKg: 60, reps: 10 }],
});
const fail = (body: unknown, re: RegExp) => {
  const r = parseWorkout(body);
  assert.ok(!r.ok);
  assert.match(r.error, re);
};

describe("parseWorkout", () => {
  test("acepta un entrenamiento mínimo y completa nulos", () => {
    const r = parseWorkout(base());
    assert.ok(r.ok);
    assert.equal(r.value.routineId, null);
    assert.equal(r.value.sets[0].rpe, null);
  });
  test("acepta id, routineId y rpe", () => {
    const r = parseWorkout({ ...base(), id: R, routineId: R, sets: [{ exerciseId: A, setNumber: 1, weightKg: 0, reps: 0, rpe: 8.5 }] });
    assert.ok(r.ok);
    assert.equal(r.value.id, R);
    assert.equal(r.value.sets[0].rpe, 8.5);
  });
  test("rechaza cuerpos que no son objeto", () => {
    fail(null, /objeto/);
    fail([], /objeto/);
    fail("x", /objeto/);
  });
  test("rechaza ids inválidos", () => {
    fail({ ...base(), id: "x" }, /id/);
    fail({ ...base(), routineId: "x" }, /routineId/);
    fail({ ...base(), sets: [{ exerciseId: "x", setNumber: 1, weightKg: 1, reps: 1 }] }, /exerciseId/);
  });
  test("rechaza nombre de rutina vacío o enorme", () => {
    fail({ ...base(), routineName: "  " }, /routineName/);
    fail({ ...base(), routineName: "x".repeat(121) }, /routineName/);
  });
  test("rechaza fechas inválidas o fin antes del inicio", () => {
    fail({ ...base(), startedAt: "ayer" }, /startedAt/);
    fail({ ...base(), finishedAt: "2026-02-31T00:00:00Z" }, /finishedAt/);
    fail({ ...base(), finishedAt: "2026-11-01T09:00:00.000Z" }, /finishedAt/);
  });
  test("exige al menos una serie y limita el máximo", () => {
    fail({ ...base(), sets: [] }, /sets/);
    fail({ ...base(), sets: "x" }, /sets/);
    const many = Array.from({ length: 501 }, (_, i) => ({ exerciseId: A, setNumber: i + 1, weightKg: 1, reps: 1 }));
    fail({ ...base(), sets: many }, /sets/);
  });
  test("valida peso, reps, número de serie y rpe", () => {
    const one = (extra: Record<string, unknown>) => ({ ...base(), sets: [{ exerciseId: A, setNumber: 1, weightKg: 10, reps: 5, ...extra }] });
    fail(one({ weightKg: -1 }), /weightKg/);
    fail(one({ weightKg: 1001 }), /weightKg/);
    fail(one({ weightKg: "10" }), /weightKg/);
    fail(one({ reps: 1.5 }), /reps/);
    fail(one({ reps: -1 }), /reps/);
    fail(one({ setNumber: 0 }), /setNumber/);
    fail(one({ rpe: 0.5 }), /rpe/);
    fail(one({ rpe: 11 }), /rpe/);
    fail(one({ rpe: 7.3 }), /rpe/);
    assert.ok(parseWorkout(one({ rpe: null })).ok);
  });
});
