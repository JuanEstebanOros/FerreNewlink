-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Category" ("createdAt", "id", "name", "slug") SELECT "createdAt", "id", "name", "slug" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exchangeRate" REAL NOT NULL DEFAULT 40,
    "whatsappNumber" TEXT NOT NULL DEFAULT '+573108264892',
    "storeAddress" TEXT NOT NULL DEFAULT 'Cra. 45 #12-30, Barrio Industrial, Bogota, Colombia',
    "storePhone" TEXT NOT NULL DEFAULT '+57 601 555 0192',
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "mercadolibreUrl" TEXT,
    "tiktokUrl" TEXT
);
INSERT INTO "new_Settings" ("exchangeRate", "id", "whatsappNumber") SELECT "exchangeRate", "id", "whatsappNumber" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
