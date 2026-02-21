# BuenBocado — Patch Step 1 (env examples + checklist)

Contenido:
- Actualiza `/.env.example` (root) con variables faltantes para PROD.
- Actualiza `docker-compose.prod.yml` para pasar envs necesarias (JWT_SECRET, etc.).
- Añade:
  - `apps/api/.env.example`
  - `apps/client/.env.example`
  - `apps/restaurant/.env.example`
  - `packages/db/.env.example`
  - `docs/DEPLOYMENT_CHECKLIST.md`
  - `docs/ENV_FILES.md`
  - `scripts/make_env_example.ps1`

Cómo aplicar (PowerShell):
1) Set-Location "C:\Users\Harold\Desktop\Proyectos\contenido\KEPA 2024\guapiweb\buenbocado_ok"
2) Backup rápido:
   Copy-Item .env.example ".\_local_backups\envexample_before.txt" -Force
   Copy-Item docker-compose.prod.yml ".\_local_backups\docker-compose.prod_before.yml" -Force
3) Extrae este zip en el root del repo (sobrescribe archivos).
4) Revisa:
   git status
   git diff

Luego, si quieres, siguiente paso: “Hardening” real (cookies/rate-limit/headers/logs) con cambios de código controlados.
