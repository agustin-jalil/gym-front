# RUTINA — Trabajo automático sobre gym-front (agente en la nube)

Lo lee cada sesión automática al arrancar. Cada sesión es independiente y no recuerda a la anterior:
**el estado está en estos archivos, en la rama de versión `auto/v0.2` y en sus ramas de trabajo `auto/v0.2-wip-*`.**

Objetivo: dejar la versión completa en UNA rama (`auto/v0.2`) con un único PR contra `main`, ya verificado
(test + typecheck + build en verde) para que el usuario solo revise y mergee.

Archivos del sistema:
- `RUTINA.MD` (este): protocolo y backlog.
- `VERSIONES.MD`: qué contiene la versión ACTUAL, arquitectura, reglas de negocio y definición de "completa". Es la fuente de verdad del producto.
- `RESULTADOS.MD`: informe de cada sesión (control del autopilot).
- `ESTANDAR.MD`: pilares técnicos, flujo ideal por tarea y puerta de calidad para cerrar la versión.

## ESTADO DE LA VERSIÓN ACTUAL (v0.2): EN CURSO

> Valores posibles: `EN CURSO` | `BLOQUEADA` | `COMPLETA`.
> **Si dice `COMPLETA` o `BLOQUEADA`: no hacer nada.** No leer código, no crear ramas, no escribir en RESULTADOS.MD.
> Responder solo "Versión completa/bloqueada, sin trabajo automático pendiente" y terminar.
> El valor válido es el de la rama `auto/v0.2` si existe; si no, el de `origin/main`.
> `COMPLETA` en la rama significa "lista para que el usuario mergee"; tras el merge queda en `main`.

## Trabajo en curso

<!-- Solo se escribe en una rama auto/v0.2-wip-*. Formato:
Tn · intentos: N sesiones · probado: ... · falló: ... · próximo paso: ...
-->

## Protocolo de cada sesión

0. `git fetch origin`. Si existe `origin/auto/v0.2`, trabajar sobre ella y leer ESTADO, Backlog y este protocolo **desde esa rama**
   (puede ser más nueva que `main`). Si no existe, leer de `origin/main`. Si el ESTADO es `COMPLETA` o `BLOQUEADA`, terminar de inmediato.
1. Leer `ESTANDAR.MD` (pilares y flujo ideal: obligatorio), `VERSIONES.MD` (versión ACTUAL), `AGENTS.md` y la guía relevante en
   `node_modules/next/dist/docs/` antes de tocar código (este Next.js tiene cambios incompatibles). Si falta `node_modules`, `pnpm install`.
2. **Rama de versión:** si `auto/v0.2` no existe, crearla desde `origin/main` y abrir un PR **en borrador** `auto/v0.2` → `main`
   (título "v0.2 — Backend, medidas y cargas") si hay herramienta; si no, dejar la rama pusheada. Nunca pushear a `main`, nunca mergear.
3. **Retomar primero lo empezado:** si existe una rama `origin/auto/v0.2-wip-<Tn>`, continuar esa tarea desde ahí (leer "Trabajo en curso"
   de esa rama: qué se probó, qué falló, próximo paso). No empezar de cero.
4. Si no hay trabajo empezado, elegir la PRIMERA tarea `[ ]` del Backlog de `auto/v0.2` cuyas dependencias (`depende:`) estén `[x]` allí.
5. Ejecutar la tarea con el flujo de `ESTANDAR.MD` (línea base, tests primero, implementar, tests, puerta de tarea, autorrevisión).
6. **Insistir hasta que quede en verde.** Probar enfoques distintos, leer el error real, no repetir lo que ya falló. No hay un número fijo de
   vueltas: el límite es el presupuesto de la sesión (ver punto 9).
7. **Cuando la tarea está en verde** (`pnpm test` si existe + `pnpm typecheck` + `pnpm build`, y migraciones/tests contra Postgres cuando apliquen):
   - marcar la tarea `[x]`, línea en "Cambios de la versión" de `VERSIONES.MD`, línea en el Registro de este archivo;
   - **un commit por tarea** con mensaje claro (`Tn: resumen`), integrarlo en `auto/v0.2` (`git pull --rebase` antes; **nunca force-push**) y pushear;
   - si la tarea venía de una rama `auto/v0.2-wip-<Tn>`, borrarla del remoto.
   **Nunca pushear a `auto/v0.2` algo en rojo**: esa rama siempre debe compilar y pasar sus tests.
8. **Seguir con la siguiente tarea elegible** en la misma sesión mientras quede presupuesto (volver al punto 4).
9. **Presupuesto y corte:** trabajar hasta acercarse al límite de uso/contexto de la sesión (alrededor del 90 % si se puede medir; si no se puede
   medir, cerrar ordenadamente tras 3 tareas o cuando el contexto se note muy largo). Si en ese momento hay una tarea a medias:
   - commitear lo avanzado (aunque esté en rojo) en `auto/v0.2-wip-<Tn>` (rama aparte, desde `auto/v0.2`) y pushearla;
   - escribir en "Trabajo en curso" de esa rama lo probado, lo que falló y el próximo paso concreto;
   - la próxima sesión la retoma por el punto 3.
