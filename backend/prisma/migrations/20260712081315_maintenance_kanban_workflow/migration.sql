/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Maintenance` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Maintenance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTechnician" TEXT,
    "requestedById" TEXT,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "scheduledFor" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "startedAt" DATETIME,
    "resolvedAt" DATETIME,
    "resolutionNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Maintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Maintenance_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Maintenance" ("assetId", "cost", "createdAt", "description", "id", "scheduledFor", "startedAt", "status") SELECT "assetId", "cost", "createdAt", "description", "id", "scheduledFor", "startedAt", "status" FROM "Maintenance";
DROP TABLE "Maintenance";
ALTER TABLE "new_Maintenance" RENAME TO "Maintenance";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
