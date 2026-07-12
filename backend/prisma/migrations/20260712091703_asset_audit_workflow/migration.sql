-- CreateTable
CREATE TABLE "AuditCycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "location" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "assignedAuditors" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "AuditCycle_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditCycleId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "expectedLocation" TEXT NOT NULL,
    "actualLocation" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    CONSTRAINT "AuditRecord_auditCycleId_fkey" FOREIGN KEY ("auditCycleId") REFERENCES "AuditCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscrepancyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditCycleId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "resolutionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscrepancyReport_auditCycleId_fkey" FOREIGN KEY ("auditCycleId") REFERENCES "AuditCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DiscrepancyReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
