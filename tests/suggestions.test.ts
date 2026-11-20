import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { historyFor, suggestionFor } from "../lib/suggestions.ts";
import type { Session } from "../lib/types.ts";

const session = (id: string, finishedAt: string, sets: { reps: number; weight: number; done?: boolean; rpe?: number }[], exerciseId = "ex1", restSec = 90): Session => ({
  id,
  routineId: "r1",
  routineName: "Push",
  startedAt: finishedAt,
  finishedAt,
  exercises: [{ exerciseId, restSec, sets: sets.map((s) => ({ done: true, ...s })) }],
});

describe("historyFor", () => {
  test("sin sesiones → vacío", () => assert.deepEqual(historyFor([], "ex1"), []));

  test("ordena de la más vieja a la más reciente y conserva rpe y descanso", () => {
    const h = historyFor(
      [
        session("b", "2026-02-01T10:00:00Z", [{ reps: 10, weight: 60, rpe: 8 }], "ex1", 120),
        session("a", "2026-01-01T10:00:00Z", [{ reps: 8, weight: 55 }]),
      ],
      "ex1",
    );
    assert.equal(h.length, 2);
    assert.deepEqual(h[0].sets, [{ reps: 8, weight: 55 }]);
    assert.deepEqual(h[1].sets, [{ reps: 10, weight: 60, rpe: 8 }]);
    assert.equal(h[1].restSec, 120);
  });

  test("ignora series no hechas, otros ejercicios y sesiones sin series hechas", () => {
    const h = historyFor(
      [
        session("a", "2026-01-01T10:00:00Z", [{ reps: 8, weight: 55, done: false }]),
        session("b", "2026-01-02T10:00:00Z", [{ reps: 8, weight: 55 }], "otro"),
        session("c", "2026-01-03T10:00:00Z", [{ reps: 8, weight: 55 }, { reps: 7, weight: 55, done: false }]),
      ],
      "ex1",
    );
    assert.equal(h.length, 1);
    assert.equal(h[0].sets.length, 1);
  });
});

describe("suggestionFor", () => {
  test("sin historial: primera vez, sin carga", () => {
    const s = suggestionFor([], "ex1", "hipertrofia", 3);
    assert.equal(s.kind, "first");
    assert.equal(s.weight, null);
  });

  test("hipertrofia: 3×12 con RPE ≤ 9 sube 2,5 %", () => {
    const sets = [12, 12, 12].map((reps) => ({ reps, weight: 80, rpe: 8 }));
    const s = suggestionFor([session("a", "2026-01-01T10:00:00Z", sets)], "ex1", "hipertrofia", 3);
    assert.equal(s.kind, "increase");
    assert.equal(s.weight, 82.5);
  });

  test("usa las series planeadas: una sesión con menos series se repite", () => {
    const sets = [12, 12].map((reps) => ({ reps, weight: 80 }));
    const s = suggestionFor([session("a", "2026-01-01T10:00:00Z", sets)], "ex1", "hipertrofia", 3);
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 80);
  });
});
