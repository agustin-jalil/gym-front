# RUTINA — Trabajo automático sobre gym-front (agente en la nube)

Lo lee cada sesión automática al arrancar. Cada sesión es independiente y no recuerda a la anterior:
**el estado está en estos archivos, en la rama de cada versión (`auto/<versión>`) y en sus ramas de trabajo (`auto/<versión>-wip-Tn`).**

Objetivo: dejar cada versión completa en UNA rama (`auto/v0.2`, `auto/v0.3`, …) con un único PR, ya verificada
(test + typecheck + build en verde) para que el usuario solo revise y mergee. Al cerrar una versión, el autopilot pasa solo a la siguiente.

Archivos del sistema:
- `RUTINA.MD` (este): protocolo, estado de las versiones y backlogs.
- `VERSIONES.MD`: qué contiene cada versión, arquitectura, reglas de negocio y definición de "completa". Fuente de verdad del producto.
- `RESULTADOS.MD`: informe de cada sesión (control del autopilot).
- `ESTANDAR.MD`: pilares técnicos, flujo ideal por tarea y puerta de calidad para cerrar una versión.

## ESTADO DE LAS VERSIONES

> Valores: `PLANIFICADA` | `EN CURSO` | `BLOQUEADA` | `COMPLETA`. El orden de la lista es el orden de ejecución.
> `COMPLETA` en la rama de la versión significa "lista para que el usuario mergee".

- v0.2: EN CURSO
- v0.3: PLANIFICADA
- v0.4: PLANIFICADA (sin backlog: no se empieza)

**Versión ACTUAL** = la primera de la lista cuyo estado no es `COMPLETA`.
- Si la ACTUAL está `BLOQUEADA`: no avanzar a la siguiente. No hacer nada y terminar.
- Si todas están `COMPLETA`, o la ACTUAL es `PLANIFICADA` pero no tiene backlog en este archivo: no hacer nada.
  Responder solo "Sin trabajo automático pendiente" y terminar. No leer código, no crear ramas, no escribir en RESULTADOS.MD.

## Trabajo en curso

<!-- Solo se escribe en una rama auto/<versión>-wip-*. Formato:
Tn · intentos: N sesiones · probado: ... · falló: ... · próximo paso: ...
-->

## Protocolo de cada sesión

0. **Orientarse.** `git fetch origin`. El ESTADO y los backlogs se leen de la rama de versión más nueva que exista en `origin` (`auto/v*`,
   la de número mayor); si no existe ninguna, de `origin/main`. Determinar la versión ACTUAL con la regla de arriba. Si no hay trabajo, terminar.
1. Leer `ESTANDAR.MD` (pilares y flujo ideal: obligatorio), `VERSIONES.MD` (sección de la versión ACTUAL), `AGENTS.md` y la guía relevante en
   `node_modules/next/dist/docs/` antes de tocar código (este Next.js tiene cambios incompatibles). Si falta `node_modules`, `pnpm install`.
2. **Rama de la versión ACTUAL** (`auto/<v>`):
   - Si existe, usarla.
   - Si no existe, crearla: desde `origin/main` si la versión anterior ya está mergeada en `main`; si **no** lo está, desde la rama de la versión anterior
     (`auto/<v-anterior>`), para que el código nuevo parta del anterior. Cambiar el estado de la versión a `EN CURSO` en su primer commit.
   - Abrir un PR **en borrador** de `auto/<v>` (título "<v> — <objetivo corto>") con base `main`, o con base `auto/<v-anterior>` si esa todavía no
     está mergeada (GitHub lo redirige a `main` cuando la anterior se mergea). Si no hay herramienta, dejar la rama pusheada.
   - Nunca pushear a `main`, nunca mergear, nunca force-push.
3. **Sincronizar con main:** integrar `origin/main` en `auto/<v>` con `git merge` (no rebase) para recibir cambios del protocolo o de versiones ya mergeadas.
   Si hay conflicto: en el protocolo y los límites de este archivo, gana `main`; en los `[x]` del backlog y el Registro, se conserva la unión de ambos lados.
   Si un conflicto es de código y no se puede resolver con seguridad, anotar `PREGUNTA:` y terminar la sesión sin pushear.
4. **Retomar primero lo empezado:** si existe `origin/auto/<v>-wip-<Tn>`, continuar esa tarea desde ahí (leer "Trabajo en curso" de esa rama:
   qué se probó, qué falló, próximo paso). No empezar de cero.
5. Si no hay trabajo empezado, elegir la PRIMERA tarea `[ ]` del Backlog de la versión ACTUAL cuyas dependencias (`depende:`) estén `[x]`.
6. Ejecutar la tarea con el flujo de `ESTANDAR.MD` (línea base, tests primero, implementar, tests, puerta de tarea, autorrevisión).
7. **Insistir hasta que quede en verde.** Probar enfoques distintos, leer el error real, no repetir lo que ya falló. No hay un número fijo de
   vueltas: el límite es el presupuesto de la sesión (punto 10).
