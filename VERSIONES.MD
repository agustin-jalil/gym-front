# VERSIONES — Hoja de ruta de gym-front

Define QUÉ contiene cada versión y cuándo está completa. `RUTINA.MD` ejecuta la versión marcada como **ACTUAL**;
`RESULTADOS.MD` registra cómo trabajó el autopilot.

Estados: `ACTUAL` (se está construyendo) · `HECHA` · `PLANIFICADA`.

---

## v0.1 — Front local · HECHA

Next.js 16 + React 19 + Tailwind v4. Rutinas, entrenamiento con temporizador de descanso, historial, progreso, catálogo
y ajustes. Datos en `localStorage` (clave `gym:v1`) vía `lib/store.ts`.

---

## v0.2 — Backend en Next + Postgres, medidas corporales y manejo de cargas · ACTUAL

### Objetivo

Llevar el progreso real del usuario: guardar todo en **PostgreSQL**, registrar **medidas del cuerpo en cm** y
**sugerir las cargas** de cada ejercicio según la rutina, que puede ser de dos tipos: **hipertrofia** o **estrés metabólico**.

### Restricciones de arquitectura

- **No hay backend desacoplado.** Toda la lógica de la aplicación vive en este proyecto Next (route handlers y/o server actions,
  según lo que indique `node_modules/next/dist/docs/`). Ningún servicio aparte.
- Acceso a Postgres solo desde código de servidor (`server-only`), con `DATABASE_URL` por variable de entorno.
  Nunca commitear `.env`; mantener `.env.example`.
- 2026-11-13 · T2 · Repositorios de servidor de ejercicios y rutinas.
- 2026-11-13 · T3 · API `/api/exercises` y `/api/routines` con validación.
- 2026-11-14 · T4 · `lib/store.ts` lee/escribe rutinas y ejercicios vía API (misma interfaz), migración 0002 con semillas, estados de carga/error.
- Migraciones SQL versionadas en `db/migrations/` con un runner propio chico (`pnpm db:migrate`).
- Driver: `pg` (única dependencia nueva permitida sin pedir permiso). Sin ORM.
- Las pantallas siguen usando `useGym()` / `gym.*`: la interfaz de `lib/store.ts` se mantiene y su implementación pasa a hablar con el servidor.
- Medidas siempre en **centímetros** (peso corporal opcional, en kg). Cargas en kg.

### Modelo de datos (mínimo esperado)

`exercises`, `routines` (con `type`: `hipertrofia` | `estres_metabolico`), `routine_days`, `routine_exercises`
(series, rango de reps, kg, descanso), `workouts`, `workout_sets` (kg, reps, RPE opcional), `body_measurements`
(fecha + cintura, cadera, pecho, hombros, cuello, brazo der/izq, antebrazo, muslo der/izq, pantorrilla; todo en cm, todo opcional salvo la fecha).

### Reglas de manejo de cargas (especificación)

Lógica pura y testeada en `lib/progression.ts`, sin acceso a datos ni a la UI. Entrada: historial de series del ejercicio + tipo de rutina.
Salida: carga sugerida, reps objetivo y una explicación corta de por qué.

**Hipertrofia** — progresión doble:
- Rango objetivo 6–12 reps (configurable por ejercicio), descanso 90–180 s.
- Si en la última sesión todas las series llegaron al tope del rango con RPE ≤ 9 (o sin RPE) → subir carga 2,5 % redondeado al
  incremento mínimo (2,5 kg barra / 1–2 kg mancuerna, configurable).
- Si se llegó al piso pero no al tope → misma carga, apuntar a +1 rep.
- Si se quedó por debajo del piso en 2 sesiones seguidas → bajar carga 5–10 % (deload).

**Estrés metabólico**:
- Rango 12–20 reps, descanso 30–60 s, tempo controlado.
- Progresar primero en reps y en menos descanso; subir carga 2,5 % solo al completar el tope en todas las series con el descanso mínimo.
- Mismo criterio de baja que hipertrofia.

Casos borde obligatorios: ejercicio sin historial (primera carga la ingresa el usuario), sesión incompleta, cambio de tipo de rutina, series con reps en 0.

### Definición de versión completa

