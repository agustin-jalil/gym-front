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
| 2 | 3 | 0 | 2 | ~4 | NO DISPONIBLE | 2026-11-13 |

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

