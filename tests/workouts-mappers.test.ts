import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { toSession, toWorkoutInput } from "../lib/api-mappers.ts";
import type { Session } from "../lib/types.ts";
import type { WorkoutRecord } from "../lib/server/workouts.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const R = "33333333-3333-4333-8333-333333333333";
const W = "44444444-4444-4444-8444-444444444444";
const rec = (sets: WorkoutRecord["sets"], extra: Partial<WorkoutRecord> = {}): WorkoutRecord => ({
  id: W, routineId: R, routineName: "Empuje", startedAt: "2026-11-01T10:00:00.000Z", finishedAt: "2026-11-01T11:00:00.000Z", sets, ...extra,
});
const set = (exerciseId: string, setNumber: number, weightKg: number, reps: number, rpe: number | null = null) => ({ exerciseId, setNumber, weightKg, reps, rpe });

describe("toSession", () => {
  test("agrupa series por ejercicio en orden de aparición, marca done y conserva rpe", () => {
    const s = toSession(rec([set(B, 1, 20, 12), set(A, 1, 60, 10, 8), set(A, 2, 60, 9), set(B, 2, 20, 11)]));
    assert.deepEqual(s.exercises.map((e) => e.exerciseId), [B, A]);
    assert.deepEqual(s.exercises[1].sets, [
      { reps: 10, weight: 60, done: true, rpe: 8 },
      { reps: 9, weight: 60, done: true },
    ]);
    assert.equal(s.exercises[0].sets.length, 2);
    assert.equal(s.id, W);
    assert.equal(s.routineName, "Empuje");
  });
  test("rutina borrada: routineId vacío", () => {
    assert.equal(toSession(rec([set(A, 1, 1, 1)], { routineId: null })).routineId, "");
  });
});

describe("toWorkoutInput", () => {
  const session: Session = {
    id: W, routineId: R, routineName: "Empuje", startedAt: "2026-11-01T10:00:00.000Z", finishedAt: "2026-11-01T11:00:00.000Z",
    exercises: [
      { exerciseId: A, restSec: 90, sets: [{ reps: 10, weight: 60, done: true, rpe: 8 }, { reps: 8, weight: 60, done: false }, { reps: 9, weight: 60, done: true }] },
      { exerciseId: B, restSec: 60, sets: [{ reps: 12, weight: 20, done: true }] },
    ],
  };
  test("solo series hechas, numeradas por ejercicio", () => {
    const i = toWorkoutInput(session);
    assert.deepEqual(i.sets, [
      { exerciseId: A, setNumber: 1, weightKg: 60, reps: 10, rpe: 8 },
      { exerciseId: A, setNumber: 2, weightKg: 60, reps: 9, rpe: null },
      { exerciseId: B, setNumber: 1, weightKg: 20, reps: 12, rpe: null },
    ]);
    assert.equal(i.routineId, R);
  });
  test("routineId vacío se envía como null", () => {
    assert.equal(toWorkoutInput({ ...session, routineId: "" }).routineId, null);
  });
  test("ida y vuelta conserva lo hecho", () => {
    const i = toWorkoutInput(session);
    const back = toSession({ ...i, id: W, routineId: R, routineName: "Empuje", sets: i.sets });
    assert.equal(back.exercises[0].sets.length, 2);
  });
});
