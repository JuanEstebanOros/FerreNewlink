-- AlterTable
ALTER TABLE "Product" ADD COLUMN "meliItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_meliItemId_key" ON "Product"("meliItemId");
