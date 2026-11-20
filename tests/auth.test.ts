import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { checkAccess, safeNext, secretMatches, tokenFor } from "../lib/auth.ts";

describe("tokenFor", () => {
  test("es determinista, hex de 64 caracteres y distinto según el secreto", async () => {
    const a = await tokenFor("secreto-1");
    assert.match(a, /^[0-9a-f]{64}$/);
    assert.equal(a, await tokenFor("secreto-1"));
    assert.notEqual(a, await tokenFor("secreto-2"));
  });
});

describe("secretMatches", () => {
  test("iguales / distintos / vacío", async () => {
    assert.equal(await secretMatches("abc", "abc"), true);
    assert.equal(await secretMatches("abd", "abc"), false);
    assert.equal(await secretMatches("", "abc"), false);
  });
});

describe("checkAccess", () => {
  test("sin secreto configurado: en producción se cierra, en desarrollo se abre", async () => {
    assert.equal(await checkAccess({ secret: undefined, production: true }), "not-configured");
    assert.equal(await checkAccess({ secret: "", production: true }), "not-configured");
    assert.equal(await checkAccess({ secret: undefined, production: false }), "ok");
  });
  test("sin credenciales → denied", async () => {
    assert.equal(await checkAccess({ secret: "s", production: true }), "denied");
  });
  test("cookie con el token correcto → ok; incorrecto → denied", async () => {
    const token = await tokenFor("s");
    assert.equal(await checkAccess({ secret: "s", production: true, cookie: token }), "ok");
    assert.equal(await checkAccess({ secret: "s", production: true, cookie: "x".repeat(64) }), "denied");
    assert.equal(await checkAccess({ secret: "s", production: true, cookie: await tokenFor("otro") }), "denied");
  });
  test("Authorization: Bearer <secreto> → ok; con otro secreto → denied", async () => {
    assert.equal(await checkAccess({ secret: "s", production: true, authorization: "Bearer s" }), "ok");
    assert.equal(await checkAccess({ secret: "s", production: true, authorization: "Bearer t" }), "denied");
    assert.equal(await checkAccess({ secret: "s", production: true, authorization: "Basic s" }), "denied");
  });
});

describe("safeNext", () => {
  test("solo rutas internas", () => {
    assert.equal(safeNext("/rutinas?x=1"), "/rutinas?x=1");
    assert.equal(safeNext("/"), "/");
    for (const bad of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "rutinas", "/acceso"]) assert.equal(safeNext(bad), "/", String(bad));
  });
});
