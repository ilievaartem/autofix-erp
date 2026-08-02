-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'MECHANIC', 'CLIENT');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('NEW', 'AI_TRIAGE', 'QUEUED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ServiceItemType" AS ENUM ('SERVICE', 'PART');

-- CreateEnum
CREATE TYPE "ServiceItemUnit" AS ENUM ('PIECE', 'HOUR', 'LITER', 'KIT');

-- CreateTable
CREATE TABLE "Workshop" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'UAH',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Kyiv',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "workshopId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "workshopId" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "vin" VARCHAR(17),
    "licensePlate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" UUID NOT NULL,
    "workshopId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "assignedMechanicId" UUID,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'NEW',
    "rawText" TEXT NOT NULL,
    "aiCategory" TEXT,
    "aiDiagnosis" TEXT,
    "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiPriority" "RequestPriority" NOT NULL DEFAULT 'NORMAL',
    "mechanicChecklist" JSONB,
    "dviPhotoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mechanicComments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "finalAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceItem" (
    "id" UUID NOT NULL,
    "workshopId" UUID NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ServiceItemType" NOT NULL,
    "unit" "ServiceItemUnit" NOT NULL DEFAULT 'PIECE',
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "stockQuantity" DECIMAL(12,3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" UUID NOT NULL,
    "workshopId" UUID NOT NULL,
    "serviceRequestId" UUID NOT NULL,
    "serviceItemId" UUID NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workshop_slug_key" ON "Workshop"("slug");

-- CreateIndex
CREATE INDEX "User_workshopId_role_idx" ON "User"("workshopId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_workshopId_key" ON "User"("id", "workshopId");

-- CreateIndex
CREATE UNIQUE INDEX "User_workshopId_email_key" ON "User"("workshopId", "email");

-- CreateIndex
CREATE INDEX "Vehicle_workshopId_ownerId_idx" ON "Vehicle"("workshopId", "ownerId");

-- CreateIndex
CREATE INDEX "Vehicle_workshopId_licensePlate_idx" ON "Vehicle"("workshopId", "licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_id_workshopId_key" ON "Vehicle"("id", "workshopId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_workshopId_vin_key" ON "Vehicle"("workshopId", "vin");

-- CreateIndex
CREATE INDEX "ServiceRequest_workshopId_status_idx" ON "ServiceRequest"("workshopId", "status");

-- CreateIndex
CREATE INDEX "ServiceRequest_workshopId_vehicleId_idx" ON "ServiceRequest"("workshopId", "vehicleId");

-- CreateIndex
CREATE INDEX "ServiceRequest_workshopId_assignedMechanicId_idx" ON "ServiceRequest"("workshopId", "assignedMechanicId");

-- CreateIndex
CREATE INDEX "ServiceRequest_workshopId_createdAt_idx" ON "ServiceRequest"("workshopId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_id_workshopId_key" ON "ServiceRequest"("id", "workshopId");

-- CreateIndex
CREATE INDEX "ServiceItem_workshopId_type_isActive_idx" ON "ServiceItem"("workshopId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceItem_id_workshopId_key" ON "ServiceItem"("id", "workshopId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceItem_workshopId_sku_key" ON "ServiceItem"("workshopId", "sku");

-- CreateIndex
CREATE INDEX "RequestItem_workshopId_serviceRequestId_idx" ON "RequestItem"("workshopId", "serviceRequestId");

-- CreateIndex
CREATE INDEX "RequestItem_workshopId_serviceItemId_idx" ON "RequestItem"("workshopId", "serviceItemId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_workshopId_fkey" FOREIGN KEY ("ownerId", "workshopId") REFERENCES "User"("id", "workshopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_vehicleId_workshopId_fkey" FOREIGN KEY ("vehicleId", "workshopId") REFERENCES "Vehicle"("id", "workshopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedMechanicId_workshopId_fkey" FOREIGN KEY ("assignedMechanicId", "workshopId") REFERENCES "User"("id", "workshopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceItem" ADD CONSTRAINT "ServiceItem_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_serviceRequestId_workshopId_fkey" FOREIGN KEY ("serviceRequestId", "workshopId") REFERENCES "ServiceRequest"("id", "workshopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_serviceItemId_workshopId_fkey" FOREIGN KEY ("serviceItemId", "workshopId") REFERENCES "ServiceItem"("id", "workshopId") ON DELETE RESTRICT ON UPDATE CASCADE;