- [ ] `pnpm typecheck` y `pnpm build` pasan en `main`.
- [ ] La app corre contra Postgres con `DATABASE_URL`; `pnpm db:migrate` crea todo desde cero.
- [ ] Rutinas, entrenamientos y series se guardan y se leen de Postgres; ya no dependen de `localStorage`.
- [ ] Existe importación única de los datos viejos de `localStorage` (`gym:v1`) hacia la base.
- [ ] Se pueden crear rutinas de tipo hipertrofia y de estrés metabólico desde el editor.
- [ ] Pantalla de medidas: alta, edición, historial y variación en cm entre mediciones.
- [ ] `/entrenar/[id]` muestra la carga sugerida con su explicación, permite aceptarla o ajustarla y guarda RPE opcional.
- [ ] `lib/progression.ts` cubre las reglas de arriba con tests (`node --test`) que pasan, incluidos los casos borde.
- [ ] `/progreso` muestra evolución de cargas y de medidas.
- [ ] Protección de acceso simple (secreto por variable de entorno) antes de exponer la app.
- [ ] README documenta variables de entorno, migraciones y cómo correr todo.

### Cambios de la versión

<!-- El autopilot agrega una línea por tarea mergeada: AAAA-MM-DD · Tn · resumen -->

- 2026-11-14 · T7 · Importación única de `gym:v1` a la base: `POST /api/import` idempotente (ids deterministas), `lib/legacy-import.ts`, botón en `/ajustes`.
- 2026-11-14 · T6 · Entrenamientos y series en Postgres: `/api/workouts`, `lib/workouts.ts`, repositorio, migración 0003 (`routine_name`), RPE opcional por serie; `store` lee/escribe vía API.
- 2026-11-13 · T1 · Capa de base de datos: `pg`, `lib/server/db.ts`, `pnpm db:migrate`, `0001_init.sql`, `.env.example`.
- 2026-11-13 · T2 · Repositorios de servidor (`lib/server/exercises.ts`, `routines.ts`) con tests contra Postgres; script `pnpm test`.
- 2026-11-14 · T5 · Tipo de rutina en el editor: selector hipertrofia / estrés metabólico, rangos y descanso por defecto (`lib/routine-types.ts`).
- 2026-11-14 · T10 · `lib/progression.ts`: carga sugerida (progresión doble, estrés metabólico, deload, casos borde) con 30 tests `node --test`.
- 2026-11-14 · T9 · Medidas corporales (front): pantalla `/medidas` (alta, edición, borrado, historial, variación por campo), `lib/measurement-history.ts`, entrada en la navegación.
- 2026-11-14 · T8 · Medidas corporales (back): `lib/measurements.ts` (validación), `lib/server/measurements.ts` (repositorio) y API `/api/measurements`.

---

## v0.3 — Panel del autopilot (ver el resultado dentro de la app) · PLANIFICADA

Empieza automáticamente cuando v0.2 queda `COMPLETA` (ver `RUTINA.MD`). Parte del código de v0.2.

### Objetivo

Una pantalla `/autopilot` dentro de la propia app que muestre, sin abrir GitHub, cómo avanza el trabajo automático:
estado de cada versión, progreso por tareas y las últimas sesiones con su resultado, duración y verificación.
Sirve para "ver el resultado" del autopilot en la app terminada.

### Restricciones de arquitectura

- Misma regla que v0.2: todo dentro de Next, sin servicios aparte, sin dependencias nuevas.
- La fuente de datos son los archivos del repo (`RUTINA.MD`, `RESULTADOS.MD`, `VERSIONES.MD`), leídos desde el servidor (`server-only`).
  Si un archivo falta o su formato cambió, la pantalla muestra un error claro, no se rompe.
- Parseo en lógica pura (`lib/autopilot.ts`), sin I/O, con tests `node --test`.
- Pantalla de solo lectura. Sin escritura sobre esos archivos.

### Definición de versión completa

- [ ] `pnpm test`, `pnpm typecheck` y `pnpm build` pasan.
- [ ] `lib/autopilot.ts` parsea backlog, estados de versión y tabla/entradas de RESULTADOS.MD, con tests incluidos los casos de formato inválido o vacío.
- [ ] `/autopilot` muestra el estado de cada versión y una barra de progreso por tareas hechas / totales.
- [ ] `/autopilot` lista las tareas con su estado (`[x]`, `[ ]`, bloqueada) y sus dependencias.
- [ ] `/autopilot` muestra las últimas sesiones: fecha, resultado, duración, tiempo al 90 % y estado de typecheck/build/tests.
- [ ] Hay entrada de navegación a `/autopilot`, con estados de carga, vacío y error, usable en compact/medium/expanded.
- [ ] README documenta la pantalla y de dónde saca los datos.

### Cambios de la versión

<!-- El autopilot agrega una línea por tarea: AAAA-MM-DD · Tn · resumen -->

---

## v0.4 — Ideas futuras · PLANIFICADA

Sin comprometer: **no tiene backlog, así que el autopilot no la empieza** hasta que el usuario la defina.

- Fotos de progreso.
- Exportar a CSV.
- Gráficos de proporciones corporales.