10. **Bloqueo:** si una misma tarea acumula 3 sesiones seguidas sin avanzar, anotar `BLOQUEO:` con el motivo bajo la tarea (en `auto/v0.2`),
    dejarla y pasar a otra tarea elegible que no dependa de ella. Si no queda ninguna elegible, poner ESTADO `BLOQUEADA`, resumir en RESULTADOS.MD y parar.
11. **Informe:** al terminar la sesión, una entrada en `RESULTADOS.MD` (plantilla allí) que liste todas las tareas tocadas, con tiempos medidos con `date -u`
    y la verificación realmente ejecutada. Va en un commit a `auto/v0.2`.
12. **Cierre de la versión:** cuando no queda ninguna `[ ]` (salvo bloqueadas ya explicadas), ejecutar la "Puerta de versión" de `ESTANDAR.MD`
    sobre `auto/v0.2` y verificar cada punto de "Definición de versión completa" de `VERSIONES.MD`. Si todo pasa: ESTADO `COMPLETA`, v0.2 `HECHA`,
    resumen final y evidencias en RESULTADOS.MD, y marcar el PR como **listo para revisión** (sacarlo de borrador) con un cuerpo que resuma
    qué entra, cómo se probó y qué decisiones quedan para el usuario. Si falta algo, agregarlo como tarea `[ ]` y seguir.
13. Si no hay nada elegible ni empezado y la versión no está completa, terminar con "sin trabajo elegible" y explicar por qué.

## Límites (no hacer sin que el usuario lo pida)

- Dependencias: ya aprobadas `pg`, `server-only` y `@types/pg` (dev). Cualquier otra: no agregarla, anotar `PREGUNTA:`.
- Nunca commitear secretos ni `.env`. La `DATABASE_URL` real del usuario no existe en la nube; usar `.env.example` y un Postgres local del entorno para probar.
- No cambiar ni borrar datos de `localStorage` (`gym:v1`) sin migración que los conserve.
- No tocar `AGENTS.md`. No pushear a `main`. No mergear. No hacer force-push.
- No trabajar en versiones `PLANIFICADA`.
- Si una tarea es ambigua, anotar `PREGUNTA:` bajo la tarea (y en RESULTADOS.MD) y elegir la opción más conservadora que no cierre puertas.

## Backlog v0.2

> Formato: `- [ ] Tn · descripción · depende: Tx`. El orden es la prioridad. El detalle de reglas está en `VERSIONES.MD`.

- [x] T1 · **Capa de base de datos:** agregar `pg`, `lib/server/db.ts` (pool, `server-only`, `DATABASE_URL`), runner `pnpm db:migrate` y `db/migrations/0001_init.sql` con el modelo de datos mínimo de `VERSIONES.MD`. Crear `.env.example`. Documentar en README.
- [ ] T2 · **Repositorios de servidor:** funciones en `lib/server/` para ejercicios, rutinas (con `type`), días y ejercicios de rutina. Sin UI todavía. · depende: T1
- [ ] T3 · **API en Next** (route handlers o server actions según la doc de esta versión) para CRUD de rutinas y ejercicios, con validación de entrada y errores claros. · depende: T2
- [ ] T4 · **Migrar `lib/store.ts`** para que `useGym()` y `gym.*` lean/escriban vía la API, manteniendo la misma interfaz pública y estados de carga/error en las pantallas. · depende: T3
- [ ] T5 · **Tipo de rutina en el editor** (`/rutinas/[id]`): selector hipertrofia / estrés metabólico, con rangos de reps y descanso por defecto según tipo. · depende: T4
- [ ] T6 · **Entrenamientos y series en Postgres:** repositorios, API y conexión de `/entrenar/[id]`, `/historial` y la pantalla de inicio. Agregar RPE opcional por serie. · depende: T4
- [ ] T7 · **Importar datos locales:** botón en `/ajustes` que lleva el contenido de `gym:v1` a la base, una sola vez y sin duplicar. · depende: T6
- [ ] T8 · **Medidas corporales (back):** tabla, repositorio y API de `body_measurements` (cm). · depende: T1
- [ ] T9 · **Medidas corporales (front):** pantalla `/medidas` con formulario, edición, historial y variación en cm respecto de la medición anterior; entrada en la navegación. · depende: T8
- [ ] T10 · **`lib/progression.ts`:** lógica pura de cargas según `VERSIONES.MD`, con tests `node --test` que cubran las reglas y todos los casos borde. Script `pnpm test`. · depende: nada
- [ ] T11 · **Carga sugerida en `/entrenar/[id]`:** mostrar sugerencia y explicación por ejercicio usando el historial real, permitir aceptar o ajustar, guardar RPE. · depende: T6, T10
- [ ] T12 · **`/progreso`:** evolución de cargas por ejercicio y de medidas en el tiempo. · depende: T9, T11
- [ ] T13 · **Acceso protegido:** secreto por variable de entorno (middleware/proxy según la doc de esta versión) para todas las pantallas y la API. · depende: T4
- [ ] T14 · **Pulido final:** estados vacíos/carga/error consistentes, revisión de layout en compact/medium/expanded, accesibilidad básica, README completo. · depende: T12, T13

## Registro

<!-- Una línea por tarea cerrada: AAAA-MM-DD HH:MM · Tn · OK/BLOQUEADA (detalle en RESULTADOS.MD) -->
2026-11-13 21:48 · T1 · OK
