# Buen Bocado — Monorepo MVP

## Requisitos
- Node.js LTS (ver `.nvmrc`)
- pnpm
- Docker (para Postgres local)

## Instalación
```bash
pnpm install
cp .env.example .env
```

## Comandos
```bash
pnpm dev         # client + restaurant + api (Turbo)
pnpm build       # build de apps y api
pnpm lint        # lint monorepo
pnpm typecheck   # typecheck monorepo

pnpm db:up       # Postgres local (docker)
pnpm db:down
pnpm db:migrate
pnpm db:studio
```

## Correr todo local
1. Levanta la DB:
   ```bash
   pnpm db:up
   ```
2. Copia `.env.example` a `.env`.
3. Inicia todo:
   ```bash
   pnpm dev
   ```

### Puertos
- Client: http://localhost:3000
- Restaurant: http://localhost:3001
- API: http://localhost:4000/health

## Estructura
```
apps/
  client/        # Next.js (cliente)
  restaurant/    # Next.js (restaurante)
  api/           # Fastify
packages/
  ui/            # UI compartida
  config/        # eslint + tsconfig base
  db/            # Prisma schema + client
```

## Decisiones
- Monorepo con Turborepo + pnpm workspaces.
- API con Fastify y datos in-memory (listo para conectar Prisma luego).
- UI mínima con Tailwind y componentes compartidos.

## Checklist final
### Hecho
- [x] Monorepo con Turborepo, pnpm workspaces y TS.
- [x] Apps cliente + restaurante con rutas base y UI placeholder.
- [x] API Fastify con endpoints mock.
- [x] Prisma schema + Postgres en docker-compose.
- [x] CI básico (lint, typecheck, build).
- [x] Documentación inicial (Producto, API, Data Model).

### Pendiente (siguiente sprint)
- [ ] Conectar API con Prisma y datos reales.
- [ ] Autenticación y gestión de roles.
- [ ] Pagos reales.
- [ ] Push/avisos.
