import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { toExercise, toRoutine, toRoutineInput } from "../lib/api-mappers.ts";
import type { Routine } from "../lib/types.ts";
import type { RoutineDayRecord, RoutineExerciseRecord } from "../lib/server/routines.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ex = (exerciseId: string, extra: Partial<RoutineExerciseRecord> = {}): RoutineExerciseRecord => ({
  id: "x", exerciseId, position: 0, sets: 3, repsMin: 10, repsMax: 10, weightKg: 20, restSeconds: 90, ...extra,
});
const day = (weekday: number | null, exercises = [ex(A)]): RoutineDayRecord => ({ id: "d", position: 0, name: "Día", weekday, exercises });
const rec = (days: RoutineDayRecord[]) => ({
  id: B, name: "Empuje", type: "hipertrofia" as const, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z", days,
});

describe("toExercise", () => {
  test("mapea grupo muscular y custom", () => {
    assert.deepEqual(toExercise({ id: A, name: "Press", muscleGroup: "pecho", equipment: null, isCustom: true }), {
      id: A, name: "Press", muscle: "pecho", custom: true,
    });
  });
  test("grupo desconocido o vacío cae en core", () => {
    assert.equal(toExercise({ id: A, name: "X", muscleGroup: null, equipment: null, isCustom: false }).muscle, "core");
    assert.equal(toExercise({ id: A, name: "X", muscleGroup: "zzz", equipment: null, isCustom: false }).muscle, "core");
  });
});

describe("toRoutine", () => {
  test("une los días de la semana y toma los ejercicios del primer día", () => {
    const r = toRoutine(rec([day(4), day(1)]));
    assert.deepEqual(r.days, [1, 4]);
    assert.equal(r.exercises.length, 1);
    assert.deepEqual(r.exercises[0], { exerciseId: A, sets: 3, reps: 10, weight: 20, restSec: 90 });
    assert.equal(r.type, "hipertrofia");
  });
  test("peso nulo es 0; rango usa el tope; sin días queda vacío", () => {
    const r = toRoutine(rec([day(null, [ex(A, { weightKg: null, repsMin: 6, repsMax: 12 })])]));
    assert.equal(r.exercises[0].weight, 0);
    assert.equal(r.exercises[0].reps, 12);
    assert.deepEqual(r.days, []);
    assert.deepEqual(toRoutine(rec([])).exercises, []);
  });
});

describe("toRoutineInput", () => {
  const routine: Routine = {
    id: B, name: "Empuje", type: "estres_metabolico", days: [4, 1], createdAt: "x",
    exercises: [{ exerciseId: A, sets: 4, reps: 8, weight: 0, restSec: 60 }],
  };
  test("un día por día de la semana, ordenados, con los mismos ejercicios", () => {
    const input = toRoutineInput(routine);
    assert.equal(input.type, "estres_metabolico");
    assert.deepEqual(input.days.map((d) => d.weekday), [1, 4]);
    assert.deepEqual(input.days[0].exercises, [{ exerciseId: A, sets: 4, repsMin: 8, repsMax: 8, weightKg: 0, restSeconds: 60 }]);
  });
  test("sin días de la semana crea un único día sin weekday", () => {
    const input = toRoutineInput({ ...routine, days: [] });
    assert.equal(input.days.length, 1);
    assert.equal(input.days[0].weekday, null);
  });
  test("ida y vuelta conserva la rutina", () => {
    const back = toRoutine({ ...rec(toRoutineInput(routine).days.map((d, i) => ({ id: "d", position: i, name: d.name, weekday: d.weekday, exercises: d.exercises.map((e, j) => ({ id: "e", position: j, ...e })) }))), type: "estres_metabolico" });
    assert.deepEqual({ ...back, createdAt: "x" }, routine.days.length ? { ...routine, days: [1, 4] } : routine);
  });
});
