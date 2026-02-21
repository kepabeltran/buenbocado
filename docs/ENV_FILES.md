# BuenBocado — Estructura de variables de entorno

El repo es un monorepo (pnpm/turbo). **Cada app** carga su propio `.env` / `.env.local`.

## Producción (Docker)

- Se usa **un único** `.env` en el root (junto a `docker-compose.prod.yml`).
- `docker-compose.prod.yml` inyecta las variables necesarias en:
  - `api` (Fastify)
  - `client` (Next)
  - `restaurant` (Next)
  - `postgres` y `caddy`

Archivos:
- `/.env` (desde `/.env.example`)
- `docker-compose.prod.yml`
- `Caddyfile`

## Desarrollo (local)

Recomendación mínima:

- `apps/api/.env` (desde `apps/api/.env.example`)
- `apps/client/.env.local` (desde `apps/client/.env.example`)
- `apps/restaurant/.env.local` (desde `apps/restaurant/.env.example`)
- `packages/db/.env` (desde `packages/db/.env.example`, si haces migrate/studio desde ese paquete)

Notas:
- En el client, `NEXT_PUBLIC_*` se expone al navegador.
- Para probar desde LAN (192.168.x.x), si no defines `NEXT_PUBLIC_API_URL`, el client intenta autodetectar hostname (esto ya lo tenéis).
