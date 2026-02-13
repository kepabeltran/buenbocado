# Fase 2 — Portal Restaurante Completo: Guía de integración

## Archivos

### NUEVOS:
```
apps/api/src/restaurant-routes.ts      ← Endpoints autenticados del restaurante
apps/restaurant/app/r/offers/page.tsx  ← Página "Mis ofertas" (pausar/activar/duplicar)
```

### REEMPLAZAN existentes:
```
apps/restaurant/app/r/page.tsx         ← Dashboard con datos reales
apps/restaurant/app/r/orders/page.tsx  ← Pedidos con auth
```

## Pasos

### 1. Copiar archivos
Copiar los 4 archivos a sus rutas en buenbocado_ok.

### 2. Registrar las rutas en index.ts
Añadir junto al registerAuthRoutes en apps/api/src/index.ts:

```typescript
import { registerRestaurantRoutes } from "./restaurant-routes.js";
registerRestaurantRoutes(app, prisma);
```

### 3. Probar
- Dashboard: http://localhost:3001/r → datos reales
- Mis ofertas: http://localhost:3001/r/offers → lista con acciones
- Pedidos: http://localhost:3001/r/orders → validación autenticada

## Endpoints nuevos

| Método | Ruta                                         | Descripción              |
|--------|----------------------------------------------|--------------------------|
| GET    | /api/restaurant/me/stats                     | Stats del dashboard      |
| GET    | /api/restaurant/me/menus                     | Mis ofertas              |
| POST   | /api/restaurant/me/menus/:id/duplicate       | Duplicar oferta          |
| POST   | /api/restaurant/me/menus/:id/pause           | Pausar oferta            |
| POST   | /api/restaurant/me/menus/:id/activate        | Activar/reactivar oferta |
| GET    | /api/restaurant/me/orders                    | Mis pedidos (auth)       |
| POST   | /api/restaurant/me/orders/mark-delivered     | Marcar entregado (auth)  |
