# CLAUDE.md - Buen Bocado Codebase Guide

> AI assistant guide for the Buen Bocado MVP - a food marketplace platform.

## Project Overview

**Buen Bocado** ("Good price, better bite") is a full-stack monorepo for a food marketplace connecting customers with restaurant menu offers. The platform consists of three apps: a customer-facing client, a restaurant management portal, and a backend API.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14.2.5, React 18.3.1, TypeScript 5.5.4, Tailwind CSS 3.4.10 |
| **Backend** | Fastify 4.28.1, TypeScript, Sharp (image processing) |
| **Database** | PostgreSQL 16, Prisma 5.18.0 |
| **Monorepo** | Turborepo 2.1.3, pnpm 9.12.3 workspaces |
| **Runtime** | Node.js 20.18.0 (see `.nvmrc`) |
| **Deployment** | Docker, Caddy reverse proxy |

## Repository Structure

```
buenbocado/
├── apps/
│   ├── api/              # Fastify backend API (port 4000)
│   ├── client/           # Customer Next.js app (port 3000)
│   └── restaurant/       # Restaurant management app (port 3001)
├── packages/
│   ├── config/           # Shared ESLint & TypeScript configs
│   ├── db/               # Prisma schema & migrations
│   └── ui/               # Shared React components & Tailwind preset
├── scripts/              # Dev utilities (seeding, inspection)
├── docs/                 # Product & technical documentation
├── docker-compose.yml    # Local dev (PostgreSQL only)
└── docker-compose.prod.yml  # Production stack
```

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
pnpm db:up

# Run database migrations
pnpm db:migrate

# Start all apps in dev mode
pnpm dev

# Individual app development
pnpm --filter @buenbocado/api dev      # API on :4000
pnpm --filter @buenbocado/client dev   # Client on :3000
pnpm --filter @buenbocado/restaurant dev  # Restaurant on :3001
```

## Key Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Run all apps in parallel (Turbo) |
| `pnpm build` | Build all apps |
| `pnpm lint` | ESLint all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm format` | Check Prettier formatting |
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:studio` | Open Prisma Studio GUI |

## Database Schema (Key Models)

Located at `packages/db/prisma/schema.prisma`:

- **Restaurant**: Name, address, coordinates (lat/lng), zone tag, commission (basis points), settlement config
- **RestaurantUser**: Email auth, roles (OWNER/MANAGER/STAFF), links to restaurant
- **Menu**: Offers with type (TAKEAWAY/DINEIN), pricing (cents), time windows, inventory quantity, image URL
- **Order**: Status tracking (CREATED→PREPARING→READY→DELIVERED), customer info, 6-digit pickup code, commission tracking

### Enums
- `MenuType`: TAKEAWAY | DINEIN
- `OrderStatus`: CREATED | PREPARING | READY | DELIVERED | CANCELLED | NOSHOW
- `RestaurantUserRole`: OWNER | MANAGER | STAFF
- `SettlementMode`: WEEKLY_CALENDAR | ROLLING_7D | CUSTOM_RANGE

## API Endpoints (apps/api)

Main implementation in `apps/api/src/index.ts`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/menus/active` | GET | List available menus (supports lat/lng for distance) |
| `/api/menus/:id` | GET | Menu details |
| `/api/orders` | POST | Create order (transactional, manages stock) |
| `/api/restaurant/menus` | POST | Create/update menu offer |
| `/api/admin/restaurants` | GET/POST/PUT | Restaurant CRUD |
| `/api/restaurant/orders` | GET | List orders for restaurant |
| `/api/uploads/menu-image` | POST | Image upload with Sharp optimization |
| `/api/restaurants/:id/orders/mark-delivered` | POST | Mark orders as delivered |

## File Naming Conventions

