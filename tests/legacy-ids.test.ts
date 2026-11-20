import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fromLegacyId, SEED_EXERCISE_UUIDS, SEED_ROUTINE_UUIDS } from "../lib/legacy-ids.ts";
import { SEED_EXERCISES, SEED_ROUTINES } from "../lib/seed.ts";
import { isUuid } from "../lib/validation.ts";

describe("ids heredados de localStorage", () => {
  test("los ids de ejemplo se traducen a uuid estable y único", () => {
    const all = [...SEED_EXERCISES.map((e) => e.id), ...SEED_ROUTINES.map((r) => r.id)];
    const uuids = all.map(fromLegacyId);
    assert.ok(uuids.every(isUuid));
    assert.equal(new Set(uuids).size, all.length);
    assert.equal(fromLegacyId("press-banca"), fromLegacyId("press-banca"));
  });

  test("lo que ya es uuid o es desconocido queda igual", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    assert.equal(fromLegacyId(id), id);
    assert.equal(fromLegacyId("ejercicio-propio-xyz"), "ejercicio-propio-xyz");
  });

  test("la migración 0002 inserta exactamente esos uuid", () => {
    const sql = readFileSync(new URL("../db/migrations/0002_seed.sql", import.meta.url), "utf8");
    for (const id of [...SEED_EXERCISE_UUIDS, ...SEED_ROUTINE_UUIDS]) assert.ok(sql.includes(id), id);
    for (const e of SEED_EXERCISES) assert.ok(sql.includes(e.name.replace(/'/g, "''")), e.name);
  });
});
