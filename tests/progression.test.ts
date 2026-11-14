import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { suggestLoad, roundToIncrement, type SessionSets } from "../lib/progression.ts";

const sess = (reps: number[], weight: number, extra: Partial<SessionSets> = {}): SessionSets => ({
  type: "hipertrofia",
  sets: reps.map((r) => ({ reps: r, weight })),
  ...extra,
});
const H = "hipertrofia" as const;
const M = "estres_metabolico" as const;

describe("roundToIncrement", () => {
  test("redondea al múltiplo más cercano sin ruido de coma flotante", () => {
    assert.equal(roundToIncrement(102.5 * 1.025, 2.5), 105);
    assert.equal(roundToIncrement(41.3, 1), 41);
    assert.equal(roundToIncrement(0.1 + 0.2, 0.1), 0.3);
  });
});

describe("sin historial / datos inválidos", () => {
  test("sin historial: la primera carga la ingresa el usuario", () => {
    const s = suggestLoad({ type: H, history: [] });
    assert.equal(s.kind, "first");
    assert.equal(s.weight, null);
    assert.equal(s.reps, 6);
    assert.match(s.reason, /primera/i);
  });
  test("series con reps 0 se ignoran; si no queda nada válido es como sin historial", () => {
    assert.equal(suggestLoad({ type: H, history: [sess([0, 0], 50)] }).kind, "first");
    const s = suggestLoad({ type: H, history: [sess([10, 10, 10], 50), sess([0, 0, 0], 60)] });
    assert.equal(s.weight, 50);
  });
  test("reps/kg no finitos o negativos se ignoran", () => {
    const h: SessionSets = { type: H, sets: [{ reps: NaN, weight: 50 }, { reps: 10, weight: -5 }, { reps: 10, weight: Infinity }] };
    assert.equal(suggestLoad({ type: H, history: [h] }).kind, "first");
  });
});

