-- CreateTable
CREATE TABLE "AssetDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetTag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "status" TEXT NOT NULL,
    "serialNumber" TEXT,
    "model" TEXT,
    "location" TEXT,
    "value" REAL NOT NULL DEFAULT 0.0,
    "expectedReturnDate" DATETIME,
    "departmentId" TEXT,
    "condition" TEXT,
    "purchaseDate" DATETIME,
    "purchaseCost" REAL NOT NULL DEFAULT 0.0,
    "bookable" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("assetTag", "categoryId", "createdAt", "departmentId", "expectedReturnDate", "id", "location", "model", "name", "serialNumber", "status", "value") SELECT "assetTag", "categoryId", "createdAt", "departmentId", "expectedReturnDate", "id", "location", "model", "name", "serialNumber", "status", "value" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
