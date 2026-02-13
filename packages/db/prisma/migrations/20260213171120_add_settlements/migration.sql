-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID', 'DISPUTED');

-- DropIndex
DROP INDEX "AdminUser_isActive_idx";

-- DropIndex
DROP INDEX "Customer_isActive_idx";

-- DropIndex
DROP INDEX "Order_customerId_idx";

-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "settlementId" TEXT;

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'DRAFT',
    "totalOrdersCents" INTEGER NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
    "netToRestaurantCents" INTEGER NOT NULL DEFAULT 0,
    "commissionBps" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "confirmedBy" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Settlement_restaurantId_idx" ON "Settlement"("restaurantId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "Settlement_periodStart_idx" ON "Settlement"("periodStart");

-- CreateIndex
CREATE INDEX "Order_settlementId_idx" ON "Order"("settlementId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