describe("hipertrofia", () => {
  test("todas las series al tope (12) sin RPE: sube 2,5 % redondeado a 2,5 kg", () => {
    const s = suggestLoad({ type: H, history: [sess([12, 12, 12], 100)] });
    assert.equal(s.kind, "increase");
    assert.equal(s.weight, 102.5);
    assert.equal(s.reps, 6);
  });
  test("2,5 % redondea hacia abajo pero nunca menos de un incremento", () => {
    assert.equal(suggestLoad({ type: H, history: [sess([12, 12, 12], 40)] }).weight, 42.5);
  });
  test("incremento configurable (mancuerna 1 kg)", () => {
    assert.equal(suggestLoad({ type: H, history: [sess([12, 12], 20)], incrementKg: 1 }).weight, 21);
  });
  test("RPE ≤ 9 permite subir; RPE 10 en alguna serie no", () => {
    const ok = sess([12, 12, 12], 80, { sets: [12, 12, 12].map((r) => ({ reps: r, weight: 80, rpe: 9 })) });
    assert.equal(suggestLoad({ type: H, history: [ok] }).kind, "increase");
    const hard = sess([12, 12, 12], 80, { sets: [12, 12, 12].map((r, i) => ({ reps: r, weight: 80, rpe: i === 2 ? 10 : 8 })) });
    const s = suggestLoad({ type: H, history: [hard] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 80);
  });
  test("llegó al piso pero no al tope: misma carga, +1 rep sobre la serie más floja", () => {
    const s = suggestLoad({ type: H, history: [sess([10, 9, 8], 60)] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 60);
    assert.equal(s.reps, 9);
  });
  test("la rep objetivo nunca pasa del tope", () => {
    const s = suggestLoad({ type: H, history: [sess([12, 12, 11], 60)] });
    assert.equal(s.reps, 12);
  });
  test("rango configurable por ejercicio", () => {
    const s = suggestLoad({ type: H, history: [sess([8, 8, 8], 100)], repsMin: 4, repsMax: 8 });
    assert.equal(s.kind, "increase");
    assert.equal(s.reps, 4);
  });
  test("una sola sesión bajo el piso: misma carga, apuntar al piso", () => {
    const s = suggestLoad({ type: H, history: [sess([10, 10, 10], 60), sess([5, 5, 4], 60)] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 60);
    assert.equal(s.reps, 6);
  });
  test("dos sesiones seguidas bajo el piso: deload (5 % si falta poco)", () => {
    const s = suggestLoad({ type: H, history: [sess([5, 5, 5], 100), sess([5, 5, 4], 100)] });
    assert.equal(s.kind, "deload");
    assert.equal(s.weight, 95);
  });
  test("deload de 10 % si faltan 3 o más reps; siempre baja al menos un incremento", () => {
    assert.equal(suggestLoad({ type: H, history: [sess([3, 3], 100), sess([3, 2], 100)] }).weight, 90);
    assert.equal(suggestLoad({ type: H, history: [sess([5], 20), sess([5], 20)] }).weight, 17.5);
  });
  test("deload nunca da negativo", () => {
    assert.equal(suggestLoad({ type: H, history: [sess([1], 2), sess([1], 2)] }).weight, 0);
  });
  test("sesión incompleta (menos series que las planeadas): no progresa ni baja", () => {
    const s = suggestLoad({ type: H, plannedSets: 4, history: [sess([12, 12], 100)] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 100);
    assert.match(s.reason, /incompleta/i);
  });
  test("sesión incompleta bajo el piso tampoco cuenta para deload", () => {
    const s = suggestLoad({ type: H, plannedSets: 4, history: [sess([5, 5, 5, 5], 100), sess([5, 5], 100)] });
    assert.notEqual(s.kind, "deload");
  });
  test("usa solo la sesión más reciente para subir", () => {
    const s = suggestLoad({ type: H, history: [sess([12, 12, 12], 100), sess([8, 8, 8], 102.5)] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 102.5);
  });
  test("la carga de la sesión es el kg más alto usado", () => {
    const h: SessionSets = { type: H, sets: [{ reps: 12, weight: 50 }, { reps: 12, weight: 60 }, { reps: 12, weight: 60 }] };
    assert.equal(suggestLoad({ type: H, history: [h] }).weight, 62.5);
  });
});

describe("estrés metabólico", () => {
  const ms = (reps: number[], weight: number, restSec?: number): SessionSets => ({
    type: M,
    restSec,
    sets: reps.map((r) => ({ reps: r, weight })),
  });
  test("sin historial: reps al piso del rango 12-20", () => {
    const s = suggestLoad({ type: M, history: [] });
    assert.equal(s.reps, 12);
    assert.equal(s.weight, null);
  });
  test("si no llegó al tope: misma carga, +1 rep", () => {
    const s = suggestLoad({ type: M, history: [ms([15, 14, 13], 30, 60)] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 30);
    assert.equal(s.reps, 14);
  });
  test("tope (20) con descanso alto: baja el descanso 5 s, no sube carga", () => {
    const s = suggestLoad({ type: M, history: [ms([20, 20, 20], 30, 60)] });
    assert.equal(s.kind, "rest");
    assert.equal(s.weight, 30);
    assert.equal(s.restSec, 55);
  });
  test("el descanso no baja de 30 s", () => {
    const s = suggestLoad({ type: M, history: [ms([20, 20, 20], 30, 32)] });
    assert.equal(s.restSec, 30);
  });
  test("tope con descanso mínimo: sube 2,5 %, vuelve a 12 reps y descanso 60 s", () => {
    const s = suggestLoad({ type: M, history: [ms([20, 20, 20], 40, 30)] });
    assert.equal(s.kind, "increase");
    assert.equal(s.weight, 42.5);
    assert.equal(s.reps, 12);
    assert.equal(s.restSec, 60);
  });
  test("sin descanso registrado: se asume el máximo del rango (no sube carga todavía)", () => {
    const s = suggestLoad({ type: M, history: [ms([20, 20, 20], 40)] });
    assert.equal(s.kind, "rest");
    assert.equal(s.restSec, 55);
  });
  test("dos sesiones bajo el piso (12): deload", () => {
    const s = suggestLoad({ type: M, history: [ms([11, 11], 40, 45), ms([11, 10], 40, 45)] });
    assert.equal(s.kind, "deload");
    assert.equal(s.weight, 37.5);
  });
  test("sesión incompleta: sin cambios", () => {
    const s = suggestLoad({ type: M, plannedSets: 3, history: [ms([20, 20], 40, 30)] });
    assert.equal(s.kind, "repeat");
    assert.equal(s.weight, 40);
  });
});

describe("cambio de tipo de rutina", () => {
  test("historial hecho con otro tipo: conserva la carga y reinicia al piso del nuevo rango", () => {
    const s = suggestLoad({ type: M, history: [sess([12, 12, 12], 100)] });
    assert.equal(s.kind, "type-change");
    assert.equal(s.weight, 100);
    assert.equal(s.reps, 12);
    assert.equal(s.restSec, 60);
    assert.match(s.reason, /tipo/i);
  });
  test("de metabólico a hipertrofia", () => {
    const h: SessionSets = { type: M, sets: [{ reps: 20, weight: 30 }] };
    const s = suggestLoad({ type: H, history: [h] });
    assert.equal(s.kind, "type-change");
    assert.equal(s.reps, 6);
    assert.equal(s.restSec, 120);
  });
  test("sesiones sin tipo registrado se interpretan como del tipo actual", () => {
    const h: SessionSets = { sets: [{ reps: 12, weight: 100 }] };
    assert.equal(suggestLoad({ type: H, history: [h] }).kind, "increase");
  });
});
