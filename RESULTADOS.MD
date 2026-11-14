# RESULTADOS — Control del autopilot

Informe de cada sesión automática que abrió una rama de trabajo. Sirve para auditar qué hizo el agente, si lo verificó
de verdad y dónde se trabó. Las sesiones que no hacen nada (versión `COMPLETA`, tope de PRs abiertos) **no** escriben acá.

Reglas de escritura (para el agente):
- Una entrada por sesión, **al principio** de "Sesiones" (la más nueva arriba), en la rama de la versión (`auto/<versión>`). Si la sesión tocó varias tareas, listarlas todas en la misma entrada.
- Solo hechos. Si un comando falló, pegar la línea de error relevante. Si algo no se pudo verificar, decir **NO VERIFICADO** y por qué.
- No inflar: "build pasó" solo si se corrió y pasó en esa sesión.

## Resumen acumulado

| Sesiones | Tareas OK | Tareas con bloqueo | PRs abiertos hoy | Duración media (min) | Tiempo medio al 90 % (min) | Última actualización |
|---|---|---|---|---|---|---|
| 7 | 11 | 0 | 2 | ~6 | NO DISPONIBLE | 2026-11-14 |

> El agente actualiza esta fila en cada entrada.

## Plantilla de entrada

```
### AAAA-MM-DD HH:MM (UTC) · Tn · título corto
- Resultado: OK | OK con salvedades | BLOQUEADA | FALLÓ
- Rama / PR: auto/tn-slug · #número o "sin PR (rama pusheada)"
- Qué hizo: 2–4 líneas.
- Archivos tocados: lista corta.
- Verificación:
  - pnpm typecheck: PASÓ | FALLÓ (línea de error) | NO CORRIDO
  - pnpm build: PASÓ | FALLÓ | NO CORRIDO
  - node --test: PASÓ (n tests) | FALLÓ | NO APLICA
  - Contra Postgres real: SÍ | NO VERIFICADO (motivo)
- Decisiones tomadas y por qué: viñetas.
- Problemas / PREGUNTAS para el usuario: viñetas, o "ninguno".
- Dependencias agregadas: ninguna | nombre y motivo.
- Tareas que quedaron desbloqueadas / siguiente sugerida: Tn.
- Esfuerzo: nº aproximado de comandos y reintentos de verificación; costo/tokens si la sesión los informa.
- Tiempos:
  - Inicio / fin (UTC, de `date -u` al empezar y al terminar) y duración total en minutos.
  - Tiempo hasta el 90 % del uso de la sesión: `NN min` si la sesión muestra o informa el porcentaje de uso/contexto;
    `NO LLEGÓ al 90 % (máx. NN %)` si terminó antes; `NO DISPONIBLE` si no hay forma de medirlo. No estimar ni inventar.
```

## Sesiones

### 2026-11-14 06:55 (UTC) · T11 · Carga sugerida en /entrenar/[id]
- Resultado: OK con salvedades
- Rama / PR: auto/v0.2 · borrador existente
- Qué hizo: `lib/suggestions.ts` (historial real → formato de `suggestLoad`, solo series hechas) con 6 tests; en `/entrenar/[id]` cada ejercicio muestra la sugerencia con su explicación y "Aceptar sugerencia" (completa kg y reps de las series pendientes; todo sigue editable a mano); selector de RPE opcional por serie (5–10 en pasos de 0,5). Se corrigió la cabecera de la grilla de series (alineación de columnas).
- Archivos tocados: lib/suggestions.ts, tests/suggestions.test.ts, app/entrenar/[id]/page.tsx, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - node --test: PASÓ (127 tests, con DATABASE_URL)
  - Contra Postgres real: SÍ. Smoke con Playwright (390 px): sugerencia visible, RPE 8 guardado en `workout_sets` tras "Terminar", sugerencia que cambia con el historial (sesión incompleta → repetir), "Aceptar" aplica 62,5 kg × 8 a las series pendientes.
  - NO VERIFICADO: medium/expanded y modo claro; el caso de cambio de tipo de rutina en la UI.
- Decisiones tomadas y por qué:
  - Aviso de honestidad: los tests de `lib/suggestions.ts` se escribieron junto con la implementación (no se vio el rojo previo); la lógica de reglas ya tenía sus tests en T10.
  - `Session` no guarda el tipo de rutina de la época, así que el historial se considera del tipo actual: el caso "cambio de tipo" de `suggestLoad` no se dispara desde la UI. Dejarlo así es lo conservador.
  - Rango de reps y paso de carga son los del tipo (por defecto 2,5 kg); el descanso sugerido se muestra pero no se aplica solo.
  - Sin carga previa no hay botón "Aceptar" (la primera carga la elige la persona).