- **Components**: PascalCase (e.g., `HomeOffers.tsx`, `CartPill.tsx`)
- **Pages**: Next.js App Router convention (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- **Private folders**: Underscore prefix (`_components/`, `_state/`)
- **Dynamic routes**: Bracket syntax (`[id]/`, `[orderId]/`, `[rid]/`)

## Code Style & Conventions

### TypeScript
- Strict TypeScript throughout the codebase
- Use `@prisma/client` generated types for database models
- Prices stored in **cents** (integers) - never use floats for money
- Commission stored in **basis points** (e.g., 1200 = 12%)

### React/Next.js
- Use Next.js App Router (not Pages Router)
- Shared UI components in `packages/ui` (Button, Card, Chip)
- Client state via React Context (see `apps/client/app/_state/cart.tsx`)
- Tailwind CSS for styling with shared preset from `packages/ui`

### API Development
- All endpoints prefixed with `/api/`
- Use Prisma transactions for operations affecting multiple records (e.g., order creation with stock decrement)
- CORS configured per environment - production requires explicit `CORS_ORIGINS`
- Image uploads optimized with Sharp (auto-rotation, resize to 1600x1000, compression)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://buenbocado:password@localhost:5432/buenbocado?schema=public"
POSTGRES_USER=buenbocado
POSTGRES_PASSWORD=your_password
POSTGRES_DB=buenbocado

# API
PUBLIC_BASE_URL=http://localhost:4000

# Next.js apps
NEXT_PUBLIC_API_URL=http://localhost:4000

# CORS (production only - comma-separated)
CORS_ORIGINS=https://app.example.com,https://r.example.com

# Production domains
API_DOMAIN=api.example.com
APP_DOMAIN=app.example.com
RESTAURANT_DOMAIN=r.example.com
ACME_EMAIL=admin@example.com
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. Checkout → Install pnpm → Setup Node (from `.nvmrc`)
2. `pnpm install`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm build`

Triggers on: push to `main`, all pull requests.

## Working with the Monorepo

### Package References
- Import shared UI: `import { Button, Card } from "@buenbocado/ui"`
- Import Prisma client: `import { PrismaClient } from "@prisma/client"`
- Shared configs referenced via `packages/config`

### Turborepo Tasks
Defined in `turbo.json`:
- `dev`: No cache, persistent (watch mode)
- `build`: Depends on `^build`, outputs `.next/**`, `dist/**`
- `lint`: Depends on `^lint`
- `typecheck`: Depends on `^typecheck`

### Adding Dependencies
```bash
# Root workspace
pnpm add -w <package>

# Specific app/package
pnpm --filter @buenbocado/api add <package>
pnpm --filter @buenbocado/client add <package>
```

## Key Implementation Details

### Distance Calculations
The API uses Haversine formula for calculating user-to-restaurant distances based on lat/lng coordinates.

### Order Codes
Orders generate a 6-digit alphanumeric code for pickup verification. These are indexed for quick lookup.

### Image Processing
Menu images are processed with Sharp:
- Auto-rotation based on EXIF data
- Resize to max 1600x1000
- JPEG compression (quality 80)
- Stored in `apps/api/uploads/`

### Stock Management
Order creation uses Prisma transactions to atomically decrement menu quantity, preventing overselling.

## Documentation

- `docs/PRODUCT.md` - Product description and user flows
- `docs/API.md` - API endpoint specifications
- `docs/DATA_MODEL.md` - Prisma schema explanation

## Testing

Currently no automated tests. CI validates:
- ESLint rules pass
- TypeScript compiles without errors
- All apps build successfully

## Production Deployment

Uses `docker-compose.prod.yml` with:
- **Caddy**: Reverse proxy with automatic HTTPS
- **PostgreSQL**: Database with health checks
- **API, Client, Restaurant**: Node.js services

Security features: Internal network isolation, dropped capabilities, strict security headers.

## Common Tasks for AI Assistants

### Adding a New API Endpoint
1. Edit `apps/api/src/index.ts`
2. Follow existing patterns for request validation
3. Use Prisma for database operations
4. Return consistent JSON response format

### Adding a New Page
1. Create file in appropriate `apps/*/app/` directory
2. Use Next.js App Router conventions
3. Import shared UI components from `@buenbocado/ui`
4. Style with Tailwind CSS classes

### Modifying Database Schema
1. Edit `packages/db/prisma/schema.prisma`
2. Run `pnpm db:migrate` to create migration
3. Regenerate Prisma client (automatic with migration)

### Running Specific Package Commands
```bash
pnpm --filter @buenbocado/db prisma studio
pnpm --filter @buenbocado/api build
pnpm --filter @buenbocado/client lint
```

## Important Notes

- This is an MVP - some features are pending (auth, payments, notifications)
- Spanish language is used in UI and some documentation
- All monetary values use integer cents (never floats)
- The API serves both Next.js apps; CORS is configured accordingly
- Backup files (`*.bak`, `*.backup`) are gitignored
