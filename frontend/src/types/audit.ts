import type { AssetData } from './asset';

export interface AuditCycleData {
  id: string;
  title: string;
  departmentId: string;
  department?: { id: string; name: string };
  location: string | null;
  startDate: string;
  endDate: string;
  assignedAuditors: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
  closedAt: string | null;
}

export interface AuditRecordData {
  id: string;
  auditCycleId: string;
  assetId: string;
  asset?: AssetData;
  expectedLocation: string;
  actualLocation: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'MISSING' | 'DAMAGED';
  remarks: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
}

export interface DiscrepancyData {
  id: string;
  auditCycleId: string;
  assetId: string;
  asset?: AssetData;
  issueType: 'MISSING' | 'DAMAGED';
  severity: 'HIGH' | 'MEDIUM';
  resolutionStatus: 'PENDING' | 'RESOLVED';
  generatedAt: string;
}
