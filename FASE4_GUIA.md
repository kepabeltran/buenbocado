# Fase 4 — Liquidaciones: Guía de integración

## Archivos

### NUEVOS:
```
apps/api/src/settlement-routes.ts                  ← Endpoints liquidaciones
apps/client/app/admin/settlements/page.tsx         ← Admin: generar/listar/gestionar
apps/restaurant/app/r/settlements/page.tsx         ← Restaurante: ver mis liquidaciones
packages/db/prisma/schema.prisma                   ← Schema actualizado con Settlement
```

## Pasos

### 1. Copiar schema.prisma (REEMPLAZAR)
### 2. Copiar los 3 archivos nuevos
### 3. Ejecutar migración:
```bash
cd packages\db
npx prisma migrate dev --name add_settlements
```

### 4. Registrar rutas en index.ts:
```typescript
import { registerSettlementRoutes } from "./settlement-routes.js";
registerSettlementRoutes(app, prisma);
```

### 5. Añadir "Liquidaciones" al nav del admin layout:
En apps/client/app/admin/layout.tsx, añadir al array NAV_ITEMS:
```typescript
{ href: "/admin/settlements", label: "Liquidaciones" },
```

### 6. Añadir "Liquidaciones" al dashboard del restaurante:
En apps/restaurant/app/r/page.tsx, añadir un Link a /r/settlements

### 7. Probar
- Admin: http://localhost:3000/admin/settlements → generar liquidación
- Restaurante: http://localhost:3001/r/settlements → ver liquidaciones
