# Data Model (Prisma)

## Restaurant
- `id` (cuid)
- `name`
- `address`
- `lat`, `lng`
- `zoneTag`
- `createdAt`

## Menu
- `id` (cuid)
- `restaurantId` (FK)
- `type` (TAKEAWAY | DINEIN)
- `title`
- `description`
- `priceCents`
- `currency`
- `quantity`
- `availableFrom`
- `availableTo`
- `expiresAt`
- `allowTimeAdjustment`
- `createdAt`

## Order
- `id` (cuid)
- `menuId` (FK)
- `status` (CREATED | PREPARING | READY | DELIVERED | CANCELLED | NOSHOW)
- `customerName`
- `customerEmail`
- `code`
- `createdAt`
