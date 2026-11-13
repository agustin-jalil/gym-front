# RUTINA — Trabajo automático sobre gym-front (agente en la nube)

Lo lee cada sesión automática al arrancar. Cada sesión es independiente y no recuerda a la anterior:
**el estado está en estos archivos (rama `main`) y en las ramas `auto/*` del remoto.**

Archivos del sistema:
- `RUTINA.MD` (este): protocolo y backlog.
- `VERSIONES.MD`: qué contiene la versión ACTUAL, arquitectura, reglas de negocio y definición de "completa". Es la fuente de verdad del producto.
- `RESULTADOS.MD`: informe de cada sesión (control del autopilot).

## ESTADO DE LA VERSIÓN ACTUAL (v0.2): EN CURSO

> Valores posibles: `EN CURSO` | `COMPLETA`.
> **Si dice `COMPLETA`: no hacer nada.** No leer código, no crear ramas, no abrir PRs, no escribir en RESULTADOS.MD.
> Responder solo "Versión completa, sin trabajo pendiente" y terminar.

## Protocolo de cada sesión

0. Mirar la línea de ESTADO de arriba (en `origin/main`). Si es `COMPLETA`, terminar de inmediato.
1. Leer `VERSIONES.MD` (sección de la versión ACTUAL), `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de tocar código (este Next.js tiene cambios incompatibles). Si falta `node_modules`, correr `pnpm install`.
2. `git fetch origin` y listar ramas remotas `auto/*` (`git ls-remote --heads origin 'auto/*'`).
3. **Tope de pendientes:** si ya hay 3 o más ramas `auto/*` abiertas (PRs sin mergear), no empezar nada nuevo: terminar con un resumen breve (sin escribir en RESULTADOS.MD).
4. Elegir la PRIMERA tarea `[ ]` del Backlog (de `origin/main`) cuyo id NO tenga ya una rama `auto/<id>-*` en el remoto y cuyas dependencias (`depende:`) estén `[x]` en `main`. Una sola tarea por sesión.
5. Crear la rama `auto/<id>-<slug>` desde `origin/main`.
6. Implementar respetando la arquitectura de `VERSIONES.MD`. Mantener cambios chicos y enfocados en esa tarea.
7. Verificar: `pnpm typecheck` y `pnpm build` deben pasar; correr los tests si la tarea los tiene. Si hay una base Postgres disponible en el entorno, probar contra ella; si no, decirlo en RESULTADOS.MD como **NO VERIFICADO contra Postgres**.
8. Si no se puede arreglar un fallo, no pushear código roto: la rama solo agrega una nota `BLOQUEO:` bajo la tarea y la entrada en RESULTADOS.MD.
9. En la misma rama: marcar la tarea `[x]`, agregar una línea en "Cambios de la versión" de `VERSIONES.MD` y **escribir la entrada de la sesión en `RESULTADOS.MD`** (plantilla incluida allí) actualizando el resumen acumulado.
10. Commit claro y `git push origin auto/<id>-<slug>`. Abrir un PR contra `main` si hay herramienta; si no, dejar la rama pusheada (el usuario abre el PR).
11. **Nunca** pushear a `main` directamente. Nunca mergear.
12. **Cierre de la versión:** si no queda ninguna `[ ]` en el Backlog y no hay ramas `auto/*` abiertas (todo mergeado), verificar cada punto de "Definición de versión completa" en `VERSIONES.MD`. Si todos se cumplen, abrir una rama `auto/cierre` que cambie `ESTADO DE LA VERSIÓN ACTUAL` a `COMPLETA`, marque la versión como `HECHA` en `VERSIONES.MD` y deje su entrada en RESULTADOS.MD. Si falta algo, agregarlo como tarea nueva `[ ]`.
13. Si quedan tareas `[ ]` pero todas tienen rama abierta o dependencias sin cumplir, no inventar trabajo: terminar con "todo en revisión".

## Límites (no hacer sin que el usuario lo pida)

- Dependencias: solo se permite agregar `pg` (y `server-only` si hace falta). Cualquier otra, no: anotar `PREGUNTA:`.
- Nunca commitear secretos ni `.env`. La `DATABASE_URL` real no existe en la nube; usar `.env.example`.
- No cambiar ni borrar datos de `localStorage` (`gym:v1`) sin migración que los conserve.
- No tocar `AGENTS.md`.
- No trabajar en versiones `PLANIFICADA`.
- Si una tarea es ambigua, anotar `PREGUNTA:` bajo la tarea (y en RESULTADOS.MD) y pasar a la siguiente.

## Backlog v0.2

> Formato: `- [ ] Tn · descripción · depende: Tx`. El orden es la prioridad. El detalle de reglas está en `VERSIONES.MD`.

- [ ] T1 · **Capa de base de datos:** agregar `pg`, `lib/server/db.ts` (pool, `server-only`, `DATABASE_URL`), runner `pnpm db:migrate` y `db/migrations/0001_init.sql` con el modelo de datos mínimo de `VERSIONES.MD`. Crear `.env.example`. Documentar en README.
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

<!-- Una línea por sesión: AAAA-MM-DD HH:MM · Tn · OK/FALLÓ/BLOQUEADA (detalle en RESULTADOS.MD) -->

