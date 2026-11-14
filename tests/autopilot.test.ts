import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseResultados, parseRutina } from "../lib/autopilot.ts";

const RUTINA = `# RUTINA

## ESTADO DE LAS VERSIONES

- v0.2: COMPLETA
- v0.3: EN CURSO
- v0.4: PLANIFICADA (sin backlog: no se empieza)

**Versión ACTUAL** = la primera.

## Backlog v0.2

> Formato: \`- [ ] Tn · descripción · depende: Tx\`.

- [x] T1 · **Capa de base de datos:** agregar \`pg\`. Documentar.
- [ ] T2 · **Repositorios:** funciones en \`lib/server/\`. · depende: T1
- [ ] T3 · **API:** CRUD. · depende: T1, T2
  BLOQUEO: falta una decisión del usuario.
- [ ] T4 · **Otra:** sin dependencias reales. · depende: nada

## Backlog v0.3

- [ ] T15 · **Parser:** todo. · depende: nada

## Registro
- [x] T99 · esto no es del backlog
`;

describe("parseRutina", () => {
  test("estados de versión con nota opcional", () => {
    const r = parseRutina(RUTINA);
    assert.ok(r.ok);
    assert.deepEqual(r.data.versions, [
      { version: "v0.2", state: "COMPLETA", note: null },
      { version: "v0.3", state: "EN CURSO", note: null },
      { version: "v0.4", state: "PLANIFICADA", note: "sin backlog: no se empieza" },
    ]);
  });

  test("tareas con estado, título y dependencias", () => {
    const r = parseRutina(RUTINA);
    assert.ok(r.ok);
    const v02 = r.data.backlogs.find((b) => b.version === "v0.2");
    assert.ok(v02);
    assert.deepEqual(v02.tasks.map((t) => [t.id, t.done]), [["T1", true], ["T2", false], ["T3", false], ["T4", false]]);
    assert.equal(v02.tasks[0].title, "Capa de base de datos");
    assert.deepEqual(v02.tasks[0].dependsOn, []);
    assert.deepEqual(v02.tasks[1].dependsOn, ["T1"]);
    assert.deepEqual(v02.tasks[2].dependsOn, ["T1", "T2"]);
    assert.deepEqual(v02.tasks[3].dependsOn, []);
  });

  test("BLOQUEO bajo la tarea", () => {
    const r = parseRutina(RUTINA);
    assert.ok(r.ok);
    const [, , t3, t4] = r.data.backlogs[0].tasks;
    assert.equal(t3.blocked, "falta una decisión del usuario.");
    assert.equal(t4.blocked, null);
  });

  test("no mezcla líneas de otras secciones ni la plantilla de formato", () => {
    const r = parseRutina(RUTINA);
    assert.ok(r.ok);
    assert.equal(r.data.backlogs.length, 2);
    assert.equal(r.data.backlogs[1].tasks.length, 1);
  });

  test("versión sin backlog no genera entrada vacía inventada", () => {
    const r = parseRutina(RUTINA);
    assert.ok(r.ok);
    assert.equal(r.data.backlogs.find((b) => b.version === "v0.4"), undefined);
  });

  test("texto vacío: error tipado", () => {
    const r = parseRutina("");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.code, "empty");
  });

  test("sin sección de estado: formato inválido", () => {
    const r = parseRutina("# otra cosa\n\nhola\n");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.code, "invalid-format");
  });

  test("estado desconocido: formato inválido", () => {
    const r = parseRutina("## ESTADO DE LAS VERSIONES\n\n- v0.2: QUIEN SABE\n");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.code, "invalid-format");
  });

  test("tolera CRLF", () => {
    const r = parseRutina(RUTINA.replaceAll("\n", "\r\n"));
    assert.ok(r.ok);
    assert.equal(r.data.backlogs[0].tasks[1].dependsOn[0], "T1");
  });
});

const RESULTADOS = `# RESULTADOS

## Resumen acumulado

| Sesiones | Tareas OK | Tareas con bloqueo | PRs abiertos hoy | Duración media (min) | Tiempo medio al 90 % (min) | Última actualización |
|---|---|---|---|---|---|---|
| 8 | 14 | 0 | 2 | ~6 | NO DISPONIBLE | 2026-11-14 |

## Plantilla de entrada

\`\`\`
### AAAA-MM-DD HH:MM (UTC) · Tn · título corto
- Resultado: OK | OK con salvedades
\`\`\`

## Sesiones

### 2026-11-14 08:47 (UTC) · T12, T14 · Cierre de v0.2
- Resultado: OK con salvedades
- Verificación:
  - pnpm test: PASÓ (139 tests)
  - pnpm typecheck: PASÓ
  - pnpm build: FALLÓ (error de tipos)
- Tiempos: inicio 08:47 UTC / fin ~09:05 UTC. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 06:57 (UTC) · T13 · Acceso protegido
- Resultado: OK
- Verificación:
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - node --test: PASÓ (29 tests)
- Tiempos: inicio 06:50 UTC / fin 06:57 UTC, ~7 min. Tiempo al 90 %: 42 min.

### 2026-11-13 21:48 (UTC) · T1 · Capa de base de datos
- Resultado: OK
- Verificación:
  - node --test: NO APLICA (T10 crea el script de tests)
  - pnpm typecheck: NO CORRIDO
`;