- Problemas / PREGUNTAS para el usuario:
  - PREGUNTA: ¿guardar el tipo de rutina (o el incremento mínimo por ejercicio) en cada entrenamiento para que el cambio de tipo y las mancuernas se contemplen? Requiere migración; no se hizo.
- Dependencias agregadas: ninguna
- Tareas que quedaron desbloqueadas / siguiente sugerida: T12 (T9 y T11 hechas); T13 también elegible
- Esfuerzo: ~20 comandos, 3 reintentos del smoke (servidor viejo sin matar, base sin rutinas, columnas de la grilla).
- Tiempos: inicio 06:53 UTC / fin 06:55 UTC (de `date -u`), ~2 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 06:53 (UTC) · T9 · Medidas corporales (front)
- Resultado: OK
- Rama / PR: auto/v0.2 · borrador existente
- Qué hizo: lógica pura `lib/measurement-history.ts` (variación por campo, formato, parseo de campos con coma/punto) con 24 tests; pantalla `/medidas` (formulario de alta/edición, historial, borrado con confirmación, estados de carga/vacío/error); entrada "Medidas" en la navegación (riel y barra lateral; fuera de la barra inferior, que ya tiene 5).
- Archivos tocados: lib/measurement-history.ts, tests/measurement-history.test.ts, app/medidas/page.tsx, components/app-shell.tsx, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ (`/medidas` listada)
  - node --test: PASÓ (121 tests, con DATABASE_URL). Tests nuevos vistos en rojo antes (módulo inexistente).
  - Contra Postgres real: SÍ. Migraciones desde base vacía y segunda corrida "al día". Smoke con `next start` + Playwright: alta de 2 mediciones, variación "−1,5 cm" visible y persistente tras recargar, edición con error de validación y luego guardado ("−1 cm"), borrado (queda 1 en la API), captura en 390 px sin desborde.
  - NO VERIFICADO: estado de error de carga y "Reintentar" en `/medidas`; layout en medium/expanded (solo se miró compact); modo claro.
- Decisiones tomadas y por qué:
  - Variación = diferencia con la última medición anterior que tenga ese campo (no solo la inmediata), redondeada a 1 decimal. Así un campo omitido una vez no pierde su comparación.
  - La pantalla pide los datos directo a `/api/measurements` (no pasa por `lib/store.ts`, cuya interfaz no incluye medidas).
  - Fechas en UTC (AAAA-MM-DD), mostradas con año.
  - Se exige al menos una medida por medición.
- Problemas / PREGUNTAS para el usuario:
  - Observación: los tests de repositorios dejan filas en `body_measurements` de la base usada (no la limpian); usar una base de pruebas aparte.
- Dependencias agregadas: ninguna
- Tareas que quedaron desbloqueadas / siguiente sugerida: T11 (T13 también elegible); T12 necesita T11
- Esfuerzo: ~25 comandos, 3 reintentos del smoke (base con datos de tests, regex de fecha, breakpoint `compact` inexistente).
- Tiempos: inicio 06:48 UTC / fin 06:53 UTC, ~5 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 05:10 (UTC) · T7 · Importar datos locales
- Resultado: OK
- Rama / PR: auto/v0.2
- Qué hizo: `lib/legacy-import.ts` (plan puro: ejercicios propios, rutinas que no son de ejemplo y sesiones con series hechas; los de ejemplo se referencian por su uuid de semilla), `lib/server/legacy-import.ts` (uuid v5-like determinista por sha1, inserción transaccional que omite lo ya existente y las series de ejercicios que ya no existen), `POST /api/import`, `gym.importLegacy()` / `gym.legacyImported()` y botón en `/ajustes` (deshabilitado tras importar; marca en `gym:v1:imported`). No borra ni modifica `gym:v1`.
- Archivos tocados: lib/legacy-import.ts, lib/server/{legacy-import,routines}.ts, app/api/import/route.ts, lib/store.ts, app/ajustes/page.tsx, tests/legacy-import*.test.ts, README.md, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm test: PASÓ, 109 tests (los de lógica se vieron fallar antes por módulo inexistente; 2 fallos posteriores fueron errores del propio test: ids no-uuid y `push` vs `seed-push`, corregidos en el test, no en la implementación)
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - Contra Postgres real: SÍ (repositorio: importar, repetir sin duplicar, respaldo inválido). Navegador (Playwright, `next start`): `gym:v1` sembrado → clic en el botón → `/api/import` 200 → mensaje «Importado: 1 entrenamientos, 0 rutinas y 1 ejercicios propios» → `/historial` muestra los datos desde la base.
- Decisiones:
  - Rutinas importadas quedan como `hipertrofia` (v0.1 no tenía tipo). Ediciones locales a las rutinas de ejemplo no se importan (las de ejemplo ya están en la base).
  - RPE no existía en `gym:v1`; las series importadas quedan sin RPE. `restSec` por ejercicio no se guarda (igual que T6).
  - Un respaldo con series de ejercicios borrados del catálogo importa el resto y cuenta lo omitido.
