# CLAUDE.md - AI Assistant Guide for Buen Bocado

## Project Overview

**Buen Bocado** ("Good Bite") is a marketplace MVP connecting customers with restaurant menus at fair prices. The tagline is "Buen precio, mejor bocado" (Good price, better bite).

The platform has three main user types:
- **Customers**: Browse nearby menus, place orders, receive QR tickets
- **Restaurants**: Publish menus quickly, manage incoming orders
- **Admins**: Manage restaurants, configure commissions

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Monorepo | Turborepo + pnpm workspaces | pnpm 9.12.3 |
| Language | TypeScript | 5.5.4 |
| Runtime | Node.js | v22 (see `.nvmrc`) |
| Backend | Fastify | 4.28.1 |
| Frontend | Next.js (App Router) | 14.2.5 |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 5.18.0 |
| Styling | Tailwind CSS | 3.4.10 |
| Reverse Proxy | Caddy | 2 (production) |

## Repository Structure

```
buenbocado/
├── apps/
│   ├── api/                 # Fastify REST API (port 4000)
│   ├── client/              # Next.js customer app (port 3000)
│   └── restaurant/          # Next.js restaurant panel (port 3001)
├── packages/
│   ├── db/                  # Prisma schema, migrations, client
│   ├── ui/                  # Shared React components + Tailwind preset
│   └── config/              # Shared ESLint & TypeScript configs
├── scripts/                 # Dev utilities (seed scripts, smoke tests)
├── docs/                    # Product, API, data model docs
├── docker-compose.yml       # Local Postgres
├── docker-compose.prod.yml  # Production stack
├── Caddyfile               # Production reverse proxy config
└── turbo.json              # Turborepo task configuration
```

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start local Postgres
pnpm db:up

# Run database migrations
pnpm db:migrate

# Start all apps in development mode
pnpm dev

# Build all apps
pnpm build

# Lint entire monorepo
pnpm lint

# Type check entire monorepo
pnpm typecheck

# Open Prisma Studio (database GUI)
pnpm db:studio

