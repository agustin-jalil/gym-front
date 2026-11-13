# Gym

Front de rutina de gimnasio: planificá rutinas, entrená registrando series (con temporizador de descanso) y mirá tu progreso.
Proyecto **independiente**: no depende de ningún paquete ni contrato del ecosistema.

## Correr

```bash
pnpm install
pnpm dev        # http://localhost:3030
pnpm build && pnpm start
pnpm typecheck
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS v4. Sin librerías de UI ni de estado:
los componentes están en `components/ui`, el estado en `lib/store.ts`.

## Estructura

| Ruta | Pantalla |
|---|---|
| `/` | Hoy: rutina del día, resumen de la semana, entrenamiento en curso |
| `/rutinas`, `/rutinas/[id]` | Lista y editor de rutinas (días, ejercicios, series, reps, kg, descanso) |
| `/entrenar/[id]` | Entrenamiento en curso (modo foco, sin navegación) |
| `/historial` | Entrenamientos terminados, por mes |
| `/progreso` | Volumen semanal y evolución por ejercicio |
| `/ejercicios` | Catálogo, con ejercicios propios |
| `/ajustes` | Tema, respaldo y restauración de datos |

## Datos

Hoy se guardan en `localStorage` (clave `gym:v1`), solo en el dispositivo. **Todo el acceso a datos pasa por
`lib/store.ts`** (`useGym()` para leer y `gym.*` para escribir). Para pasar a un backend, reemplazá ese archivo
manteniendo la misma interfaz y las pantallas no cambian.

## Personalizar

- Nombre de la app: `lib/app.ts`.
- Colores, radios y modo oscuro: tokens al inicio de `app/globals.css`.
- Catálogo y rutinas de ejemplo: `lib/seed.ts`.
- Puntos de corte: compact < 600 px (barra inferior), medium ≥ 600 (riel), expanded ≥ 840 (barra lateral).
