-- CreateTable
CREATE TABLE "product_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "geometryType" TEXT NOT NULL DEFAULT 'rectangular',
    "fixedPrice" DECIMAL(10,4),
    "canBeAccessory" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "process_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_processes" (
    "id" TEXT NOT NULL,
    "catalogProductId" TEXT NOT NULL,
    "processTypeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "machineId" TEXT,

    CONSTRAINT "manufacturing_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_materials" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4),
    "unit" TEXT,

    CONSTRAINT "process_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_code_key" ON "product_catalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "materials_name_key" ON "materials"("name");

-- CreateIndex
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "process_types_code_key" ON "process_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturing_processes_catalogProductId_order_key" ON "manufacturing_processes"("catalogProductId", "order");

-- AddForeignKey
ALTER TABLE "manufacturing_processes" ADD CONSTRAINT "manufacturing_processes_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "product_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_processes" ADD CONSTRAINT "manufacturing_processes_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "process_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_processes" ADD CONSTRAINT "manufacturing_processes_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_materials" ADD CONSTRAINT "process_materials_processId_fkey" FOREIGN KEY ("processId") REFERENCES "manufacturing_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_materials" ADD CONSTRAINT "process_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
