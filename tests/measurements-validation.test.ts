import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MEASUREMENT_FIELDS, parseMeasurement } from "../lib/measurements.ts";

const ID = "11111111-1111-4111-8111-111111111111";

describe("parseMeasurement", () => {
  test("solo la fecha es obligatoria: el resto queda en null", () => {
    const r = parseMeasurement({ measuredOn: "2026-11-14" });
    assert.ok(r.ok);
    assert.equal(r.value.measuredOn, "2026-11-14");
    for (const f of MEASUREMENT_FIELDS) assert.equal(r.value[f], null);
  });
  test("acepta todos los campos, con decimales, y un id", () => {
    const body: Record<string, unknown> = { id: ID, measuredOn: "2026-02-28" };
    for (const f of MEASUREMENT_FIELDS) body[f] = 40.5;
    const r = parseMeasurement(body);
    assert.ok(r.ok);
    assert.equal(r.value.id, ID);
    for (const f of MEASUREMENT_FIELDS) assert.equal(r.value[f], 40.5);
  });
  test("hay 12 campos: peso corporal en kg y 11 perímetros en cm", () => {
    assert.equal(MEASUREMENT_FIELDS.length, 12);
    assert.ok(MEASUREMENT_FIELDS.includes("bodyWeightKg"));
    assert.ok(MEASUREMENT_FIELDS.includes("waistCm"));
  });
  test("rechaza lo que no es objeto", () => {
    for (const bad of [null, undefined, 5, "x", []]) assert.equal(parseMeasurement(bad).ok, false);
  });
  test("fecha: obligatoria, formato AAAA-MM-DD y calendario real", () => {
    for (const d of [undefined, null, 20261114, "", "14/11/2026", "2026-11-14T10:00:00Z", "2026-02-30", "2026-13-01", "2025-02-29"]) {
      const r = parseMeasurement({ measuredOn: d });
      assert.equal(r.ok, false, String(d));
    }
    assert.ok(parseMeasurement({ measuredOn: "2024-02-29" }).ok);
  });
  test("valores: positivos, finitos y razonables", () => {
    for (const v of [0, -1, NaN, Infinity, "80", true, 501, {}]) {
      const r = parseMeasurement({ measuredOn: "2026-11-14", waistCm: v });
      assert.equal(r.ok, false, String(v));
      if (!r.ok) assert.match(r.error, /waistCm/);
    }
  });
  test("null explícito equivale a no medido", () => {
    const r = parseMeasurement({ measuredOn: "2026-11-14", waistCm: null, bodyWeightKg: 82.4 });
    assert.ok(r.ok);
    assert.equal(r.value.waistCm, null);
    assert.equal(r.value.bodyWeightKg, 82.4);
  });
  test("id inválido se rechaza", () => {
    assert.equal(parseMeasurement({ measuredOn: "2026-11-14", id: "nope" }).ok, false);
  });
  test("ignora campos desconocidos", () => {
    const r = parseMeasurement({ measuredOn: "2026-11-14", hack: "x" });
    assert.ok(r.ok);
    assert.equal("hack" in r.value, false);
  });
});