# Stop local Postgres
pnpm db:down
```

## Development Ports

- **Client (customer app)**: http://localhost:3000
- **Restaurant panel**: http://localhost:3001
- **API**: http://localhost:4000
- **PostgreSQL (dev)**: localhost:15432

## Architecture Patterns

### API Structure (`apps/api/src/index.ts`)

- Main entry point is a single file (~900 lines)
- Uses Fastify with CORS (requires `CORS_ORIGINS` env in production)
- API responses follow pattern: `{ ok: true, data: {...} }` or `{ ok: false, error: "CODE", message: "..." }`
- Image uploads use Sharp for processing (16:10 aspect ratio, 1600x1000px, JPEG)
- Location-based queries use Haversine formula for distance calculation

### Frontend Apps

Both Next.js apps use the App Router (not Pages Router):
- No `/src` directory - pages are directly in `/app`
- Components in `/_components`
- State management in `/_state`
- Data fetching utilities in `/_data`

### Shared Packages

**@buenbocado/db**:
- Exports `PrismaClient` singleton
- Schema at `packages/db/prisma/schema.prisma`

**@buenbocado/ui**:
- Exports: `Button`, `Card`, `Chip` components
- Tailwind preset at `packages/ui/tailwind-preset.js`

## Database Schema (Prisma)

### Core Models

**Restaurant**
- Primary business entity with location (`lat`, `lng`), contact info
- Commission configured in basis points (`commissionBps`: 1200 = 12%)
- Settlement configuration for payouts

**Menu**
- Belongs to Restaurant
- Types: `TAKEAWAY` | `DINEIN`
- Time-bound availability (`availableFrom`, `availableTo`, `expiresAt`)
- Stock tracking via `quantity` field

**Order**
- Belongs to Menu
- Statuses: `CREATED` → `PREPARING` → `READY` → `DELIVERED` | `CANCELLED` | `NOSHOW`
- Has 6-character alphanumeric `code` for pickup
- Freezes pricing at purchase time (`totalCents`, `commissionBpsAtPurchase`)

**RestaurantUser**
- Authentication for restaurant staff
- Roles: `OWNER` | `MANAGER` | `STAFF`

### Key Enums

```prisma
enum MenuType { TAKEAWAY, DINEIN }
enum OrderStatus { CREATED, PREPARING, READY, DELIVERED, CANCELLED, NOSHOW }
enum RestaurantUserRole { OWNER, MANAGER, STAFF }
enum SettlementMode { WEEKLY_CALENDAR, ROLLING_7D, CUSTOM_RANGE }
```

## API Endpoints Reference

### Public (Customer)
- `GET /api/health` - Health check
- `GET /api/menus/active?lat=X&lng=Y` - Active menus with distance
- `GET /api/menus/:id?lat=X&lng=Y` - Menu detail
- `POST /api/orders` - Create order (decrements stock atomically)
- `GET /api/orders/:id` - Order detail with pricing breakdown

### Restaurant Panel
- `POST /api/restaurant/menus` - Create menu
- `PATCH /api/restaurant/menus/:id` - Update menu
- `GET /api/restaurant/orders?restaurantId=X` - List orders
- `POST /api/restaurant/orders/mark-delivered` - Mark order delivered
- `POST /api/uploads/menu-image` - Upload image (multipart, max 5MB)

### Admin
- `POST /api/admin/restaurants` - Create restaurant
- `GET /api/admin/restaurants` - List all restaurants
- `PATCH /api/admin/restaurants/:id` - Update restaurant config

## Code Conventions

### TypeScript
- Strict mode enabled throughout
- Use explicit types for function parameters and returns
- Prisma types are available from `@buenbocado/db`

### Styling
- Tailwind CSS utility classes only (no CSS modules)
- Use shared components from `@buenbocado/ui` when applicable
- Brand colors available: `brand-50` through `brand-900`
- Mobile-first responsive design (`md:` breakpoints)

### API Patterns
- All amounts in cents (`priceCents`, `totalCents`)
- Dates as ISO strings in responses
- Use Prisma transactions for operations affecting multiple records
- Stock operations must be atomic (use `$transaction`)

### File Naming
- React components: PascalCase (`CartPill.tsx`)
- Utilities and hooks: camelCase (`useCart.ts`)
- API routes: kebab-case in URLs

## Environment Variables

Required for development (see `.env.example`):
```bash
DATABASE_URL=postgresql://buenbocado:buenbocado@localhost:15432/buenbocado
```

Required for production:
```bash
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://app.domain.com,https://restaurant.domain.com
PUBLIC_BASE_URL=https://api.domain.com
NEXT_PUBLIC_API_URL=https://api.domain.com
```

## Common Tasks for AI Assistants

### Adding a New API Endpoint
1. Add route in `apps/api/src/index.ts`
2. Use Prisma for database operations
3. Follow response pattern: `{ ok: true, data: {...} }`
4. Add CORS if needed for new origins

### Adding a New Page (Client or Restaurant)
1. Create file in `apps/[app]/app/[route]/page.tsx`
2. Use `"use client"` directive if client-side interactivity needed
3. Fetch data using utilities in `/_data`
4. Use shared components from `@buenbocado/ui`

### Database Schema Changes
1. Modify `packages/db/prisma/schema.prisma`
2. Run `pnpm db:migrate` to create migration
3. Prisma client regenerates automatically

### Adding Shared UI Components
1. Create component in `packages/ui/src/`
2. Export from `packages/ui/src/index.ts`
3. Import as `import { Component } from "@buenbocado/ui"`

## Important Files

| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | Main API with all endpoints |
| `packages/db/prisma/schema.prisma` | Database schema |
| `apps/client/app/_state/cart.tsx` | Client cart state management |
| `packages/ui/tailwind-preset.js` | Shared Tailwind configuration |
| `turbo.json` | Build pipeline configuration |
| `docker-compose.prod.yml` | Production deployment |

## Testing

Currently no automated tests configured. Manual testing approach:
- Use `scripts/tpv_smoke_test.ps1` for smoke testing
- Use `scripts/seed_restaurant_dev.js` to seed test data
- Test API endpoints with tools like Postman or curl

## Deployment

Production uses Docker Compose with:
- **Caddy**: Reverse proxy with automatic SSL
- **PostgreSQL 16**: Database with persistent volume
- **Node services**: API, Client, Restaurant apps

All services communicate on internal `bb_internal` network. Only Caddy exposes ports 80/443 externally.

## Known Limitations (MVP)

- No authentication implemented yet (placeholder login pages exist)
- Payments are mocked
- No push notifications
- No unit/integration tests
- Settlement/payout system not complete

## Language Notes

- Code and technical docs are in English
- User-facing content and some docs are in Spanish
- Variable names and comments should be in English

## Git Workflow

- CI runs on push to main and PRs: lint, typecheck, build
- No automated tests in CI currently
- Commits should be atomic and descriptive
