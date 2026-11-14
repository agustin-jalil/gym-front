# Gym

Front de rutina de gimnasio: planificá rutinas, entrená registrando series (con temporizador de descanso) y mirá tu progreso.
Proyecto **independiente**: no depende de ningún paquete ni contrato del ecosistema.

## Correr

Primera vez: `cp .env.example .env.local`, completar `DATABASE_URL` y `APP_SECRET`, y correr `pnpm db:migrate`.

```bash
pnpm install
pnpm dev        # http://localhost:3030
pnpm build && pnpm start
pnpm test       # node --test (los de repositorios necesitan DATABASE_URL de una base de pruebas)
pnpm typecheck
pnpm db:migrate # aplica db/migrations/*.sql sobre DATABASE_URL
```

## Variables de entorno

| Variable | Para qué | Obligatoria |
|---|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL (`postgres://usuario:clave@host:5432/base`) | Sí |
| `APP_SECRET` | Clave de acceso a pantallas y API | Sí en producción |

Nunca commitees `.env*` con valores reales; `.env.example` solo lleva ejemplos.

## Base de datos

PostgreSQL, accedido solo desde código de servidor (`lib/server/db.ts`, `server-only`). Copiá `.env.example` a `.env.local`
y completá `DATABASE_URL`. `pnpm db:migrate` crea el esquema desde cero y es idempotente (registra lo aplicado en
`schema_migrations`). Las migraciones viven en `db/migrations/` y se aplican en orden alfabético.

## Acceso protegido

Todas las pantallas y la API exigen la clave `APP_SECRET` (definila en `.env.local` o en el entorno del servidor;
generá una larga y aleatoria). `proxy.ts` redirige las pantallas a `/acceso` y responde 401 a la API sin credenciales;
iniciar sesión guarda una cookie `httpOnly` (30 días) con el hash de la clave. Para scripts: `Authorization: Bearer <clave>`.
En producción, **sin `APP_SECRET` todo responde 503** (falla cerrado); en desarrollo, sin la variable la app queda abierta.
Cambiar `APP_SECRET` invalida las sesiones abiertas. `DELETE /api/acceso` cierra la sesión.

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
| `/medidas` | Medidas corporales (cm, peso en kg): alta, edición, historial y variación contra la medición anterior |
| `/progreso` | Volumen semanal, evolución de cargas por ejercicio y evolución de medidas corporales |
| `/ejercicios` | Catálogo, con ejercicios propios |
| `/ajustes` | Tema, respaldo y restauración de datos |

## Datos

Rutinas y ejercicios se guardan en Postgres a través de `/api/*` (necesita `DATABASE_URL` y `pnpm db:migrate`; la
migración `0002_seed.sql` carga el catálogo y las tres rutinas de ejemplo). Los entrenamientos terminados (series con RPE
opcional) también van a Postgres (`/api/workouts`). Solo el entrenamiento en curso queda en `localStorage` (clave `gym:v1`).
Los datos viejos de `gym:v1` se llevan a la base con el botón «Importar datos de este navegador» de `/ajustes`
(`POST /api/import`): es idempotente, no duplica y no borra nada del navegador. **Todo el acceso a datos pasa por
`lib/store.ts`** (`useGym()` para leer y `gym.*` para escribir): carga con estado de error y reintento, cambios
optimistas y guardado agrupado de la rutina que se edita.

## Carga sugerida

`lib/progression.ts` (lógica pura, con tests) calcula para cada ejercicio la carga y las reps objetivo a partir del historial y del tipo
de rutina: **hipertrofia** (progresión doble, 6–12 reps, 90–180 s) o **estrés metabólico** (12–20 reps, 30–60 s; primero reps y menos
descanso, carga +2,5 % solo al completar el tope con el descanso mínimo). `/entrenar/[id]` muestra la sugerencia con su explicación;
podés aceptarla o ajustarla, y guardar el RPE opcional de cada serie.

## Personalizar

- Nombre de la app: `lib/app.ts`.
- Colores, radios y modo oscuro: tokens al inicio de `app/globals.css`.
- Catálogo y rutinas de ejemplo: `lib/seed.ts`.
- Puntos de corte: compact < 600 px (barra inferior), medium ≥ 600 (riel), expanded ≥ 840 (barra lateral).
