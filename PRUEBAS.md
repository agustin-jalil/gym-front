# Pruebas e integración de ramas

Estado: las ramas están apiladas.

- `auto/T1-capa-db` ya está en `main` (PR #1).
- `auto/v0.2` = 16 commits sobre `main` (PR #2).
- `auto/v0.3` = `auto/v0.2` + 7 commits (T15–T19) (PR #3).

Orden: probar e integrar primero v0.2, después v0.3.

## 1. Probar v0.2

```powershell
git fetch origin
git switch auto/v0.2        # o: git switch -c auto/v0.2 origin/auto/v0.2
npm install
npm run typecheck
npm run build
```

- Copiá `.env.example` a `.env.local` y completá `DATABASE_URL` y `APP_SECRET`.
- Corré las migraciones: `npm run db:migrate`.
- Levantá la app: `npm run dev` (puerto 3030).
- Probá estas pantallas: `/medidas`, `/progreso`, `/entrenar`, `/acceso`.
- Probá la importación de datos locales (`gym:v1`).

## 2. Integrar v0.2

Con PR (recomendado): abrí el PR #2 en GitHub y tocá **Merge**.

O local:

```powershell
git switch main
git pull
git merge --no-ff auto/v0.2
git push
```

## 3. Probar e integrar v0.3

```powershell
git switch main
git pull
git switch auto/v0.3
npm install
npm run typecheck; npm run build
npm run dev          # probá /autopilot
```

Después mergeá el PR #3. Si v0.2 ya está en `main`, solo entran los 7 commits nuevos. Si GitHub muestra 23 commits, es porque el PR #2 todavía no se mergeó.

## Consejos

- Cambiar de rama con `git switch` no pierde nada mientras el working tree esté limpio.
- Probar v0.2 y v0.3 juntas sin tocar `main`:
  ```powershell
  git switch -c prueba main
  git merge auto/v0.3
  ```
  Si algo sale mal, se borra la rama `prueba`.
- Limpieza después del merge:
  ```powershell
  git branch -d auto/v0.2 auto/v0.3
  git push origin --delete auto/v0.2 auto/v0.3
  ```
- Proteger `main`: Settings → Branches en GitHub, para exigir PR antes de mergear.
