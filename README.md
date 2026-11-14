# Gym

Front de rutina de gimnasio: planificá rutinas, entrená registrando series (con temporizador de descanso) y mirá tu progreso.
Proyecto **independiente**: no depende de ningún paquete ni contrato del ecosistema.

## Correr

```bash
pnpm install
pnpm dev        # http://localhost:3030
pnpm build && pnpm start
pnpm typecheck
pnpm db:migrate # aplica db/migrations/*.sql sobre DATABASE_URL
```

## Base de datos (v0.2, en construcción)

PostgreSQL, accedido solo desde código de servidor (`lib/server/db.ts`, `server-only`). Copiá `.env.example` a `.env.local`
y completá `DATABASE_URL`. `pnpm db:migrate` crea el esquema desde cero y es idempotente (registra lo aplicado en
`schema_migrations`). Las migraciones viven en `db/migrations/` y se aplican en orden alfabético.

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

Rutinas y ejercicios se guardan en Postgres a través de `/api/*` (necesita `DATABASE_URL` y `pnpm db:migrate`; la
migración `0002_seed.sql` carga el catálogo y las tres rutinas de ejemplo). Los entrenamientos terminados (series con RPE
opcional) también van a Postgres (`/api/workouts`). Solo el entrenamiento en curso queda en `localStorage` (clave `gym:v1`). **Todo el acceso a datos pasa por
`lib/store.ts`** (`useGym()` para leer y `gym.*` para escribir): carga con estado de error y reintento, cambios
optimistas y guardado agrupado de la rutina que se edita.

## Personalizar

- Nombre de la app: `lib/app.ts`.
- Colores, radios y modo oscuro: tokens al inicio de `app/globals.css`.
- Catálogo y rutinas de ejemplo: `lib/seed.ts`.
- Puntos de corte: compact < 600 px (barra inferior), medium ≥ 600 (riel), expanded ≥ 840 (barra lateral).
