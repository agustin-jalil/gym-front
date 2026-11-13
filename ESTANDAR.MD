# ESTANDAR — Pilares técnicos y flujo ideal del autopilot

Es el listón de calidad ("10/10") de cada sesión y de cada versión. Si este archivo choca con `RUTINA.MD`, manda `RUTINA.MD` en el
protocolo y este archivo en los criterios de calidad. `AGENTS.md` y `VERSIONES.MD` mandan sobre ambos.

## Pilares técnicos

1. **Corrección demostrada.** Nada está "hecho" porque compile: está hecho cuando un test o una verificación ejecutada lo prueba.
2. **Tests primero.** Para lógica (cargas, medidas, validaciones, repositorios) se escribe el test antes del código, se ve fallar y luego pasar.
3. **Un cambio, un propósito.** Un PR resuelve una tarea. Sin refactors ni "mejoras" ajenas a la tarea.
4. **Arquitectura respetada.** Lógica de negocio pura en `lib/` (sin I/O ni React), acceso a datos solo en `lib/server/` (`server-only`),
   UI en `components/`, pantallas finas. Sin backend aparte. `lib/store.ts` conserva su interfaz pública.
5. **TypeScript estricto.** Sin `any`, sin `@ts-ignore`, sin `as` para callar errores. Datos externos (request, filas SQL) se validan en el borde.
6. **Datos seguros.** Migraciones SQL versionadas, idempotentes de punta a punta y que parten de base vacía. Consultas parametrizadas, nunca
   strings concatenados. Cambios de esquema no destructivos salvo pedido explícito. Medidas en cm, cargas en kg, fechas en UTC.
7. **Seguridad.** Cero secretos en el repo. Entrada del usuario siempre validada. La API no devuelve más de lo necesario. Errores sin filtrar detalles internos.
8. **Next 16 según su documentación.** Antes de usar una API de Next/React, confirmarla en `node_modules/next/dist/docs/`. Nada de memoria.
9. **UX y accesibilidad.** Estados de carga, vacío y error en toda pantalla de datos. Foco visible, labels, contraste en claro y oscuro,
   usable en compact/medium/expanded.
10. **Mínima superficie.** Sin dependencias nuevas fuera de las permitidas. Sin código muerto ni comentarios que repiten el código.
11. **Trazabilidad.** Cada sesión deja informe veraz en `RESULTADOS.MD`, con lo que NO se pudo verificar dicho explícitamente.

## Flujo ideal de una sesión (tarea)

```
1. Orientarse   ESTADO → leer VERSIONES.MD, ESTANDAR.MD, RUTINA.MD, doc de Next relevante
2. Elegir       retomar auto/v0.2-wip-Tn si existe; si no, primera tarea [ ] elegible de la rama auto/v0.2 (dependencias [x] allí)
3. Línea base   pnpm install si falta; correr typecheck, build y tests ANTES de tocar nada → saber qué ya estaba roto
4. Plan corto   2–5 líneas: qué cambia, qué archivos, qué casos borde, cómo se prueba
5. Test primero escribir tests de la tarea (casos normales + bordes + errores); ejecutarlos y ver que fallan por la razón correcta
6. Implementar  lo mínimo para que pasen, respetando los pilares
7. Test ciclo   ejecutar los tests; corregir hasta verde, cambiando de enfoque si el mismo fallo se repite. Si se agota el presupuesto de la sesión, guardar en auto/v0.2-wip-Tn con nota de lo probado
8. Puerta de tarea  pnpm test (si existe) + pnpm typecheck + pnpm build, todo en verde, en ese orden
9. Autorrevisión  releer el diff completo contra los pilares; borrar lo que sobre; confirmar que no se tocó nada fuera de la tarea
10. Cerrar      marcar [x], línea en VERSIONES.MD, un commit por tarea en auto/v0.2 (sin force-push), push; informe veraz en RESULTADOS.MD al cerrar la sesión
```

Reglas del flujo:
- La línea base (paso 3) separa fallos heredados de fallos propios. Si ya estaba roto en `main`, anotarlo y no culparse ni arreglarlo a escondidas.
- No debilitar, saltear ni borrar un test para ponerlo en verde. Si el test está mal, corregirlo y explicar por qué en `RESULTADOS.MD`.
- Nunca pushear en rojo a `auto/v0.2`. Lo que está a medias vive solo en `auto/v0.2-wip-Tn`.
- Cada intento fallido repetido se resume en `RESULTADOS.MD` (qué se probó), no se esconde.

## Puerta de versión (antes de declarar COMPLETA)

Solo cuando no queda ninguna tarea `[ ]`, el agente parte de `origin/auto/v0.2` actualizada, con el árbol limpio, y corre,
en este orden, con la salida real:

1. `pnpm install --frozen-lockfile` — el lockfile es coherente.
2. `pnpm test` — **todos** los tests, no solo los de la última tarea.
3. `pnpm typecheck` — sin errores.
4. `pnpm build` — compila para producción.
5. Si hay Postgres disponible: `pnpm db:migrate` sobre base vacía, luego una segunda vez (debe ser idempotente), y los tests de repositorios contra esa base.
   Si no hay Postgres, ese punto se escribe como **NO VERIFICADO** y la versión **no** se declara COMPLETA sin que el usuario lo confirme.
6. Recorrer cada ítem de "Definición de versión completa" de `VERSIONES.MD` y citar la evidencia (test, archivo o comando) de cada uno.
7. Confirmar que no quedan `TODO`, `FIXME`, `console.log` de depuración ni secretos (`git grep`).

Si todo pasa → ESTADO `COMPLETA` en `auto/v0.2` y PR marcado como listo para revisión. Si algo falla → se agrega como tarea `[ ]` y la versión sigue `EN CURSO`.
La puerta completa pegada en `RESULTADOS.MD` es la prueba de cierre.

## Qué NO cuenta como hecho

- "Compila" sin tests para la lógica nueva.
- Tests que no fallaron nunca antes de implementar.
- Verificación no ejecutada en esa sesión.
- Una pantalla sin estados de carga, vacío y error.
- Un cambio de datos sin migración o sin camino de vuelta desde `localStorage`.
