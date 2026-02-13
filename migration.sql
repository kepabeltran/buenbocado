-- Add address fields to Customer
ALTER TABLE "Customer" ADD COLUMN "address" TEXT;
ALTER TABLE "Customer" ADD COLUMN "city" TEXT;
ALTER TABLE "Customer" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN "lat" DOUBLE PRECISION;
ALTER TABLE "Customer" ADD COLUMN "lng" DOUBLE PRECISION;
