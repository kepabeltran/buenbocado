# BuenBocado — Checklist de despliegue (PROD)

Este documento es una guía “sin sorpresas” para publicar BuenBocado con `docker-compose.prod.yml` + Caddy (TLS automático).

## 0) Antes de tocar nada

- Tener 3 dominios (o subdominios):
  - `API_DOMAIN` → API (Fastify)
  - `APP_DOMAIN` → Client (Customer + Admin)
  - `RESTAURANT_DOMAIN` → Portal Restaurante
- Un servidor con Docker + Docker Compose (Linux recomendado).
- Acceso SSH y un usuario no-root (con permisos para Docker).

## 1) DNS (imprescindible)

Crear registros **A** (o **AAAA** si IPv6) apuntando al servidor:

- `API_DOMAIN` → IP del servidor
- `APP_DOMAIN` → IP del servidor
- `RESTAURANT_DOMAIN` → IP del servidor

Espera propagación.

## 2) Código en el servidor

- Clonar el repo en el servidor, por ejemplo en `/opt/buenbocado`.
- Verificar que `docker-compose.prod.yml` y `Caddyfile` están presentes.

## 3) Crear `.env` (ROOT)

1. Copia `.env.example` a `.env` en el **root** del repo.
2. Rellena valores **reales**.

Mínimos obligatorios:
- `DATABASE_URL`
- `CORS_ORIGINS`
- `PUBLIC_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `JWT_SECRET`
- dominios + `ACME_EMAIL`

Notas:
- `CORS_ORIGINS` debe incluir exactamente `https://APP_DOMAIN` y `https://RESTAURANT_DOMAIN`.
- `PUBLIC_BASE_URL` normalmente es `https://API_DOMAIN`.
- `NEXT_PUBLIC_RESTAURANT_PORTAL_ORIGIN` normalmente es `https://RESTAURANT_DOMAIN`.

## 4) Arrancar PROD

Desde el root del repo:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Comprobar estado:

```bash
docker compose -f docker-compose.prod.yml ps
docker logs buenbocado-caddy --tail 200
docker logs buenbocado-api-prod --tail 200
```

## 5) Semillas (primer admin)

Crear el primer admin (una sola vez). Desde el root dentro del contenedor `api`:

```bash
docker exec -it buenbocado-api-prod bash
# dentro:
node scripts/seed_admin.js
```

Opcionalmente, define variables:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

## 6) Verificaciones rápidas

- `https://APP_DOMAIN` carga la app.
- `https://APP_DOMAIN/admin` carga el admin (y login).
- `https://RESTAURANT_DOMAIN` carga portal restaurante.
- `https://API_DOMAIN/api/health` (si existe) o al menos `GET /api/auth/me` responde con 401/200 según cookies.

## 7) Operación y backups

- Backups del volumen `postgres_data` (recomendado diario).
- Rotación de logs y monitorización básica (CPU/RAM/Disco).

## 8) Hardening (siguiente bloque)

Este checklist deja el despliegue “funcionando”.
El siguiente bloque (que haremos) endurece:
- cookies `Secure/HttpOnly/SameSite`, dominio y expiraciones
- rate limit en endpoints de auth
- security headers (Helmet / Caddy)
- logs sin datos sensibles
- `.env.example` y `.env.example` por app (ya creado) + `.env.example` root (actualizado)
