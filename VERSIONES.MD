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

- 2026-11-13 · T1 · Capa de base de datos: `pg`, `lib/server/db.ts`, `pnpm db:migrate`, `0001_init.sql`, `.env.example`.

---

## v0.3 — Ideas futuras · PLANIFICADA

Sin comprometer. No trabajar en esto mientras v0.2 no esté `COMPLETA`.

- Fotos de progreso.
- Exportar a CSV.
- Gráficos de proporciones corporales.
