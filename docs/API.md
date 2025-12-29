# API Buen Bocado (MVP)

Base URL (dev): `http://localhost:4000`

## Endpoints

### GET /health
Respuesta:
```json
{ "status": "ok" }
```

### GET /menus?zone=&type=&priceMin=&priceMax=&sort=
Respuesta:
```json
{
  "data": [
    {
      "id": "menu-1",
      "restaurant": "La Esquina",
      "type": "TAKEAWAY",
      "title": "Menú mediterráneo",
      "description": "Ensalada fresca, pasta al pesto y pan artesanal.",
      "priceCents": 850,
      "currency": "EUR",
      "timeRemaining": "45 min",
      "distanceKm": 1.2,
      "badge": "Precio ajustado"
    }
  ]
}
```

### GET /menus/:id
Respuesta:
```json
{
  "data": {
    "id": "menu-1",
    "restaurant": "La Esquina",
    "type": "TAKEAWAY",
    "title": "Menú mediterráneo",
    "description": "Ensalada fresca, pasta al pesto y pan artesanal.",
    "priceCents": 850,
    "currency": "EUR",
    "timeRemaining": "45 min",
    "distanceKm": 1.2,
    "badge": "Precio ajustado"
  }
}
```

### POST /orders
Respuesta:
```json
{ "orderId": "order-123", "code": "BB-4F2K" }
```

### GET /orders/:id
Respuesta:
```json
{
  "id": "order-123",
  "status": "CREATED",
  "code": "BB-4F2K",
  "pickup": "Hoy 19:30",
  "instructions": "Muestra este código en caja para retirar tu pedido."
}
```

### POST /restaurant/menus (opcional)
Respuesta:
```json
{ "ok": true, "id": "menu-new" }
```
