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
| 3 | 4 | 0 | 2 | ~5 | NO DISPONIBLE | 2026-11-14 |

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