describe("parseResultados", () => {
  test("tabla resumen", () => {
    const r = parseResultados(RESULTADOS);
    assert.ok(r.ok);
    assert.deepEqual(r.data.summary, {
      sessions: "8",
      tasksOk: "14",
      tasksBlocked: "0",
      openPrs: "2",
      avgDurationMin: "~6",
      avgTimeTo90Min: "NO DISPONIBLE",
      updatedAt: "2026-11-14",
    });
  });

  test("sesiones en orden, ignorando la plantilla", () => {
    const r = parseResultados(RESULTADOS);
    assert.ok(r.ok);
    assert.equal(r.data.sessions.length, 3);
    const [a, b, c] = r.data.sessions;
    assert.equal(a.date, "2026-11-14");
    assert.equal(a.time, "08:47");
    assert.deepEqual(a.tasks, ["T12", "T14"]);
    assert.equal(a.title, "Cierre de v0.2");
    assert.equal(a.result, "OK con salvedades");
    assert.deepEqual(b.tasks, ["T13"]);
    assert.deepEqual(c.tasks, ["T1"]);
  });

  test("estados de typecheck/build/tests", () => {
    const r = parseResultados(RESULTADOS);
    assert.ok(r.ok);
    const [a, b, c] = r.data.sessions;
    assert.deepEqual(a.verification, { typecheck: "pass", build: "fail", tests: "pass" });
    assert.deepEqual(b.verification, { typecheck: "pass", build: "pass", tests: "pass" });
    assert.deepEqual(c.verification, { typecheck: "not-run", build: null, tests: "not-run" });
  });

  test("duración: explícita, calculada desde inicio/fin, o desconocida", () => {
    const r = parseResultados(RESULTADOS);
    assert.ok(r.ok);
    const [a, b, c] = r.data.sessions;
    assert.equal(a.durationMin, 18);
    assert.equal(b.durationMin, 7);
    assert.equal(c.durationMin, null);
  });

  test("tiempo al 90 %", () => {
    const r = parseResultados(RESULTADOS);
    assert.ok(r.ok);
    const [a, b, c] = r.data.sessions;
    assert.equal(a.timeTo90, "NO DISPONIBLE");
    assert.equal(b.timeTo90, "42 min");
    assert.equal(c.timeTo90, null);
  });

  test("sin sesiones: ok con lista vacía", () => {
    const r = parseResultados("# RESULTADOS\n\n## Sesiones\n\n");
    assert.ok(r.ok);
    assert.deepEqual(r.data.sessions, []);
    assert.equal(r.data.summary, null);
  });

  test("texto vacío: error tipado", () => {
    const r = parseResultados("   \n");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.code, "empty");
  });

  test("sin sección Sesiones: formato inválido", () => {
    const r = parseResultados("# RESULTADOS\n\ntexto libre\n");
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error.code, "invalid-format");
  });

  test("encabezado de sesión malformado se omite sin romper", () => {
    const r = parseResultados("## Sesiones\n\n### sin formato\n- Resultado: OK\n\n### 2026-01-02 10:00 (UTC) · T1 · Bien\n- Resultado: OK\n");
    assert.ok(r.ok);
    assert.equal(r.data.sessions.length, 1);
    assert.equal(r.data.sessions[0].title, "Bien");
  });

  test("fin antes del inicio (cruza medianoche) suma un día", () => {
    const r = parseResultados("## Sesiones\n\n### 2026-01-02 23:50 (UTC) · T1 · X\n- Tiempos: inicio 23:50 UTC / fin 00:10 UTC.\n");
    assert.ok(r.ok);
    assert.equal(r.data.sessions[0].durationMin, 20);
  });
});

describe("progreso y estado de tareas", () => {
  const t = (id: string, done: boolean, dependsOn: string[] = [], blocked: string | null = null) => ({ id, done, title: id, dependsOn, blocked });

  test("taskProgress cuenta hechas y totales", async () => {
    const { taskProgress } = await import("../lib/autopilot.ts");
    assert.deepEqual(taskProgress([]), { done: 0, total: 0, percent: 0 });
    assert.deepEqual(taskProgress([t("T1", true), t("T2", false), t("T3", true), t("T4", false)]), { done: 2, total: 4, percent: 50 });
    assert.equal(taskProgress([t("T1", true), t("T2", false), t("T3", false)]).percent, 33);
  });

  test("taskStatus: hecha, bloqueada, lista y esperando", async () => {
    const { taskStatus } = await import("../lib/autopilot.ts");
    const all = [t("T1", true), t("T2", false, ["T1"]), t("T3", false, ["T2"]), t("T4", false, [], "motivo"), t("T5", false, ["T9"])];
    assert.equal(taskStatus(all[0], all), "done");
    assert.equal(taskStatus(all[1], all), "ready");
    assert.equal(taskStatus(all[2], all), "waiting");
    assert.equal(taskStatus(all[3], all), "blocked");
    assert.equal(taskStatus(all[4], all), "waiting");
  });
});
