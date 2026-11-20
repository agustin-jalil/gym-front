import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { createMeasurement, deleteMeasurement, getMeasurement, listMeasurements, updateMeasurement } from "../lib/server/measurements.ts";
import { parseMeasurement } from "../lib/measurements.ts";
import type { MeasurementInput } from "../lib/measurements.ts";

const url = process.env.DATABASE_URL;
const skip = url ? false : "DATABASE_URL no definida";
const MISSING = "00000000-0000-0000-0000-000000000000";

function input(measuredOn: string, extra: Record<string, unknown> = {}): MeasurementInput {
  const r = parseMeasurement({ measuredOn, ...extra });
  assert.ok(r.ok);
  return r.value;
}

describe("repositorio de medidas corporales", { skip }, () => {
  let pool: Pool;
  before(async () => {
    pool = new Pool({ connectionString: url });
    await pool.query("truncate body_measurements");
  });
  after(async () => {
    await pool.end();
  });

  test("crear y leer devuelve números (no strings) y nulos", async () => {
    const m = await createMeasurement(pool, input("2026-11-01", { waistCm: 84.5, bodyWeightKg: 82.35 }));
    assert.equal(m.waistCm, 84.5);
    assert.equal(m.bodyWeightKg, 82.35);
    assert.equal(m.hipCm, null);
    assert.equal(m.measuredOn, "2026-11-01");
    assert.deepEqual(await getMeasurement(pool, m.id), m);
    assert.equal(await getMeasurement(pool, MISSING), null);
  });

  test("respeta el id elegido por el cliente", async () => {
    const id = "55555555-5555-4555-8555-555555555555";
    const m = await createMeasurement(pool, input("2026-10-01", { id }));
    assert.equal(m.id, id);
  });

  test("lista de la más reciente a la más vieja", async () => {
    await createMeasurement(pool, input("2026-12-01", { chestCm: 100 }));
    const dates = (await listMeasurements(pool)).map((m) => m.measuredOn);
    assert.deepEqual(dates, [...dates].sort().reverse());
    assert.equal(dates[0], "2026-12-01");
  });

  test("actualizar reemplaza todos los campos; inexistente devuelve null", async () => {
    const m = await createMeasurement(pool, input("2026-09-01", { waistCm: 90, calfCm: 38 }));
    const up = await updateMeasurement(pool, m.id, input("2026-09-02", { waistCm: 88 }));
    assert.ok(up);
    assert.equal(up.id, m.id);
    assert.equal(up.measuredOn, "2026-09-02");
    assert.equal(up.waistCm, 88);
    assert.equal(up.calfCm, null);
    assert.equal(await updateMeasurement(pool, MISSING, input("2026-09-02")), null);
  });

  test("borrar devuelve si borró", async () => {
    const m = await createMeasurement(pool, input("2026-08-01"));
    assert.equal(await deleteMeasurement(pool, m.id), true);
    assert.equal(await deleteMeasurement(pool, m.id), false);
  });

  test("la base rechaza valores no positivos (check)", async () => {
    await assert.rejects(pool.query("insert into body_measurements (measured_on, waist_cm) values ('2026-01-01', 0)"));
  });
});
