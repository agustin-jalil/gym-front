# RESULTADOS — Control del autopilot

Informe de cada sesión automática que abrió una rama de trabajo. Sirve para auditar qué hizo el agente, si lo verificó
de verdad y dónde se trabó. Las sesiones que no hacen nada (versión `COMPLETA`, tope de PRs abiertos) **no** escriben acá.

Reglas de escritura (para el agente):
- Una entrada por sesión, **al principio** de "Sesiones" (la más nueva arriba), dentro de la misma rama/PR de la tarea.
- Solo hechos. Si un comando falló, pegar la línea de error relevante. Si algo no se pudo verificar, decir **NO VERIFICADO** y por qué.
- No inflar: "build pasó" solo si se corrió y pasó en esa sesión.

## Resumen acumulado

| Sesiones | Tareas OK | Tareas con bloqueo | PRs abiertos hoy | Duración media (min) | Tiempo medio al 90 % (min) | Última actualización |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | — | — | — |

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
