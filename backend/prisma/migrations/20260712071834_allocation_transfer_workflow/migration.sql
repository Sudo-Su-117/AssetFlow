-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Allocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allocatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" DATETIME,
    "expectedReturnDate" DATETIME,
    "conditionAtAllocation" TEXT,
    "conditionAtReturn" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "allocatedById" TEXT,
    CONSTRAINT "Allocation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Allocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Allocation_allocatedById_fkey" FOREIGN KEY ("allocatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Allocation" ("allocatedAt", "assetId", "id", "notes", "returnedAt", "userId") SELECT "allocatedAt", "assetId", "id", "notes", "returnedAt", "userId" FROM "Allocation";
DROP TABLE "Allocation";
ALTER TABLE "new_Allocation" RENAME TO "Allocation";
CREATE TABLE "new_Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "fromDepartmentId" TEXT NOT NULL,
    "toDepartmentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "reason" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    CONSTRAINT "Transfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transfer" ("approvedAt", "approvedById", "assetId", "fromDepartmentId", "id", "requestedAt", "requestedById", "status", "toDepartmentId") SELECT "approvedAt", "approvedById", "assetId", "fromDepartmentId", "id", "requestedAt", "requestedById", "status", "toDepartmentId" FROM "Transfer";
DROP TABLE "Transfer";
ALTER TABLE "new_Transfer" RENAME TO "Transfer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
