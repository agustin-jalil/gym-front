import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MEASUREMENT_FIELDS, type MeasurementField } from "../lib/measurements.ts";
import { fieldsWithData, formatDelta, measurementSeries, parseFieldText, variations, type MeasurementEntry } from "../lib/measurement-history.ts";

const blank = Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f, null])) as Record<MeasurementField, number | null>;
const entry = (id: string, measuredOn: string, v: Partial<Record<MeasurementField, number>> = {}, createdAt = `${measuredOn}T10:00:00.000Z`): MeasurementEntry => ({
  id,
  measuredOn,
  createdAt,
  ...blank,
  ...v,
});

describe("variations", () => {
  test("lista vacía", () => assert.deepEqual(variations([]), []));

  test("la primera medición no tiene variación", () => {
    const [r] = variations([entry("a", "2026-01-01", { waistCm: 90 })]);
    assert.equal(r.deltas.waistCm, null);
  });

  test("calcula la diferencia contra la medición anterior, sin importar el orden de entrada", () => {
    const rows = variations([entry("b", "2026-02-01", { waistCm: 88.5 }), entry("a", "2026-01-01", { waistCm: 90 })]);
    assert.deepEqual(rows.map((r) => r.entry.id), ["b", "a"], "salida de más nueva a más vieja");
    assert.equal(rows[0].deltas.waistCm, -1.5);
    assert.equal(rows[1].deltas.waistCm, null);
  });

  test("si falta el campo en la anterior, compara con la última que sí lo tiene", () => {
    const rows = variations([
      entry("a", "2026-01-01", { armRightCm: 35 }),
      entry("b", "2026-02-01", { waistCm: 90 }),
      entry("c", "2026-03-01", { armRightCm: 36, waistCm: 89 }),
    ]);
    const c = rows[0];
    assert.equal(c.entry.id, "c");
    assert.equal(c.deltas.armRightCm, 1);
    assert.equal(c.deltas.waistCm, -1);
  });

  test("campo vacío en la medición actual → sin variación", () => {
    const rows = variations([entry("a", "2026-01-01", { waistCm: 90 }), entry("b", "2026-02-01")]);
    assert.equal(rows[0].deltas.waistCm, null);
  });

  test("redondea a 1 decimal sin ruido de coma flotante", () => {
    const rows = variations([entry("a", "2026-01-01", { chestCm: 100.1 }), entry("b", "2026-02-01", { chestCm: 100.4 })]);
    assert.equal(rows[0].deltas.chestCm, 0.3);
  });

  test("misma fecha: desempata por createdAt", () => {
    const rows = variations([
      entry("a", "2026-01-01", { waistCm: 90 }, "2026-01-01T08:00:00.000Z"),
      entry("b", "2026-01-01", { waistCm: 91 }, "2026-01-01T09:00:00.000Z"),
    ]);
    assert.equal(rows[0].entry.id, "b");
    assert.equal(rows[0].deltas.waistCm, 1);
  });
});

describe("formatDelta", () => {
  test("signo explícito y coma decimal", () => {
    assert.equal(formatDelta(1.5, "cm"), "+1,5 cm");
    assert.equal(formatDelta(-2, "cm"), "−2 cm");
    assert.equal(formatDelta(0, "kg"), "0 kg");
  });
  test("null → guion", () => assert.equal(formatDelta(null, "cm"), "—"));
});

describe("parseFieldText", () => {
  test("vacío → null (campo no cargado)", () => {
    assert.deepEqual(parseFieldText(""), { ok: true, value: null });
    assert.deepEqual(parseFieldText("  "), { ok: true, value: null });
  });
  test("acepta coma o punto", () => {
    assert.deepEqual(parseFieldText("62,5"), { ok: true, value: 62.5 });
    assert.deepEqual(parseFieldText("62.5"), { ok: true, value: 62.5 });
  });
  test("rechaza cero, negativos, texto y fuera de rango", () => {
    for (const t of ["0", "-3", "abc", "1,2,3", "501"]) assert.equal(parseFieldText(t).ok, false, t);
  });
});

describe("measurementSeries", () => {
  test("lista vacía", () => assert.deepEqual(measurementSeries([], "waistCm"), []));

  test("ordena de la más vieja a la más nueva y omite mediciones sin ese campo", () => {
    const series = measurementSeries(
      [entry("c", "2026-03-01", { waistCm: 87 }), entry("b", "2026-02-01", { hipCm: 100 }), entry("a", "2026-01-01", { waistCm: 90 })],
      "waistCm",
    );
    assert.deepEqual(series, [
      { measuredOn: "2026-01-01", value: 90 },
      { measuredOn: "2026-03-01", value: 87 },
    ]);
  });

  test("a igual fecha respeta el orden de carga", () => {
    const series = measurementSeries(
      [entry("b", "2026-01-01", { waistCm: 89 }, "2026-01-01T12:00:00.000Z"), entry("a", "2026-01-01", { waistCm: 90 }, "2026-01-01T09:00:00.000Z")],
      "waistCm",
    );
    assert.deepEqual(series.map((p) => p.value), [90, 89]);
  });
});

describe("fieldsWithData", () => {
  test("devuelve solo los campos con al menos un valor, en el orden canónico", () => {
    const fields = fieldsWithData([entry("a", "2026-01-01", { calfCm: 38 }), entry("b", "2026-02-01", { waistCm: 90 })]);
    assert.deepEqual(fields, ["waistCm", "calfCm"]);
  });
  test("sin mediciones no hay campos", () => assert.deepEqual(fieldsWithData([]), []));
});
