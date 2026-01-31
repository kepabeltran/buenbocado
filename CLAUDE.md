# CLAUDE.md - Buen Bocado

This document provides context for AI assistants working with this codebase.

## Project Overview

**Buen Bocado** ("Good Bite") is a food marketplace MVP connecting customers with available restaurant menus/offers at honest final prices. The tagline is "Buen precio, mejor bocado" (Good price, better bite).

The platform has three main user flows:
- **Customer (client)**: Browse nearby offers, order, and pick up
- **Restaurant**: Publish menus quickly, manage orders
- **Admin**: Manage restaurants and configurations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 14 (App Router) + React 18 |
| Backend | Fastify 4 (ESM) |
| Database | PostgreSQL 16 + Prisma ORM |
| Styling | Tailwind CSS with shared preset |
| Language | TypeScript 5.5+ (strict mode) |
| CI | GitHub Actions |

## Repository Structure

```
buenbocado/
├── apps/
│   ├── client/          # Customer-facing Next.js app (port 3000)
│   ├── restaurant/      # Restaurant portal Next.js app (port 3001)
│   └── api/             # Fastify REST API (port 4000)
├── packages/
│   ├── ui/              # Shared React components + Tailwind preset
│   ├── config/          # Shared ESLint + TypeScript configs
│   └── db/              # Prisma schema + client
├── docs/                # Product, API, and data model documentation
├── scripts/             # Dev utilities (seed, smoke tests)
└── docker-compose.yml   # Local PostgreSQL
```

## Development Workflow

### Initial Setup

```bash
pnpm install                 # Install all dependencies
cp .env.example .env         # Create local env file
pnpm db:up                   # Start PostgreSQL (Docker)
pnpm db:migrate              # Run Prisma migrations
node scripts/seed_restaurant_dev.js  # Seed test restaurant
```

### Daily Development

```bash
pnpm dev          # Start all apps in parallel (Turborepo)
pnpm lint         # Lint entire monorepo
pnpm typecheck    # TypeScript check all packages
pnpm build        # Build all apps
```

### Database Commands

```bash
pnpm db:up        # Start PostgreSQL container
pnpm db:down      # Stop PostgreSQL container
pnpm db:migrate   # Run Prisma migrations (packages/db)
pnpm db:studio    # Open Prisma Studio GUI
```

### Development Ports

| App | URL |
|-----|-----|
| Client | http://localhost:3000 |
| Restaurant | http://localhost:3001 |
| API | http://localhost:4000 |

## Code Conventions

### TypeScript

- Strict mode enabled (`strict: true`)
- Use `type` for type aliases, `interface` for object shapes that may be extended
- Prefer explicit return types on exported functions
- Path aliases not used; use relative imports

### React/Next.js

- Use Next.js App Router (`app/` directory)
- Mark client components with `"use client"` directive
- Keep server components as default when possible
- Use shared UI components from `@buenbocado/ui`

### API Conventions

- All API routes prefixed with `/api/`
- Response format: `{ ok: boolean, data?: T, error?: string, message?: string }`
- Prices in cents (e.g., `priceCents: 850` = 8.50 EUR)
- Commission in basis points (e.g., `commissionBps: 1200` = 12%)
- Dates as ISO 8601 strings

### File Organization

- `app/_components/` - App-specific React components
- `app/_data/` - Data fetching utilities and mock data
- `app/_state/` - Client-side state management (Context/Reducer)
- Route folders match URL paths (e.g., `app/menu/[id]/page.tsx`)

## Data Model (Prisma)

### Core Entities

**Restaurant**
- `id`, `name`, `slug` (unique URL-friendly name)
- `address`, `lat`, `lng`, `zoneTag`
- `commissionBps` (platform fee in basis points)
- `settlementMode`, `settlementWeekday`, `settlementTimezone`
- `logoUrl`, `coverUrl`, `phone`, `contactPeople`

**Menu** (an available offer)
- `restaurantId`, `type` (TAKEAWAY | DINEIN)
- `title`, `description`, `priceCents`, `currency`
- `quantity` (available units)
- `availableFrom`, `availableTo`, `expiresAt`
- `imageUrl`, `allowTimeAdjustment`

**Order**
- `menuId`, `status` (CREATED | PREPARING | READY | DELIVERED | CANCELLED | NOSHOW)
- `customerName`, `customerEmail`, `code` (6-digit pickup code)
- `totalCents`, `commissionBpsAtPurchase`, `platformFeeCents`
- `deliveredAt`, `deliveredByUserId`

**RestaurantUser**
- `restaurantId`, `email`, `passwordHash`
- `role` (OWNER | MANAGER | STAFF)

### Prisma Commands

