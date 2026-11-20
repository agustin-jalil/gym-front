import { test } from "node:test";
import assert from "node:assert/strict";
import { uuid } from "../lib/uuid.ts";
import { isUuid } from "../lib/validation.ts";

test("uuid genera v4 válidos y distintos, sin depender de randomUUID", () => {
  const original = globalThis.crypto.randomUUID;
  Object.defineProperty(globalThis.crypto, "randomUUID", { value: undefined, configurable: true });
  try {
    const ids = Array.from({ length: 50 }, uuid);
    assert.ok(ids.every(isUuid));
    assert.ok(ids.every((i) => i[14] === "4" && "89ab".includes(i[19])));
    assert.equal(new Set(ids).size, 50);
  } finally {
    Object.defineProperty(globalThis.crypto, "randomUUID", { value: original, configurable: true });
  }
});
