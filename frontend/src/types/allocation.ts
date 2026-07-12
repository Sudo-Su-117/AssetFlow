import type { AssetData } from './asset';

export interface AllocationData {
  id: string;
  assetId: string;
  asset?: AssetData;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    department?: { id: string; name: string };
  };
  allocatedAt: string;
  returnedAt: string | null;
  expectedReturnDate: string | null;
  conditionAtAllocation: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | null;
  conditionAtReturn: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | null;
  status: 'ACTIVE' | 'CLOSED';
  notes: string | null;
  allocatedById: string | null;
  allocatedBy?: { name: string };
}

export interface TransferRequestData {
  id: string;
  assetId: string;
  asset?: AssetData;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromUserId: string | null;
  fromUser?: { id: string; name: string; email: string };
  toUserId: string | null;
  toUser?: { id: string; name: string; email: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedById: string;
  requestedBy?: { id: string; name: string };
  approvedById: string | null;
  approvedBy?: { id: string; name: string };
  reason: string | null;
  requestedAt: string;
  approvedAt: string | null;
}