```bash
# From repo root
pnpm db:migrate              # Apply migrations
pnpm db:studio               # Open Prisma Studio

# From packages/db
npx prisma generate          # Regenerate client after schema changes
npx prisma migrate dev       # Create new migration
```

## API Endpoints Reference

### Public (Client)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/menus/active` | List active offers (supports `?lat=&lng=`) |
| GET | `/api/menus/:id` | Get menu details |
| POST | `/api/orders` | Create order (body: `menuId`, `customerName`, `customerEmail`) |
| GET | `/api/orders/:id` | Get order details |

### Restaurant Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurant/orders` | List orders (supports `?restaurantId=&take=`) |
| POST | `/api/restaurant/menus` | Create new menu/offer |
| PATCH | `/api/restaurant/menus/:id` | Update menu |
| POST | `/api/restaurant/orders/mark-delivered` | Mark order delivered (body: `code`) |
| POST | `/api/restaurants/:restaurantId/orders/mark-delivered` | Mark delivered (scoped) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/restaurants` | List all restaurants |
| POST | `/api/admin/restaurants` | Create restaurant |
| PATCH | `/api/admin/restaurants/:id` | Update restaurant |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/menu-image` | Upload menu image (multipart, 5MB max) |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://buenbocado:buenbocado@localhost:15432/buenbocado?schema=public"

# API
PUBLIC_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000

# CORS (production only - comma-separated origins)
CORS_ORIGINS=

# PostgreSQL (for docker-compose)
POSTGRES_USER=buenbocado
POSTGRES_PASSWORD=buenbocado
POSTGRES_DB=buenbocado
```

## Styling

### Tailwind Preset

All apps use the shared preset from `@buenbocado/ui/tailwind-preset`:

```ts
// tailwind.config.ts
import preset from "@buenbocado/ui/tailwind-preset";

export default {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ]
};
```

### Brand Colors

The `brand` color palette (orange tones) is the primary color:
- `brand-50` to `brand-900`
- Primary actions: `brand-500` / `brand-600`
- Background: `brand-50`

### Shared Components

Import from `@buenbocado/ui`:
- `Button` - Primary action button
- `Card` - Content container
- `Chip` - Tag/badge component

## State Management

The client app uses React Context + useReducer pattern:

- `CartProvider` / `useCart()` - Shopping cart state (persisted to localStorage)
- Cart is scoped to single restaurant (changing restaurant clears cart)

## Testing & CI

### CI Pipeline (GitHub Actions)

Runs on push to `main` and all PRs:
1. `pnpm install`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm build`

### Running Locally

```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm build       # Full build
```

## Common Tasks

### Adding a New API Endpoint

1. Add route handler in `apps/api/src/index.ts`
2. Follow existing patterns for request/response typing
3. Update `docs/API.md` if significant

### Adding a New Page (Client)

1. Create folder in `apps/client/app/` matching URL path
2. Add `page.tsx` (server component by default)
3. Use `"use client"` for interactive components

### Adding a New Shared Component

1. Create component in `packages/ui/src/`
2. Export from `packages/ui/src/index.ts`
3. Import as `import { Component } from "@buenbocado/ui"`

### Database Schema Changes

1. Edit `packages/db/prisma/schema.prisma`
2. Run `pnpm db:migrate` (creates migration + applies)
3. Prisma client auto-regenerates

## Language Notes

- UI text and product copy is in **Spanish**
- Code comments may be in Spanish or English
- Variable/function names are in **English**
- API error messages are in Spanish

## Important Caveats

- **No authentication yet**: Restaurant/admin endpoints are unprotected (MVP)
- **Payments are mocked**: No real payment processing
- **Uploads are local**: Images stored in `apps/api/uploads/` (not in git)
- **Single-file API**: All routes in `apps/api/src/index.ts` (to be refactored)

## Docker (Production)

For production deployment, see:
- `docker-compose.prod.yml` - Full stack with Caddy reverse proxy
- `Caddyfile` - HTTPS and routing configuration

## Useful Scripts

```bash
# Seed development restaurant
node scripts/seed_restaurant_dev.js

# Inspect an order (debug)
node scripts/inspect_order.js <order-id>

# TPV smoke test (PowerShell)
./scripts/tpv_smoke_test.ps1
```

## File Naming Conventions

- React components: PascalCase (`CartPill.tsx`)
- Utilities/hooks: camelCase (`useCart.ts`)
- Routes: lowercase with hyphens (folder names)
- Constants: UPPER_SNAKE_CASE

## Package Dependencies

When adding dependencies:
- Workspace packages use `file:` protocol (e.g., `"@buenbocado/ui": "file:../../packages/ui"`)
- Shared dev deps go in root `package.json`
- App-specific deps go in respective app's `package.json`
