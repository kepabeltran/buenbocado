# Fase 3 — Panel Admin Completo: Guía de integración

## Archivos

### NUEVOS:
```
apps/api/src/admin-routes.ts                ← Endpoints admin (stats, orders, offers, users)
apps/client/app/admin/layout.tsx            ← Layout admin con nav + auth protection
apps/client/app/admin/orders/page.tsx       ← Supervisión pedidos (buscar, filtrar, cambiar estado)
apps/client/app/admin/offers/page.tsx       ← Supervisión ofertas (buscar, filtrar)
apps/client/app/admin/users/page.tsx        ← Gestión usuarios restaurante (crear, reset pwd)
```

### NO SE REEMPLAZAN (pero necesitan un cambio menor):
```
apps/client/app/admin/restaurants/page.tsx  ← Añadir header Authorization a los fetch
```

## Pasos

### 1. Copiar archivos

### 2. Registrar admin-routes en index.ts
Añadir junto a los otros registros:
```typescript
import { registerAdminRoutes } from "./admin-routes.js";
registerAdminRoutes(app, prisma);
```

### 3. Añadir Authorization a la página de restaurantes existente
La página actual de /admin/restaurants no envía el token.
Necesitas añadir el header a los 3 fetch que hace:
- GET /api/admin/restaurants → añadir { headers: { Authorization: "Bearer " + token } }
- POST /api/admin/restaurants → añadir Authorization header
- PATCH /api/admin/restaurants/:id → añadir Authorization header

Donde token = localStorage.getItem("bb_access_token")

### 4. Probar
- http://localhost:3000/admin/login → login
- La barra de navegación ahora tiene: Restaurantes, Pedidos, Ofertas, Usuarios
- Probar cada sección

## Endpoints nuevos

| Método | Ruta                              | Descripción                     |
|--------|-----------------------------------|---------------------------------|
| GET    | /api/admin/stats                  | KPIs globales                   |
| GET    | /api/admin/orders                 | Pedidos (filtros + paginación)  |
| PATCH  | /api/admin/orders/:id/status      | Cambiar estado + auditoría      |
| GET    | /api/admin/offers                 | Ofertas (filtros + paginación)  |
| GET    | /api/admin/restaurant-users       | Listar usuarios restaurante     |
