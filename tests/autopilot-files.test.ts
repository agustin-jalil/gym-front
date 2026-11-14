import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAutopilotData } from "../lib/server/autopilot-files.ts";

const RUTINA = "## ESTADO DE LAS VERSIONES\n\n- v0.2: COMPLETA\n\n## Backlog v0.2\n\n- [x] T1 · **Uno:** x. · depende: nada\n";
const RESULTADOS = "## Sesiones\n\n### 2026-01-02 10:00 (UTC) · T1 · Uno\n- Resultado: OK\n";

let dir: string;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "autopilot-"));
});
after(() => rm(dir, { recursive: true, force: true }));

async function fresh(files: Record<string, string>): Promise<string> {
  const d = await mkdtemp(join(dir, "case-"));
  for (const [name, content] of Object.entries(files)) await writeFile(join(d, name), content);
  return d;
}

describe("readAutopilotData", () => {
  test("lee y parsea los tres archivos", async () => {
    const d = await fresh({ "RUTINA.MD": RUTINA, "RESULTADOS.MD": RESULTADOS, "VERSIONES.MD": "# V" });
    const r = await readAutopilotData(d);
    assert.ok(r.ok);
    assert.equal(r.data.rutina.versions[0].version, "v0.2");
    assert.equal(r.data.resultados.sessions.length, 1);
  });

  test("falta un archivo: error tipado con el nombre", async () => {
    const d = await fresh({ "RUTINA.MD": RUTINA, "VERSIONES.MD": "# V" });
    const r = await readAutopilotData(d);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error.code, "missing-file");
      assert.equal(r.error.file, "RESULTADOS.MD");
    }
  });

  test("archivo con formato inválido: error con el archivo", async () => {
    const d = await fresh({ "RUTINA.MD": "hola", "RESULTADOS.MD": RESULTADOS, "VERSIONES.MD": "# V" });
    const r = await readAutopilotData(d);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.error.code, "invalid-format");
      assert.equal(r.error.file, "RUTINA.MD");
    }
  });

  test("archivo vacío: error empty", async () => {
    const d = await fresh({ "RUTINA.MD": RUTINA, "RESULTADOS.MD": " \n", "VERSIONES.MD": "# V" });
    const r = await readAutopilotData(d);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.code, "empty");
  });

  test("el mensaje de error no filtra rutas del servidor", async () => {
    const d = await fresh({});
    const r = await readAutopilotData(d);
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(!r.error.message.includes(d));
  });
});