8. **Cuando la tarea está en verde** (`pnpm test` si existe + `pnpm typecheck` + `pnpm build`, y migraciones/tests contra Postgres cuando apliquen):
   - marcar la tarea `[x]`, línea en "Cambios de la versión" de `VERSIONES.MD`, línea en el Registro de este archivo;
   - **un commit por tarea** (`Tn: resumen`) en `auto/<v>`, con `git pull --rebase` previo del propio branch y push (**nunca force-push**);
   - si la tarea venía de una rama `auto/<v>-wip-<Tn>`, borrarla del remoto.
   **Nunca pushear a `auto/<v>` algo en rojo**: esa rama siempre debe compilar y pasar sus tests.
9. **Seguir con la siguiente tarea elegible** en la misma sesión mientras quede presupuesto (volver al punto 5).
10. **Presupuesto y corte:** trabajar hasta acercarse al límite de uso/contexto de la sesión (alrededor del 90 % si se puede medir; si no se puede
    medir, cerrar ordenadamente tras 3 tareas o cuando el contexto se note muy largo). Si en ese momento hay una tarea a medias:
    - commitear lo avanzado (aunque esté en rojo) en `auto/<v>-wip-<Tn>` (rama aparte, desde `auto/<v>`) y pushearla;
    - escribir en "Trabajo en curso" de esa rama lo probado, lo que falló y el próximo paso concreto;
    - la próxima sesión la retoma por el punto 4.
11. **Bloqueo:** si una misma tarea acumula 3 sesiones seguidas sin avanzar, anotar `BLOQUEO:` con el motivo bajo la tarea (en `auto/<v>`),
    dejarla y pasar a otra tarea elegible que no dependa de ella. Si no queda ninguna elegible, poner el estado de la versión en `BLOQUEADA`,
    resumir en RESULTADOS.MD y parar (no se avanza a la siguiente versión).
12. **Informe:** al terminar la sesión, una entrada en `RESULTADOS.MD` (plantilla allí) que liste todas las tareas tocadas, con tiempos medidos con `date -u`
    y la verificación realmente ejecutada. Va en un commit a `auto/<v>`.
13. **Cierre de la versión:** cuando no queda ninguna `[ ]` (salvo bloqueadas ya explicadas), ejecutar la "Puerta de versión" de `ESTANDAR.MD`
    sobre `auto/<v>` y verificar cada punto de "Definición de versión completa" de `VERSIONES.MD`. Si todo pasa:
    - estado de la versión `COMPLETA` en este archivo y en `VERSIONES.MD`;
    - resumen final y evidencias en RESULTADOS.MD;
    - marcar el PR como **listo para revisión** (sacarlo de borrador) con un cuerpo que resuma qué entra, cómo se probó y qué decisiones quedan para el usuario.
    Si falta algo, agregarlo como tarea `[ ]` y seguir.
14. **Pasar a la versión siguiente:** si todavía queda presupuesto en la sesión, volver al punto 0: la siguiente versión de la lista pasa a ser la ACTUAL
    (solo si tiene backlog). Si no queda presupuesto, la próxima sesión lo hace sola. Ese cambio no espera el merge del usuario.
15. Si no hay nada elegible ni empezado y la versión no está completa, terminar con "sin trabajo elegible" y explicar por qué.

## Límites (no hacer sin que el usuario lo pida)

- Dependencias: ya aprobadas `pg`, `server-only` y `@types/pg` (dev). Cualquier otra: no agregarla, anotar `PREGUNTA:`.
- Nunca commitear secretos ni `.env`. La `DATABASE_URL` real del usuario no existe en la nube; usar `.env.example` y un Postgres local del entorno para probar.
- No cambiar ni borrar datos de `localStorage` (`gym:v1`) sin migración que los conserve.
- No tocar `AGENTS.md`. No pushear a `main`. No mergear. No hacer force-push.
- Trabajar solo en la versión ACTUAL. Una versión `PLANIFICADA` sin backlog nunca se empieza ni se inventa su alcance.
- Si una tarea es ambigua, anotar `PREGUNTA:` bajo la tarea (y en RESULTADOS.MD) y elegir la opción más conservadora que no cierre puertas.

## Backlog v0.2

> Formato: `- [ ] Tn · descripción · depende: Tx`. El orden es la prioridad. El detalle de reglas está en `VERSIONES.MD`.