- Problemas / PREGUNTAS para el usuario: ninguno nuevo (sigue abierta la de T6 sobre reintento si falla guardar un entrenamiento).
- Dependencias agregadas: ninguna
- Tareas desbloqueadas / siguiente sugerida: T9 (T8 ✓), T11 (T6 ✓, T10 ✓), T13 (T4 ✓)
- Tiempos: inicio 04:57 UTC / fin 05:10 UTC, ~13 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 04:55 (UTC) · T6 · Entrenamientos y series en Postgres
- Resultado: OK con salvedades
- Rama / PR: auto/v0.2
- Qué hizo: `lib/workouts.ts` (validación pura de entrenamiento terminado: series, peso, reps, RPE 1–10 en pasos de 0,5), `lib/server/workouts.ts` (crear transaccional, listar, leer, borrar), `/api/workouts` y `/api/workouts/[id]`, migración `0003` (`workouts.routine_name`, para conservar el nombre si la rutina se borra), mapeos `toSession`/`toWorkoutInput`, `LoggedSet.rpe?`. `lib/store.ts` carga el historial de la API, guarda al terminar, borra y resetea vía API; en `localStorage` queda solo el borrador y `sessions` viejas intactas para T7.
- Archivos tocados: lib/{workouts,types,api-mappers,store}.ts, lib/server/{workouts,routines}.ts, app/api/workouts/**, app/ajustes/page.tsx, db/migrations/0003_workout_routine_name.sql, tests/workouts-*.test.ts, README.md, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm test: PASÓ, 99 tests (los nuevos se vieron fallar antes por módulo inexistente)
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - Contra Postgres real: SÍ (Postgres 16 local; `db:migrate` sobre base vacía y segunda corrida sin cambios; smoke con `next start`+curl: 201, 400 por cuerpo inválido, 409 por ejercicio inexistente, 204 y 404 al borrar)
  - Pantallas `/historial`, `/entrenar/[id]` e inicio: NO VERIFICADAS en navegador (solo typecheck/build); no usan aún RPE (T11).
- Decisiones:
  - El borrador sigue local; solo se envía el entrenamiento al terminarlo, con las series hechas.
  - `restSec` por ejercicio no se guarda en la base; el historial lo devuelve en 0.
  - `importJson` restaura solo el borrador (el historial viene de la base); la importación del historial es T7.
  - Si el POST al terminar falla, el store muestra `syncError` y recarga desde el servidor: el entrenamiento terminado sin guardar se pierde. PREGUNTA: ¿querés reintento/cola local persistente? (más conservador no cerrar puertas: se dejó simple).
- Problemas / PREGUNTAS para el usuario: la de arriba.
- Dependencias agregadas: ninguna
- Tareas desbloqueadas / siguiente sugerida: T7, T11 (necesita T10 ✓ y T6 ✓), T13
- Tiempos: inicio 04:47 UTC / fin 04:55 UTC, ~8 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 03:00 (UTC) · T8 · Medidas corporales (back)
- Resultado: OK
- Rama / PR: auto/v0.2
- Qué hizo: `lib/measurements.ts` (campos, `parseMeasurement`: fecha calendario real, valores >0 y ≤500, todo opcional salvo la fecha), `lib/server/measurements.ts` (list/get/create/update/delete; `numeric` → número, fecha como `AAAA-MM-DD` vía `to_char` para evitar desfases de zona horaria) y API `GET/POST /api/measurements`, `GET/PUT/DELETE /api/measurements/[id]`. La tabla ya existía desde T1 (sin migración nueva).
- Archivos tocados: lib/measurements.ts, lib/server/measurements.ts, app/api/measurements/route.ts, app/api/measurements/[id]/route.ts, tests/measurements-validation.test.ts, tests/measurements-repo.test.ts, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm test: PASÓ, 80 tests, 0 omitidos (los nuevos se vieron fallar antes por módulo inexistente; un fallo posterior fue de import sin extensión `.ts` en runtime Node, corregido)
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - Contra Postgres real: SÍ (Postgres 16 local en puerto 5433 levantado con los binarios del sistema; `pnpm db:migrate` desde base vacía aplicó 0001 y 0002). Humo de la API con `next start`: POST 201, fecha inválida 400, valor negativo 400, GET lista, PUT, DELETE 204 y luego 404.
  - Segunda corrida de `db:migrate` (idempotencia) NO repetida en esta sesión (sin cambios de esquema).
- Decisiones: PUT reemplaza todos los campos (igual que rutinas); límite superior 500 (kg o cm) como cordura de entrada, más estricto que el `numeric` de la base.
- Problemas / PREGUNTAS para el usuario: ninguno
- Dependencias agregadas: ninguna
- Tareas desbloqueadas / siguiente sugerida: T9 (front de medidas), T6
- Tiempos: inicio 03:00 UTC / fin 03:10 UTC, ~10 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 02:52 (UTC) · T10 · Lógica de progresión de cargas
- Resultado: OK
- Rama / PR: auto/v0.2
- Qué hizo: `lib/progression.ts` con `suggestLoad` (hipertrofia: progresión doble, +2,5 % redondeado al incremento, deload 5/10 % tras 2 sesiones bajo el piso; estrés metabólico: reps → menos descanso (−5 s, mínimo 30 s) → +2,5 % con descanso mínimo). Casos borde: sin historial, series con reps 0 / valores inválidos, sesión incompleta (`plannedSets`), cambio de tipo, RPE > 9, rangos e incremento configurables.
- Archivos tocados: lib/progression.ts, tests/progression.test.ts, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm test: PASÓ (56 tests; los de progresión se vieron fallar antes por módulo inexistente; 1 test de deload metabólico y 1 de cambio de tipo se ajustaron tras ver el rojo porque el dato/expectativa del test era inconsistente con la regla, no la lógica)
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - Contra Postgres real: NO APLICA (lógica pura)
- Decisiones (interpretaciones de la spec, revisables):
  - Carga de una sesión = kg más alto usado; "todas las series al tope" = la serie más floja llega al tope.
  - Deload 10 % si faltan 3+ reps al piso en la última sesión, si no 5 %; siempre baja al menos un incremento.
  - Sesión incompleta: no progresa ni cuenta para deload. Cambio de tipo: conserva kg y reinicia al piso del nuevo rango (descanso 120 s hipertrofia / 60 s metabólico).
  - Metabólico sin descanso registrado: se asume 60 s, así que primero baja descanso.
- Problemas / PREGUNTAS para el usuario: ninguno
- Dependencias agregadas: ninguna
- Tareas desbloqueadas / siguiente sugerida: T6 (T8 también elegible); T11 espera a T6
- Tiempos: inicio 02:50 UTC / fin 03:00 UTC, ~10 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-14 02:48 (UTC) · T5 · Tipo de rutina en el editor
- Resultado: OK
- Rama / PR: auto/v0.2
- Qué hizo: `lib/routine-types.ts` (rangos de reps y descanso por tipo, `defaultExercise`, `adaptToType`), `gym.setRoutineType` en el store, selector accesible (`aria-pressed`) en `/rutinas/[id]` con el rango del tipo; los ejercicios nuevos nacen con los valores por defecto del tipo y al cambiar de tipo reps/descanso se llevan al nuevo rango (series y kg intactos).
- Archivos tocados: lib/routine-types.ts, tests/routine-types.test.ts, lib/store.ts, app/rutinas/[id]/page.tsx, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm test: PASÓ (26 tests; los 6 nuevos se vieron fallar antes por módulo inexistente)
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - Contra Postgres real: NO VERIFICADO (no hay servidor Postgres en esta sesión; T5 no toca SQL, pero el guardado de `type` por la API no se probó de punta a punta). UI no probada en navegador.
- Decisiones: la rutina guarda reps como un único valor (tope del rango) porque así lo hace el mapper de T4; el descanso por defecto es 120 s (hipertrofia) y 45 s (metabólico), puntos medios del rango.
- Problemas / PREGUNTAS para el usuario: ninguno
- Dependencias agregadas: ninguna
- Tareas desbloqueadas / siguiente sugerida: T6 (T8, T10 también elegibles)
- Tiempos: inicio 02:47 UTC / fin 02:50 UTC, ~3 min. Tiempo al 90 %: NO DISPONIBLE.

<!-- Entradas nuevas arriba de esta línea, debajo del título. -->

### 2026-11-14 00:47 (UTC) · T4 · Store contra la API
- Resultado: OK con salvedades
- Rama / PR: auto/v0.2 · #2 (borrador)
- Qué hizo: `lib/store.ts` ahora carga rutinas y ejercicios de `/api` y los guarda con cambios optimistas, cola de escrituras en orden y guardado agrupado (400 ms) de la rutina en edición; si una escritura falla muestra un aviso y recarga del servidor. Historial y entrenamiento en curso siguen en `gym:v1`. Migración `0002_seed.sql` con el catálogo y las 3 rutinas de ejemplo (uuid fijos, idempotente). Mapeadores puros `lib/api-mappers.ts`, traducción de ids viejos `lib/legacy-ids.ts`, `lib/uuid.ts` (sin `crypto.randomUUID`, que no existe en http fuera de localhost). La API acepta `id` opcional elegido por el cliente. Pantallas: `GymLoading` (carga/error/reintentar) y banner de error de guardado.
- Archivos tocados: lib/{store,types,seed,validation,api-mappers,legacy-ids,uuid}.ts, lib/server/{exercises,routines}.ts, db/migrations/0002_seed.sql, components/{gym-loading,app-shell}.tsx, app/**/page.tsx, tests/*, README.md, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm test: PASÓ (29 tests, con DATABASE_URL; 8 de repositorios contra Postgres). Tests nuevos vistos en rojo antes de implementar (módulos inexistentes / assert).
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ
  - Contra Postgres real: SÍ. `db:migrate` 2 migraciones desde base vacía y segunda corrida "al día". Smoke con `next start` + Playwright: semillas visibles, crear rutina (POST), agregar ejercicio (PUT), persiste tras recargar, historial viejo de `gym:v1` con ids 'press-banca' muestra el nombre, y con Postgres apagado aparece el estado de error con "Reintentar".
  - NO VERIFICADO: botón "Reintentar" reconectando, banner de error de guardado y borrado de ejercicio con 409 en el navegador; solo se vio el estado de error de carga.
- Decisiones tomadas y por qué:
  - Una rutina del front (días de la semana + lista plana) se guarda como un `routine_day` por día de la semana con los mismos ejercicios; sin días, un único día sin weekday. Reps del front = `repsMin = repsMax`. Al leer un rango se toma el tope; guardar una rutina con rango lo aplana (el editor de T5 deberá manejar rangos).
  - Los ids de `gym:v1` de ejemplo se traducen a los uuid de la base al leer el historial (1 a 1); `gym:v1` conserva sus `exercises`/`routines` originales para T7. Los ids de ejercicios propios viejos no se pueden traducir (aparecerán como "Ejercicio eliminado" hasta T7).
  - `importJson` restaura solo historial y entrenamiento en curso; `reset` borra solo el historial local. Textos de `/ajustes` ajustados en consecuencia.
  - Los tests de repositorios hacen `truncate` de rutinas/ejercicios: usar una base de pruebas distinta de la de desarrollo.
- Problemas / PREGUNTAS para el usuario:
  - PREGUNTA: ¿`reset` debería también borrar rutinas/ejercicios del servidor? Se eligió lo conservador (no tocarlos).
  - PREGUNTA: el respaldo JSON no importa rutinas/ejercicios hasta T7; se dejó así.
- Dependencias agregadas: ninguna
- Tareas que quedaron desbloqueadas / siguiente sugerida: T5, T6, T13 (T8, T10 ya elegibles); siguiente: T5
- Esfuerzo: ~35 comandos, 3 reintentos de verificación (fallo de test por `id: undefined`, tipos en test de mapeadores, base contaminada por el truncate).
- Tiempos: inicio 00:47 UTC / fin 00:53 UTC, ~6 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-13 22:48 (UTC) · T2, T3 · Repositorios y API de rutinas/ejercicios
- Resultado: OK con salvedades
- Rama / PR: auto/v0.2 · #2 (borrador)
- Qué hizo: T2 repositorios `lib/server/exercises.ts` y `routines.ts` (rutinas anidadas, creación/actualización transaccional). T3 validación pura `lib/validation.ts` y route handlers `/api/exercises`, `/api/exercises/[id]`, `/api/routines`, `/api/routines/[id]`, con errores claros y sin filtrar detalles de pg (`lib/server/http.ts`). Script `pnpm test` y `allowImportingTsExtensions` en tsconfig (necesario para que los tests importen `.ts` con `node --test`).
- Archivos tocados: lib/server/{exercises,routines,http}.ts, lib/validation.ts, app/api/**, tests/*.test.ts, package.json, tsconfig.json, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm typecheck: PASÓ
  - pnpm build: PASÓ (rutas /api listadas como dinámicas)
  - node --test: PASÓ (15 tests: 8 repositorios contra Postgres, 7 validación)
  - Contra Postgres real: SÍ (Postgres 16 local; smoke de la API con `next start` y curl: 201, 400 JSON/uuid/tipo inválido, 404)
- Decisiones tomadas y por qué:
  - Los repositorios reciben `db` (Pool/Client) por parámetro: testeables sin mocks; las rutas pasan `getPool()`.
  - `RouteContext` de Next solo existe tras build; se usó un tipo explícito para que `typecheck` funcione en checkout limpio.
  - Los tests de repositorios se saltan si no hay `DATABASE_URL`; en la sesión se corrieron con ella definida.
  - Aviso de honestidad: en T2 los tests se escribieron junto con la implementación (no se vio el rojo previo); en T3 sí se vio fallar por módulo inexistente.
  - `.next` era línea base: typecheck/build ya pasaban en main.
- Problemas / PREGUNTAS para el usuario: ninguno
- Dependencias agregadas: ninguna
- Tareas que quedaron desbloqueadas / siguiente sugerida: T4 (T8, T10 también elegibles)
- Esfuerzo: ~25 comandos, 2 reintentos de verificación (tsconfig para imports .ts; RouteContext).
- Tiempos: inicio 22:48 UTC / fin 22:52 UTC, ~4 min. Tiempo al 90 %: NO DISPONIBLE.

### 2026-11-13 21:48 (UTC) · T1 · Capa de base de datos
- Resultado: OK
- Rama / PR: auto/T1-capa-db · sin PR (rama pusheada)
- Qué hizo: agregó `pg`, `lib/server/db.ts` (pool singleton, `server-only`), runner `pnpm db:migrate` (transaccional por archivo, lock advisory, tabla `schema_migrations`), `0001_init.sql` con todo el modelo de VERSIONES.MD, `.env.example` y sección en README.
- Archivos tocados: package.json, pnpm-lock.yaml, lib/server/db.ts, scripts/migrate.mjs, db/migrations/0001_init.sql, .env.example, .gitignore, README.md, RUTINA.MD, VERSIONES.MD, RESULTADOS.MD
- Verificación:
  - pnpm typecheck: PASÓ (línea base también pasaba)
  - pnpm build: PASÓ (línea base también pasaba)
  - node --test: NO APLICA (T10 crea el script de tests)
  - Contra Postgres real: SÍ (Postgres 16 local; `pnpm db:migrate` desde base vacía creó 8 tablas, segunda corrida: "base al día"; sin DATABASE_URL sale con error claro). `lib/server/db.ts` NO se ejecutó en runtime (aún nadie lo usa), solo typecheck/build.
- Decisiones tomadas y por qué:
  - Runner en `scripts/migrate.mjs` (Node puro, `--env-file-if-exists=.env.local`) para no depender de TS ni de nuevas dependencias.
  - Test primero no aplicado: no hay lógica pura; se verificó ejecutando el runner dos veces.
  - Se agregó `server-only` (permitido) y `@types/pg` como devDependency (necesario para TS estricto sin `any`; solo tipos).
- Problemas / PREGUNTAS para el usuario: PREGUNTA: confirmar que `@types/pg` (solo tipos, dev) es aceptable.
- Dependencias agregadas: pg, server-only, @types/pg (dev)
- Tareas que quedaron desbloqueadas / siguiente sugerida: T2, T8 (T10 no depende de nada)
- Esfuerzo: ~12 comandos, 0 reintentos de verificación.
- Tiempos: inicio 21:48 UTC / fin 21:50 UTC, ~2 min. Tiempo al 90 %: NO DISPONIBLE.

