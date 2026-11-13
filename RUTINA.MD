# RUTINA — Trabajo automático sobre gym-front

Este archivo lo lee cada sesión automática al arrancar. Define QUÉ hacer, CÓMO y DÓNDE dejar el estado.
Cada sesión es independiente (no recuerda a la anterior): **todo el estado vive en este archivo**.

## Reglas de cada sesión

1. Leer `AGENTS.md` y la guía relevante en `node_modules/next/dist/docs/` antes de tocar código (este Next.js tiene cambios incompatibles).
2. Leer la sección **Backlog** y tomar la PRIMERA tarea con estado `[ ]`. Una sola tarea por sesión.
3. Marcarla `[~]` (en curso) con fecha/hora antes de empezar.
4. Implementarla respetando la arquitectura: datos solo vía `lib/store.ts`, UI en `components/ui`, tokens en `app/globals.css`, sin librerías nuevas de UI/estado.
5. Verificar: `pnpm typecheck` y `pnpm build` deben pasar. Si fallan y no podés arreglarlo, revertir tus cambios de esa tarea y anotar el motivo.
6. Marcarla `[x]` y agregar una línea en **Registro** (fecha, tarea, archivos tocados, resultado).
7. Si no quedan tareas `[ ]`, no inventar trabajo: anotar "backlog vacío" en el Registro y terminar.

## Límites (no hacer sin que el usuario lo pida)

- No instalar ni actualizar dependencias.
- No borrar datos ni cambiar la clave de `localStorage` (`gym:v1`) sin migración.
- No tocar `AGENTS.md`.
- No hacer deploy ni push (el proyecto ni siquiera es repo git todavía).
- Si una tarea es ambigua, anotar la duda bajo la tarea como `PREGUNTA:` y pasar a la siguiente.

## Backlog

> EDITÁ esta lista con lo que realmente querés lograr. Estos son puntos de partida basados en las pantallas actuales.
> Orden = prioridad. Cada tarea debe ser chica (≈ una sesión) y verificable.

- [ ] Revisar las pantallas (`/`, `/rutinas`, `/entrenar/[id]`, `/historial`, `/progreso`, `/ejercicios`, `/ajustes`) en anchos compact/medium/expanded y corregir problemas de layout.
- [ ] Accesibilidad: foco visible, labels en campos, contraste en modo claro y oscuro.
- [ ] `/entrenar/[id]`: permitir editar kg/reps de una serie ya registrada y deshacer la última serie.
- [ ] `/progreso`: agregar récord personal (PR) por ejercicio.
- [ ] `/rutinas/[id]`: duplicar un día y reordenar ejercicios.
- [ ] `/ajustes`: validar el archivo al restaurar un respaldo y mostrar errores claros.
- [ ] Estados vacíos y de carga consistentes en todas las pantallas (`components/ui/states.tsx`).
- [ ] Agregar `lib/store.ts` tests/chequeos básicos de la lógica de `lib/stats.ts`.

## Registro

<!-- Una línea por sesión: AAAA-MM-DD HH:MM · tarea · archivos · OK/FALLÓ (motivo) -->