- [x] T1 · **Capa de base de datos:** agregar `pg`, `lib/server/db.ts` (pool, `server-only`, `DATABASE_URL`), runner `pnpm db:migrate` y `db/migrations/0001_init.sql` con el modelo de datos mínimo de `VERSIONES.MD`. Crear `.env.example`. Documentar en README.
- [x] T2 · **Repositorios de servidor:** funciones en `lib/server/` para ejercicios, rutinas (con `type`), días y ejercicios de rutina. Sin UI todavía. · depende: T1
- [x] T3 · **API en Next** (route handlers o server actions según la doc de esta versión) para CRUD de rutinas y ejercicios, con validación de entrada y errores claros. · depende: T2
- [x] T4 · **Migrar `lib/store.ts`** para que `useGym()` y `gym.*` lean/escriban vía la API, manteniendo la misma interfaz pública y estados de carga/error en las pantallas. · depende: T3
- [x] T5 · **Tipo de rutina en el editor** (`/rutinas/[id]`): selector hipertrofia / estrés metabólico, con rangos de reps y descanso por defecto según tipo. · depende: T4
- [x] T6 · **Entrenamientos y series en Postgres:** repositorios, API y conexión de `/entrenar/[id]`, `/historial` y la pantalla de inicio. Agregar RPE opcional por serie. · depende: T4
- [x] T7 · **Importar datos locales:** botón en `/ajustes` que lleva el contenido de `gym:v1` a la base, una sola vez y sin duplicar. · depende: T6
- [x] T8 · **Medidas corporales (back):** tabla, repositorio y API de `body_measurements` (cm). · depende: T1
- [x] T9 · **Medidas corporales (front):** pantalla `/medidas` con formulario, edición, historial y variación en cm respecto de la medición anterior; entrada en la navegación. · depende: T8
- [x] T10 · **`lib/progression.ts`:** lógica pura de cargas según `VERSIONES.MD`, con tests `node --test` que cubran las reglas y todos los casos borde. Script `pnpm test`. · depende: nada
- [x] T11 · **Carga sugerida en `/entrenar/[id]`:** mostrar sugerencia y explicación por ejercicio usando el historial real, permitir aceptar o ajustar, guardar RPE. · depende: T6, T10
- [x] T12 · **`/progreso`:** evolución de cargas por ejercicio y de medidas en el tiempo. · depende: T9, T11
- [x] T13 · **Acceso protegido:** secreto por variable de entorno (middleware/proxy según la doc de esta versión) para todas las pantallas y la API. · depende: T4
- [ ] T14 · **Pulido final:** estados vacíos/carga/error consistentes, revisión de layout en compact/medium/expanded, accesibilidad básica, README completo. · depende: T12, T13

## Backlog v0.3

> Solo se ejecuta cuando v0.3 es la versión ACTUAL (v0.2 `COMPLETA`). Depende de que `pnpm test` exista (creado en T10).

- [ ] T15 · **`lib/autopilot.ts`:** lógica pura que parsea el texto de `RUTINA.MD` (estado de versiones, backlog con `[x]`/`[ ]`, dependencias, `BLOQUEO:`) y de `RESULTADOS.MD` (tabla resumen y entradas de sesión: fecha, resultado, duración, tiempo al 90 %, typecheck/build/tests). Tests `node --test` con casos normales, vacíos y de formato inválido. · depende: nada
- [ ] T16 · **Lectura en servidor:** `lib/server/autopilot-files.ts` (`server-only`) que lee `RUTINA.MD`, `RESULTADOS.MD` y `VERSIONES.MD` de la raíz del proyecto y devuelve los datos parseados o un error tipado si falta un archivo. · depende: T15
- [ ] T17 · **Pantalla `/autopilot` (versiones y tareas):** estado de cada versión, barra de progreso (hechas / totales) y lista de tareas con estado y dependencias. Entrada en la navegación. Estados de carga, vacío y error. · depende: T16
- [ ] T18 · **`/autopilot` (sesiones):** últimas sesiones con fecha, resultado, duración, tiempo al 90 % y verificación; gráfico simple de duración por sesión con `components/charts.tsx`. · depende: T17
- [ ] T19 · **Pulido de v0.3:** layout en compact/medium/expanded, accesibilidad, README documentando la pantalla y su fuente de datos. · depende: T18

## Registro

<!-- Una línea por tarea cerrada: AAAA-MM-DD HH:MM · Tn · OK/BLOQUEADA (detalle en RESULTADOS.MD) -->
2026-11-13 21:48 · T1 · OK
2026-11-14 04:55 · T6 · OK
2026-11-14 05:10 · T7 · OK
2026-11-13 22:52 · T2 · OK
2026-11-13 22:52 · T3 · OK
2026-11-14 00:53 · T4 · OK
2026-11-13 22:49 · T2 · OK
2026-11-13 22:51 · T3 · OK
2026-11-14 02:50 · T5 · OK
2026-11-14 03:00 · T10 · OK
2026-11-14 03:10 · T8 · OK
2026-11-14 06:53 · T9 · OK
2026-11-14 06:55 · T11 · OK
2026-11-14 06:57 · T13 · OK
2026-11-14 08:51 · T12 · OK
